use crate::manifest::ManifestManager;
use async_trait::async_trait;
use aws_sdk_sqs::Client as SQSClient;
use common_lib::Runtime;
use lambda_runtime::Error;
use serde_json::json;

pub struct SQSManager {
    pub client: SQSClient,
    pub queue_url: String,
    pub manifest_manager: ManifestManager,
}

impl SQSManager {
    pub async fn new(
        account_id: &str,
        region: &str,
        queue_name: &str,
        manifest_manager: ManifestManager,
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
        SQSManager {
            client,
            queue_url,
            manifest_manager,
        }
    }
    fn build_queue_url(account_id: &str, region: &str, queue_name: &str) -> String {
        format!(
            "https://sqs.{}.amazonaws.com/{}/{}",
            region, account_id, queue_name
        )
    }
}

#[async_trait]
pub trait QueueManager {
    //fn build_message(&self) -> Vec<SQSDeployMessage>;
    fn build_message(&self) -> Vec<Runtime>;
    async fn send_message(&self) -> Result<(), Error>;
}

#[async_trait]
impl QueueManager for SQSManager {
    // fn build_message(&self) -> Vec<SQSDeployMessage> {
    //     let mut sqs_messages: Vec<SQSDeployMessage> = Vec::new();
    //     let manifest = self.manifest_manager.read_manifest();
    //     for runtime in manifest.runtimes.iter() {
    //         sqs_messages.push(runtime.to_sqs_deploy_message());
    //     }
    //     sqs_messages
    // }

    fn build_message(&self) -> Vec<Runtime> {
        let manifest = self.manifest_manager.read_manifest();
        manifest.runtimes
    }

    async fn send_message(&self) -> Result<(), Error> {
        let messages = self.build_message();
        for message in messages {
            self.client
                .send_message()
                .queue_url(&self.queue_url)
                .message_body(json!(message).to_string())
                .send()
                .await?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use crate::{
        manifest::ManifestManager,
        sqs_manager::{QueueManager, SQSManager},
    };

    use common_lib::{Image, Runtime};

    #[tokio::test]
    async fn test_build_sqs() {
        let manifest = ManifestManager::new("manifest.test.json");
        let sqs_manager =
            SQSManager::new("123456789", "us-east-1", "test_queue", manifest, None).await;
        let sqs_messages = sqs_manager.build_message();
        assert_eq!(sqs_messages.len(), 10);

        assert_eq!(
            sqs_messages[0],
            Runtime {
                architecture: "x86_64".to_string(),
                memory_size: 128,
                runtime: "nodejs18.x".to_string(),
                path: "nodejs18x".to_string(),
                display_name: "nodejs18.x".to_string(),
                handler: "index.handler".to_string(),
                image: None,
            }
        );
        assert_eq!(
            sqs_messages[1],
            Runtime {
                architecture: "x86_64".to_string(),
                memory_size: 128,
                runtime: "nodejs18.x".to_string(),
                path: "nodejs18x".to_string(),
                display_name: "nodejs18.x".to_string(),
                handler: "index.handler".to_string(),
                image: Some(Image {
                    base_image: "public.ecr.aws/lambda/nodejs:18".to_string(),
                }),
            }
        );
        assert_eq!(
            sqs_messages[2],
            Runtime {
                architecture: "arm64".to_string(),
                memory_size: 128,
                runtime: "nodejs18.x".to_string(),
                path: "nodejs18x".to_string(),
                display_name: "nodejs18.x".to_string(),
                handler: "index.handler".to_string(),
                image: None,
            }
        );
        assert_eq!(
            sqs_messages[3],
            Runtime {
                architecture: "arm64".to_string(),
                memory_size: 128,
                runtime: "nodejs18.x".to_string(),
                path: "nodejs18x".to_string(),
                display_name: "nodejs18.x".to_string(),
                handler: "index.handler".to_string(),
                image: Some(Image {
                    base_image: "public.ecr.aws/lambda/nodejs:18".to_string(),
                }),
            }
        );
        assert_eq!(
            sqs_messages[4],
            Runtime {
                architecture: "x86_64".to_string(),
                memory_size: 128,
                runtime: "python3.7".to_string(),
                path: "python37".to_string(),
                display_name: "python3.7".to_string(),
                handler: "index.handler".to_string(),
                image: None
            }
        );

        assert_eq!(
            sqs_messages[5],
            Runtime {
                architecture: "x86_64".to_string(),
                memory_size: 256,
                runtime: "nodejs18.x".to_string(),
                path: "nodejs18x".to_string(),
                display_name: "nodejs18.x".to_string(),
                handler: "index.handler".to_string(),
                image: None,
            }
        );
        assert_eq!(
            sqs_messages[6],
            Runtime {
                architecture: "x86_64".to_string(),
                memory_size: 256,
                runtime: "nodejs18.x".to_string(),
                path: "nodejs18x".to_string(),
                display_name: "nodejs18.x".to_string(),
                handler: "index.handler".to_string(),
                image: Some(Image {
                    base_image: "public.ecr.aws/lambda/nodejs:18".to_string(),
                }),
            }
        );
        assert_eq!(
            sqs_messages[7],
            Runtime {
                architecture: "arm64".to_string(),
                memory_size: 256,
                runtime: "nodejs18.x".to_string(),
                path: "nodejs18x".to_string(),
                display_name: "nodejs18.x".to_string(),
                handler: "index.handler".to_string(),
                image: None,
            }
        );
        assert_eq!(
            sqs_messages[8],
            Runtime {
                architecture: "arm64".to_string(),
                memory_size: 256,
                runtime: "nodejs18.x".to_string(),
                path: "nodejs18x".to_string(),
                display_name: "nodejs18.x".to_string(),
                handler: "index.handler".to_string(),
                image: Some(Image {
                    base_image: "public.ecr.aws/lambda/nodejs:18".to_string(),
                }),
            }
        );
        assert_eq!(
            sqs_messages[9],
            Runtime {
                architecture: "x86_64".to_string(),
                memory_size: 256,
                runtime: "python3.7".to_string(),
                path: "python37".to_string(),
                display_name: "python3.7".to_string(),
                handler: "index.handler".to_string(),
                image: None
            }
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
