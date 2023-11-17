use aws_sdk_sqs::Client as SQSClient;

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
        InvokerSQSManager {
            client,
            queue_url,
        }
    }
    pub fn send_message(&self, runtime: &Runtime) {
        println!("sending for {:?}", runtime);
        
    }
    fn build_queue_url(account_id: &str, region: &str, queue_name: &str) -> String {
        format!(
            "https://sqs.{}.amazonaws.com/{}/{}",
            region, account_id, queue_name
        )
    }
}
