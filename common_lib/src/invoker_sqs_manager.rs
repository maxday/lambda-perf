use aws_sdk_sqs::Client as SQSClient;
use lambda_runtime::Error;
use serde_json::json;

use crate::runtime::Runtime;

pub struct InvokerSQSManager {
    pub client: SQSClient,
    pub queue_url: String,
}

impl InvokerSQSManager {
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
        let queue_url = InvokerSQSManager::build_queue_url(account_id, region, queue_name);
        InvokerSQSManager { client, queue_url }
    }
    pub async fn send_message(&self, runtime: &Runtime) -> Result<(), Error> {
        self.client
            .send_message()
            .queue_url(&self.queue_url)
            .message_body(json!(runtime).to_string())
            .send()
            .await?;
        Ok(())
    }
    fn build_queue_url(account_id: &str, region: &str, queue_name: &str) -> String {
        format!(
            "https://sqs.{}.amazonaws.com/{}/{}",
            region, account_id, queue_name
        )
    }
}
