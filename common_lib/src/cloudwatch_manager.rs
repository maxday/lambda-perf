use async_trait::async_trait;
use aws_config::BehaviorVersion;
use aws_sdk_cloudwatchlogs::Client as CloudWatchLogsClient;
use lambda_runtime::Error;

use crate::runtime::Runtime;

pub struct CloudWatchManager {
    client: CloudWatchLogsClient,
    report_log_processor_arn: String,
}

#[async_trait]
pub trait LogManager {
    async fn delete_log_group(&self, runtime: &Runtime) -> Result<(), Error>;
    async fn create_log_group(&self, runtime: &Runtime) -> Result<(), Error>;
    async fn create_log_subscription_filter(&self, runtime: &Runtime) -> Result<(), Error>;
}

impl CloudWatchManager {
    pub async fn new(
        client: Option<CloudWatchLogsClient>,
        report_log_processor_arn: String,
    ) -> CloudWatchManager {
        let client = match client {
            Some(client) => client,
            None => {
                let config = aws_config::defaults(BehaviorVersion::latest()).load().await;
                CloudWatchLogsClient::new(&config)
            }
        };
        CloudWatchManager {
            client,
            report_log_processor_arn,
        }
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

    async fn create_log_subscription_filter(&self, runtime: &Runtime) -> Result<(), Error> {
        self.client
            .put_subscription_filter()
            .destination_arn(&self.report_log_processor_arn)
            .filter_name(format!("report-log-from-{}", runtime.function_name()))
            .filter_pattern("REPORT RequestId")
            .log_group_name(format!("/aws/lambda/{}", runtime.function_name()))
            .send()
            .await?;
        Ok(())
    }
}
