use async_trait::async_trait;
use aws_sdk_cloudwatchlogs::Client as CloudWatchLogsClient;
use lambda_runtime::Error;

use crate::runtime::Runtime;

pub struct CloudWatchManager<'a> {
    pub client: CloudWatchLogsClient,
    pub runtime: &'a Runtime,
}

#[async_trait]
pub trait LogManager {
    async fn delete_log_group(&self) -> Result<(), Error>;
    async fn create_log_group(&self) -> Result<(), Error>;
}

impl<'a> CloudWatchManager<'a> {
    pub async fn new(
        client: Option<CloudWatchLogsClient>,
        runtime: &'a Runtime,
    ) -> CloudWatchManager<'a> {
        let client = match client {
            Some(client) => client,
            None => {
                let config = aws_config::from_env().load().await;
                CloudWatchLogsClient::new(&config)
            }
        };
        CloudWatchManager { client, runtime }
    }
}

#[async_trait]
impl<'a> LogManager for CloudWatchManager<'a> {
    async fn delete_log_group(&self) -> Result<(), Error> {
        let function_name = self.runtime.function_name();
        let log_group_name = format!("/aws/lambda/{}", function_name);
        let res = self
            .client
            .delete_log_group()
            .log_group_name(&log_group_name)
            .send()
            .await;
        match res {
            Ok(_) => Ok(()),
            Err(e) => {
                let e = e.into_service_error();
                if e.is_resource_not_found_exception() {
                    return Ok(());
                }
                Err(Box::new(e))
            }
        }
    }
    async fn create_log_group(&self) -> Result<(), Error> {
        let function_name = self.runtime.function_name();
        let log_group_name = format!("/aws/lambda/{}", function_name);
        self.client
            .create_log_group()
            .log_group_name(&log_group_name)
            .send()
            .await?;
        Ok(())
    }
}
