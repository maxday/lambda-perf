use std::{thread, time::Duration};

use async_trait::async_trait;
use aws_config::BehaviorVersion;
use aws_sdk_dynamodb::{
    Client as DynamoDbClient,
    types::{
        self, AttributeDefinition, AttributeValue, BillingMode, KeySchemaElement, KeyType,
        ScalarAttributeType,
    },
};

use lambda_runtime::Error;

use crate::report_log::{ReportLog, ReportLogData};

#[async_trait]
pub trait TableManager {
    async fn create(&self) -> Result<(), Error>;
    async fn delete(&self) -> Result<(), Error>;
    async fn wait_for_deletion(&self) -> Result<(), Error>;
    async fn wait_for_created(&self) -> Result<(), Error>;
    async fn insert_report_log(
        &self,
        report_log: &ReportLog,
        report_log_data: &ReportLogData,
    ) -> Result<(), Error>;
}
pub struct DynamoDBManager {
    pub client: DynamoDbClient,
    pub table_name: String,
}

impl DynamoDBManager {
    pub async fn new(table_name: String, client: Option<DynamoDbClient>) -> Self {
        let client = match client {
            Some(client) => client,
            None => {
                let config = aws_config::defaults(BehaviorVersion::latest()).load().await;
                DynamoDbClient::new(&config)
            }
        };
        DynamoDBManager { client, table_name }
    }
}

#[async_trait]
impl TableManager for DynamoDBManager {
    async fn create(&self) -> Result<(), Error> {
        let key_schema_hash = KeySchemaElement::builder()
            .attribute_name("requestId".to_string())
            .key_type(KeyType::Hash)
            .build()?;

        let attribute_name = AttributeDefinition::builder()
            .attribute_name("requestId".to_string())
            .attribute_type(ScalarAttributeType::S)
            .build()?;

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

    async fn insert_report_log(
        &self,
        report_log: &ReportLog,
        report_log_data: &ReportLogData,
    ) -> Result<(), Error> {
        let memory_size = AttributeValue::N(report_log.memory_size.to_string());
        let package_type = AttributeValue::S(report_log.package_type.to_string());
        let display_name = AttributeValue::S(report_log.display_name.to_string());
        let architecture = AttributeValue::S(report_log.architecture.to_string());

        let request_id = AttributeValue::S(report_log_data.request_id.to_string());
        let billed_duratation = AttributeValue::N(report_log_data.billed_duration.to_string());
        let billed_restore_duration =
            AttributeValue::N(report_log_data.billed_restore_duration.to_string());
        let duration = AttributeValue::N(report_log_data.duration.to_string());
        let init_duration = AttributeValue::N(report_log_data.init_duration.to_string());
        let max_memory_used = AttributeValue::N(report_log_data.max_memory_used.to_string());
        let insert_date = AttributeValue::S(report_log_data.insert_date.to_string());

        let lambda_name = format!(
            "lambda-perf-{}-{}-{}-{}",
            report_log.path,
            report_log.package_type,
            report_log.memory_size,
            report_log.architecture
        );
        let lambda_name = AttributeValue::S(lambda_name);

        self.client
            .put_item()
            .table_name(&self.table_name)
            .item("requestId", request_id)
            .item("architecture", architecture)
            .item("billedDuratation", billed_duratation)
            .item("billedRestoreDuration", billed_restore_duration)
            .item("displayName", display_name)
            .item("duration", duration)
            .item("initDuration", init_duration)
            .item("maxMemoryUsed", max_memory_used)
            .item("memorySize", memory_size)
            .item("packageType", package_type)
            .item("insertDate", insert_date)
            .item("lambda", lambda_name)
            .send()
            .await?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    use aws_sdk_dynamodb::config::{Credentials, Region};
    use aws_sdk_dynamodb::{Client, Config};
    use testcontainers::{
        GenericImage,
        core::{IntoContainerPort, WaitFor},
        runners::AsyncRunner,
    };

    use std::io::Result;

    #[tokio::test]
    async fn test_create_table() -> Result<()> {
        let container = GenericImage::new("amazon/dynamodb-local", "latest")
            .with_exposed_port(8000.tcp())
            .with_wait_for(WaitFor::seconds(5))
            .start()
            .await
            .expect("could not start dynamodb");

        let port = container
            .get_host_port_ipv4(8000.tcp())
            .await
            .expect("could not get the port");

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
            .behavior_version_latest()
            .region(Region::new("test-region"))
            .build();
        Client::from_conf(conf)
    }
}
