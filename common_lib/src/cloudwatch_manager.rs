use async_trait::async_trait;
use aws_sdk_cloudwatchlogs::Client as CloudWatchLogsClient;
use lambda_runtime::Error;

use crate::runtime::Runtime;

pub struct CloudWatchManager {
    pub client: CloudWatchLogsClient,
}

#[async_trait]
pub trait LogManager {
    async fn delete_log_group(&self, runtime: &Runtime) -> Result<(), Error>;
    async fn create_log_group(&self, runtime: &Runtime) -> Result<(), Error>;
}

impl CloudWatchManager {
    pub async fn new(client: Option<CloudWatchLogsClient>) -> CloudWatchManager {
        let client = match client {
            Some(client) => client,
            None => {
                let config = aws_config::from_env().load().await;
                CloudWatchLogsClient::new(&config)
            }
        };
        CloudWatchManager { client }
    }
}

#[async_trait]
impl LogManager for CloudWatchManager {
    async fn delete_log_group(&self, runtime: &Runtime) -> Result<(), Error> {
        let function_name = runtime.function_name();
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
    async fn create_log_group(&self, runtime: &Runtime) -> Result<(), Error> {
        let function_name = runtime.function_name();
        let log_group_name = format!("/aws/lambda/{}", function_name);
        self.client
            .create_log_group()
            .log_group_name(&log_group_name)
            .send()
            .await?;
        Ok(())
    }
}
