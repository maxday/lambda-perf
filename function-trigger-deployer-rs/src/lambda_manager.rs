use aws_sdk_lambda::Client as LambdaClient;
use async_trait::async_trait;
use lambda_runtime::{Error};

pub struct LambdaManager {
    pub client: LambdaClient,
    pub log_processor_arn: String,
    pub statement_id: String,
}

#[async_trait]
pub trait PermissionManager {
    async fn remove_permission(&self) -> Result<(), Error>;
    async fn add_permission(&self) -> Result<(), Error>;
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