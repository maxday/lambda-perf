use std::{collections::HashMap, thread, time::Duration};

use async_trait::async_trait;
use aws_sdk_dynamodb::{
    types::{
        self, AttributeDefinition, BillingMode, KeySchemaElement, KeyType, ScalarAttributeType,
    },
    Client as DynamoDbClient,
};
use aws_sdk_lambda::Client as LambdaClient;
use aws_sdk_sqs::types::MessageAttributeValue;
use aws_sdk_sqs::Client as SQSClient;
use lambda_runtime::{service_fn, Error, LambdaEvent};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct Manifest {
    memory_sizes: Vec<u32>,
    runtimes: Vec<Runtime>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct Runtime {
    display_name: String,
    runtime: String,
    handler: String,
    path: String,
    architectures: Vec<String>,
    image: Image,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct Image {
    base_image: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Response {
    status_code: u32,
}

pub struct SQSDeployMessage {
    attributes: HashMap<String, MessageAttributeValue>,
    body: String,
}
impl SQSDeployMessage {
    fn new(attributes: HashMap<String, MessageAttributeValue>) -> Self {
        SQSDeployMessage {
            body: "deploy".to_string(),
            attributes,
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .with_ansi(false)
        .without_time()
        .init();
    let func = service_fn(func);
    lambda_runtime::run(func).await?;
    Ok(())
}

#[async_trait]
pub trait TableManager {
    async fn create(&self) -> Result<(), Error>;
    async fn delete(&self) -> Result<(), Error>;
    async fn wait_for_deletion(&self) -> Result<(), Error>;
    async fn wait_for_created(&self) -> Result<(), Error>;
}

#[async_trait]
pub trait PermissionManager {
    async fn remove_permission(&self) -> Result<(), Error>;
    async fn add_permission(&self) -> Result<(), Error>;
}

#[async_trait]
pub trait QueueManager {
    async fn send_message(&self, messages: Vec<SQSDeployMessage>) -> Result<(), Error>;
}

pub struct DynamoDBManager {
    pub client: DynamoDbClient,
    pub table_name: String,
}

pub struct SQSManager {
    pub client: SQSClient,
    pub queue_url: String,
}

pub struct LambdaManager {
    pub client: LambdaClient,
    pub log_processor_arn: String,
    pub statement_id: String,
}

impl SQSManager {
    pub async fn new(
        account_id: &str,
        region: &str,
        queue_name: &str,
        client: Option<SQSClient>,
    ) -> Self {
        let client = match client {
            Some(client) => client,
            None => {
                let config = aws_config::from_env().load().await;
                SQSClient::new(&config)
            }
        };
        let queue_url = SQSManager::build_queue_url(account_id, region, queue_name);
        SQSManager { client, queue_url }
    }
    fn build_queue_url(account_id: &str, region: &str, queue_name: &str) -> String {
        format!(
            "https://sqs.{}.amazonaws.com/{}/{}",
            region, account_id, queue_name
        )
    }
}

impl DynamoDBManager {
    pub async fn new(table_name: String, client: Option<DynamoDbClient>) -> Self {
        let client = match client {
            Some(client) => client,
            None => {
                let config = aws_config::from_env().load().await;
                DynamoDbClient::new(&config)
            }
        };
        DynamoDBManager { client, table_name }
    }
}

impl LambdaManager {
    pub async fn new(log_processor_arn: String, client: Option<LambdaClient>) -> Self {
        let client = match client {
            Some(client) => client,
            None => {
                let config = aws_config::from_env().load().await;
                LambdaClient::new(&config)
            }
        };
        LambdaManager {
            client,
            log_processor_arn,
            statement_id: "invokePermission".to_string(),
        }
    }
}

#[async_trait]
impl TableManager for DynamoDBManager {
    async fn create(&self) -> Result<(), Error> {
        let key_schema_hash = KeySchemaElement::builder()
            .attribute_name("requestId".to_string())
            .key_type(KeyType::Hash)
            .build();

        let attribute_name = AttributeDefinition::builder()
            .attribute_name("requestId".to_string())
            .attribute_type(ScalarAttributeType::S)
            .build();

        self.client
            .create_table()
            .table_name(&self.table_name)
            .key_schema(key_schema_hash)
            .attribute_definitions(attribute_name)
            .billing_mode(BillingMode::PayPerRequest)
            .send()
            .await?;

        Ok(())
    }

    async fn delete(&self) -> Result<(), Error> {
        match self
            .client
            .delete_table()
            .table_name(&self.table_name)
            .send()
            .await
        {
            Ok(_) => Ok(()),
            Err(err) => {
                let new_err = err.into_service_error();
                if new_err.is_resource_not_found_exception() {
                    return Ok(());
                }
                Err(new_err.into())
            }
        }
    }

    async fn wait_for_deletion(&self) -> Result<(), Error> {
        let mut table_status = types::TableStatus::Active;
        while table_status != types::TableStatus::Archived {
            let describe_table_output_result = self
                .client
                .describe_table()
                .table_name(&self.table_name)
                .send()
                .await;
            table_status = match describe_table_output_result {
                Ok(describe_table_output) => {
                    let table_description = describe_table_output
                        .table
                        .expect("Could not fetch the table deletion status");
                    table_description
                        .table_status
                        .expect("Could not get the table status")
                }
                Err(_) => types::TableStatus::Archived,
            };
            thread::sleep(Duration::from_secs(1));
        }
        Ok(())
    }

    async fn wait_for_created(&self) -> Result<(), Error> {
        let mut table_status = types::TableStatus::Archived;
        while table_status != types::TableStatus::Active {
            let describe_table_output = self
                .client
                .describe_table()
                .table_name(&self.table_name)
                .send()
                .await?;
            let table_description = describe_table_output
                .table
                .expect("Could not fetch the table deletion status");
            table_status = table_description
                .table_status
                .expect("Could not get the table status");
            thread::sleep(Duration::from_secs(1));
        }
        Ok(())
    }
}

#[async_trait]
impl PermissionManager for LambdaManager {
    async fn remove_permission(&self) -> Result<(), Error> {
        self.client
            .remove_permission()
            .function_name(&self.log_processor_arn)
            .statement_id(&self.statement_id)
            .send()
            .await?;
        Ok(())
    }

    async fn add_permission(&self) -> Result<(), Error> {
        self.client
            .add_permission()
            .function_name(&self.log_processor_arn)
            .statement_id(&self.statement_id)
            .action("lambda:InvokeFunction")
            .principal("logs.amazonaws.com")
            .send()
            .await?;
        Ok(())
    }
}

#[async_trait]
impl QueueManager for SQSManager {
    async fn send_message(&self, messages: Vec<SQSDeployMessage>) -> Result<(), Error> {
        for message in messages {
            self.client
                .send_message()
                .queue_url(&self.queue_url)
                .message_body(message.body)
                .set_message_attributes(Some(message.attributes))
                .send()
                .await?;
        }
        Ok(())
    }
}

fn read_manifest(file_name: &str) -> Manifest {
    let manifest = std::fs::read_to_string(file_name).expect("Could not read manifest.json");
    let manifest: Manifest =
        serde_json::from_str(&manifest).expect("Could not parse manifest.json");
    manifest
}

fn build_sqs_messages(manifest: Manifest) -> Vec<SQSDeployMessage> {
    let mut sqs_messages: Vec<SQSDeployMessage> = Vec::new();
    for memory_size in manifest.memory_sizes {
        for runtime in manifest.runtimes.iter() {
            for architecture in runtime.architectures.iter() {
                let mut attributes = HashMap::new();
                attributes.insert(
                    "architecture".to_string(),
                    MessageAttributeValue::builder()
                        .data_type("String")
                        .string_value(architecture.to_string())
                        .build(),
                );
                attributes.insert(
                    "memorysize".to_string(),
                    MessageAttributeValue::builder()
                        .data_type("Number")
                        .string_value(memory_size.to_string())
                        .build(),
                );
                attributes.insert(
                    "runtime".to_string(),
                    MessageAttributeValue::builder()
                        .data_type("String")
                        .string_value(runtime.runtime.to_string())
                        .build(),
                );
                attributes.insert(
                    "path".to_string(),
                    MessageAttributeValue::builder()
                        .data_type("String")
                        .string_value(runtime.path.to_string())
                        .build(),
                );
                // todo snapstart
                // todo layer
                // todo do not hardcode
                attributes.insert(
                    "packageType".to_string(),
                    MessageAttributeValue::builder()
                        .data_type("String")
                        .string_value("image".to_string())
                        .build(),
                );
                sqs_messages.push(SQSDeployMessage::new(attributes));
            }
        }
    }
    sqs_messages
}

async fn func(_: LambdaEvent<Value>) -> Result<Response, Error> {
    let table_name = std::env::var("TABLE_NAME").expect("TABLE_NAME not set");
    let log_processor_arn = std::env::var("LOG_PROCESSOR_ARN").expect("LOG_PROCESSOR_ARN not set");
    let image_queue_name = std::env::var("IMAGE_QUEUE_NAME").expect("IMAGE_QUEUE_NAME not set");
    let account_id = std::env::var("ACCOUNT_ID").expect("ACCOUNT_ID not set");
    let region = std::env::var("AWS_REGION").expect("AWS_REGION not set");

    let db_manager = DynamoDBManager::new(table_name, None).await;
    db_manager.delete().await?;
    db_manager.wait_for_deletion().await?;
    db_manager.create().await?;
    db_manager.wait_for_created().await?;

    let lambda_manager = LambdaManager::new(log_processor_arn, None).await;
    lambda_manager.remove_permission().await?;
    lambda_manager.add_permission().await?;

    // read manifest.json
    let manifest = read_manifest("manifest.json");
    let sqs_messages = build_sqs_messages(manifest);

    let queue_manager = SQSManager::new(&account_id, &region, &image_queue_name, None).await;
    queue_manager.send_message(sqs_messages).await?;

    Ok(Response { status_code: 200 })
}

#[cfg(test)]
mod tests {

    use super::*;
    use aws_sdk_dynamodb::config::{Credentials, Region};
    use aws_sdk_dynamodb::{Client, Config};
    use std::io::Result;
    use testcontainers::{self, clients};
    mod custom_container;
    use crate::tests::custom_container::dynamo_test::DynamoDb;

    #[tokio::test]
    async fn test_create_table() -> Result<()> {
        let docker = clients::Cli::default();
        let node = docker.run(DynamoDb);
        let port = node.get_host_port_ipv4(8000);
        let client = build_custom_client(port).await;
        let dynamodb_manager =
            DynamoDBManager::new(String::from("pizza_test_2"), Some(client)).await;
        let res = dynamodb_manager.create().await;
        assert!(res.is_ok());
        let res = dynamodb_manager.wait_for_created().await;
        assert!(res.is_ok());
        let res = dynamodb_manager.create().await;
        assert!(res.is_err()); // already exists
        let res = dynamodb_manager.delete().await;
        assert!(res.is_ok());
        let res = dynamodb_manager.wait_for_deletion().await;
        assert!(res.is_ok());
        let res = dynamodb_manager.delete().await;
        assert!(res.is_ok());
        // check if we can re-create after waiting for deletion
        let res = dynamodb_manager.wait_for_deletion().await;
        assert!(res.is_ok());
        let res = dynamodb_manager.create().await;
        assert!(res.is_ok());
        let res = dynamodb_manager.wait_for_created().await;
        assert!(res.is_ok());
        let res = dynamodb_manager.create().await;
        assert!(res.is_err()); // already exists
        Ok(())
    }

    async fn build_custom_client(port: u16) -> Client {
        let local_credentials = Credentials::new("local", "local", None, None, "local");
        let conf = Config::builder()
            .endpoint_url(format!("http://localhost:{}", port))
            .credentials_provider(local_credentials)
            .region(Region::new("test-region"))
            .build();
        Client::from_conf(conf)
    }

    #[test]
    fn test_read_manifest() {
        let manifest = read_manifest("manifest.test.json");
        assert_eq!(manifest.memory_sizes.len(), 2);
        assert_eq!(manifest.runtimes.len(), 2);

        assert_eq!(manifest.runtimes[0].display_name, "nodejs18.x");
        assert_eq!(manifest.runtimes[0].runtime, "nodejs18.x");
        assert_eq!(manifest.runtimes[0].handler, "index.handler");
        assert_eq!(manifest.runtimes[0].path, "nodejs18x");
        assert_eq!(manifest.runtimes[0].architectures.len(), 2);
        assert_eq!(manifest.runtimes[0].architectures[0], "x86_64");
        assert_eq!(manifest.runtimes[0].architectures[1], "arm64");
        assert_eq!(
            manifest.runtimes[0].image.base_image,
            "public.ecr.aws/lambda/nodejs:18"
        );

        assert_eq!(manifest.runtimes[1].display_name, "python3.7");
        assert_eq!(manifest.runtimes[1].runtime, "python3.7");
        assert_eq!(manifest.runtimes[1].handler, "index.handler");
        assert_eq!(manifest.runtimes[1].path, "python37");
        assert_eq!(manifest.runtimes[1].architectures.len(), 1);
        assert_eq!(manifest.runtimes[1].architectures[0], "x86_64");
        assert_eq!(
            manifest.runtimes[1].image.base_image,
            "public.ecr.aws/lambda/python:3.7"
        );
    }

    #[test]
    fn test_build_sqs() {
        let manifest = read_manifest("manifest.test.json");
        let sqs_messages = build_sqs_messages(manifest);
        assert_eq!(sqs_messages.len(), 6);

        assert_eq!(sqs_messages[0].attributes.len(), 5);
        assert_eq!(
            sqs_messages[0].attributes["architecture"].string_value,
            Some("x86_64".to_string())
        );
        assert_eq!(
            sqs_messages[0].attributes["memorysize"].string_value,
            Some("128".to_string())
        );
        assert_eq!(
            sqs_messages[0].attributes["runtime"].string_value,
            Some("nodejs18.x".to_string())
        );
        assert_eq!(
            sqs_messages[0].attributes["path"].string_value,
            Some("nodejs18x".to_string())
        );
        assert_eq!(
            sqs_messages[0].attributes["packageType"].string_value,
            Some("image".to_string())
        );

        assert_eq!(sqs_messages[1].attributes.len(), 5);
        assert_eq!(
            sqs_messages[1].attributes["architecture"].string_value,
            Some("arm64".to_string())
        );
        assert_eq!(
            sqs_messages[1].attributes["memorysize"].string_value,
            Some("128".to_string())
        );
        assert_eq!(
            sqs_messages[1].attributes["runtime"].string_value,
            Some("nodejs18.x".to_string())
        );
        assert_eq!(
            sqs_messages[1].attributes["path"].string_value,
            Some("nodejs18x".to_string())
        );
        assert_eq!(
            sqs_messages[1].attributes["packageType"].string_value,
            Some("image".to_string())
        );

        assert_eq!(sqs_messages[2].attributes.len(), 5);
        assert_eq!(
            sqs_messages[2].attributes["architecture"].string_value,
            Some("x86_64".to_string())
        );
        assert_eq!(
            sqs_messages[2].attributes["memorysize"].string_value,
            Some("128".to_string())
        );
        assert_eq!(
            sqs_messages[2].attributes["runtime"].string_value,
            Some("python3.7".to_string())
        );
        assert_eq!(
            sqs_messages[2].attributes["path"].string_value,
            Some("python37".to_string())
        );
        assert_eq!(
            sqs_messages[2].attributes["packageType"].string_value,
            Some("image".to_string())
        );

        assert_eq!(sqs_messages[3].attributes.len(), 5);
        assert_eq!(
            sqs_messages[3].attributes["architecture"].string_value,
            Some("x86_64".to_string())
        );
        assert_eq!(
            sqs_messages[3].attributes["memorysize"].string_value,
            Some("256".to_string())
        );
        assert_eq!(
            sqs_messages[3].attributes["runtime"].string_value,
            Some("nodejs18.x".to_string())
        );
        assert_eq!(
            sqs_messages[3].attributes["path"].string_value,
            Some("nodejs18x".to_string())
        );
        assert_eq!(
            sqs_messages[3].attributes["packageType"].string_value,
            Some("image".to_string())
        );

        assert_eq!(sqs_messages[4].attributes.len(), 5);
        assert_eq!(
            sqs_messages[4].attributes["architecture"].string_value,
            Some("arm64".to_string())
        );
        assert_eq!(
            sqs_messages[4].attributes["memorysize"].string_value,
            Some("256".to_string())
        );
        assert_eq!(
            sqs_messages[4].attributes["runtime"].string_value,
            Some("nodejs18.x".to_string())
        );
        assert_eq!(
            sqs_messages[4].attributes["path"].string_value,
            Some("nodejs18x".to_string())
        );
        assert_eq!(
            sqs_messages[4].attributes["packageType"].string_value,
            Some("image".to_string())
        );

        assert_eq!(sqs_messages[5].attributes.len(), 5);
        assert_eq!(
            sqs_messages[5].attributes["architecture"].string_value,
            Some("x86_64".to_string())
        );
        assert_eq!(
            sqs_messages[5].attributes["memorysize"].string_value,
            Some("256".to_string())
        );
        assert_eq!(
            sqs_messages[5].attributes["runtime"].string_value,
            Some("python3.7".to_string())
        );
        assert_eq!(
            sqs_messages[5].attributes["path"].string_value,
            Some("python37".to_string())
        );
        assert_eq!(
            sqs_messages[5].attributes["packageType"].string_value,
            Some("image".to_string())
        );
    }

    #[test]
    fn test_build_queue_url() {
        let queue_url = SQSManager::build_queue_url("123456789", "us-east-1", "test_queue");
        assert_eq!(
            queue_url,
            "https://sqs.us-east-1.amazonaws.com/123456789/test_queue"
        );
    }
}
