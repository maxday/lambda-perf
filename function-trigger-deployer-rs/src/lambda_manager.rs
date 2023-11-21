use async_trait::async_trait;
use aws_config::BehaviorVersion;
use aws_sdk_lambda::Client as LambdaClient;
use lambda_runtime::Error;

pub struct LambdaManager {
    pub client: LambdaClient,
    pub report_log_processor_arn: String,
    pub statement_id: String,
}

#[async_trait]
pub trait PermissionManager {
    async fn remove_permission(&self) -> Result<(), Error>;
    async fn add_permission(&self) -> Result<(), Error>;
}

impl LambdaManager {
    pub async fn new(report_log_processor_arn: String, client: Option<LambdaClient>) -> Self {
        let client = match client {
            Some(client) => client,
            None => {
                let config = aws_config::defaults(BehaviorVersion::latest()).load().await;
                LambdaClient::new(&config)
            }
        };
        LambdaManager {
            client,
            report_log_processor_arn,
            statement_id: "invokePermission".to_string(),
        }
    }
}

#[async_trait]
impl PermissionManager for LambdaManager {
    async fn remove_permission(&self) -> Result<(), Error> {
        match self
            .client
            .remove_permission()
            .function_name(&self.report_log_processor_arn)
            .statement_id(&self.statement_id)
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

    async fn add_permission(&self) -> Result<(), Error> {
        self.client
            .add_permission()
            .function_name(&self.report_log_processor_arn)
            .statement_id(&self.statement_id)
            .action("lambda:InvokeFunction")
            .principal("logs.amazonaws.com")
            .send()
            .await?;
        Ok(())
    }
}
