use std::{thread, time::Duration};

use async_trait::async_trait;
use aws_sdk_dynamodb::{
    types::{
        self, AttributeDefinition, BillingMode, KeySchemaElement,
        KeyType, ScalarAttributeType,
    },
    Client as DynamoDbClient,
};
use aws_sdk_lambda::Client as LambdaClient;
use lambda_runtime::{service_fn, Error, LambdaEvent};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Serialize)]
struct Msg(String);

#[derive(Serialize, Deserialize, Default, Debug)]
struct Payload {
    status: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Response {
    status_code: u32,
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt::init();
    let func = service_fn(func);
    lambda_runtime::run(func).await?;
    Ok(())
}

#[async_trait]
pub trait TableManager {
    async fn create(&self) -> Result<(), Error>;
    async fn delete(&self) -> Result<(), Error>;
    async fn wait_for_deletion(&self) -> Result<(), Error>;
}

#[async_trait]
pub trait PermissionManager {
    async fn remove_permission(&self) -> Result<(), Error>;
    async fn add_permission(&self) -> Result<(), Error>;
}

pub struct DynamoDBManager {
    pub client: DynamoDbClient,
    pub table_name: String,
}

pub struct LambdaManager {
    pub client: LambdaClient,
    pub log_processor_arn: String,
    pub statement_id: String,
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

async fn func(_: LambdaEvent<Value>) -> Result<Response, Error> {
    let table_name = std::env::var("TABLE_NAME").expect("TABLE_NAME not set");
    let log_processor_arn = std::env::var("LOG_PROCESSOR_ARN").expect("LOG_PROCESSOR_ARN not set");
    let db_manager = DynamoDBManager::new(table_name, None).await;
    db_manager.delete().await?;
    db_manager.create().await?;
    let lambda_manager = LambdaManager::new(log_processor_arn, None).await;
    lambda_manager.remove_permission().await?;
    lambda_manager.add_permission().await?;
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
}
