use async_trait::async_trait;
use aws_config::BehaviorVersion;
use aws_sdk_sqs::Client as SQSClient;
use lambda_runtime::Error;

use crate::{manifest::ManifestManager, runtime::Runtime};

pub struct SQSManager {
    pub client: SQSClient,
    pub function_queue_url: String,
    pub snapstart_queue_url: String,
    pub manifest_manager: ManifestManager,
    pub skip_snapstart: bool,
}

impl SQSManager {
    pub async fn new(
        account_id: &str,
        region: &str,
        function_queue_name: &str,
        snapstart_queue_name: &str,
        skip_snapstart: bool,
        manifest_manager: ManifestManager,
        client: Option<SQSClient>,
    ) -> Self {
        let client = match client {
            Some(client) => client,
            None => {
                let config = aws_config::defaults(BehaviorVersion::latest()).load().await;
                SQSClient::new(&config)
            }
        };
        let function_queue_url =
            SQSManager::build_queue_url(account_id, region, function_queue_name);
        let snapstart_queue_url =
            SQSManager::build_queue_url(account_id, region, snapstart_queue_name);
        SQSManager {
            client,
            function_queue_url,
            snapstart_queue_url,
            manifest_manager,
            skip_snapstart,
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
    fn build_message(&self) -> Vec<Runtime>;
    async fn send_message(&self) -> Result<(), Error>;
}

#[async_trait]
impl QueueManager for SQSManager {
    fn build_message(&self) -> Vec<Runtime> {
        let manifest = self.manifest_manager.read_manifest();
        if self.skip_snapstart {
            return manifest
                .runtimes
                .into_iter()
                .filter(|r| !r.is_snapstart())
                .collect();
        }
        manifest.runtimes
    }

    async fn send_message(&self) -> Result<(), Error> {
        let messages = self.build_message().into_iter();
        for message in messages {
            let queue_url = if message.is_snapstart() {
                &self.snapstart_queue_url
            } else {
                &self.function_queue_url
            };

            self.client
                .send_message()
                .queue_url(queue_url)
                .message_body(serde_json::to_string(&message)?)
                .send()
                .await?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {

    use crate::runtime::Image;

    use super::*;

    #[tokio::test]
    async fn test_build_sqs() {
        let manifest = ManifestManager::new("manifest.test.json");
        let sqs_manager = SQSManager::new(
            "123456789",
            "us-east-1",
            "test_queue",
            "snapstart_test_queue",
            false,
            manifest,
            None,
        )
        .await;
        let sqs_messages = sqs_manager.build_message();
        assert_eq!(sqs_messages.len(), 10);

        assert_eq!(
            sqs_messages[0],
            Runtime::new(
                "nodejs18.x".to_string(),
                "nodejs18.x".to_string(),
                "index.handler".to_string(),
                "nodejs18x".to_string(),
                "x86_64".to_string(),
                128,
                None,
                None,
                false,
            )
        );
        assert_eq!(
            sqs_messages[1],
            Runtime::new(
                "nodejs18.x".to_string(),
                "nodejs18.x".to_string(),
                "index.handler".to_string(),
                "nodejs18x".to_string(),
                "x86_64".to_string(),
                128,
                Some(Image {
                    base_image: "public.ecr.aws/lambda/nodejs:18".to_string(),
                }),
                None,
                false,
            )
        );
        assert_eq!(
            sqs_messages[2],
            Runtime::new(
                "nodejs18.x".to_string(),
                "nodejs18.x".to_string(),
                "index.handler".to_string(),
                "nodejs18x".to_string(),
                "arm64".to_string(),
                128,
                None,
                None,
                false,
            )
        );
        assert_eq!(
            sqs_messages[3],
            Runtime::new(
                "nodejs18.x".to_string(),
                "nodejs18.x".to_string(),
                "index.handler".to_string(),
                "nodejs18x".to_string(),
                "arm64".to_string(),
                128,
                Some(Image {
                    base_image: "public.ecr.aws/lambda/nodejs:18".to_string(),
                }),
                None,
                false,
            )
        );
        assert_eq!(
            sqs_messages[4],
            Runtime::new(
                "python3.7".to_string(),
                "python3.7".to_string(),
                "index.handler".to_string(),
                "python37".to_string(),
                "x86_64".to_string(),
                128,
                None,
                None,
                false,
            )
        );

        assert_eq!(
            sqs_messages[5],
            Runtime::new(
                "nodejs18.x".to_string(),
                "nodejs18.x".to_string(),
                "index.handler".to_string(),
                "nodejs18x".to_string(),
                "x86_64".to_string(),
                256,
                None,
                None,
                false,
            )
        );
        assert_eq!(
            sqs_messages[6],
            Runtime::new(
                "nodejs18.x".to_string(),
                "nodejs18.x".to_string(),
                "index.handler".to_string(),
                "nodejs18x".to_string(),
                "x86_64".to_string(),
                256,
                Some(Image {
                    base_image: "public.ecr.aws/lambda/nodejs:18".to_string(),
                }),
                None,
                false,
            )
        );
        assert_eq!(
            sqs_messages[7],
            Runtime::new(
                "nodejs18.x".to_string(),
                "nodejs18.x".to_string(),
                "index.handler".to_string(),
                "nodejs18x".to_string(),
                "arm64".to_string(),
                256,
                None,
                None,
                false,
            )
        );
        assert_eq!(
            sqs_messages[8],
            Runtime::new(
                "nodejs18.x".to_string(),
                "nodejs18.x".to_string(),
                "index.handler".to_string(),
                "nodejs18x".to_string(),
                "arm64".to_string(),
                256,
                Some(Image {
                    base_image: "public.ecr.aws/lambda/nodejs:18".to_string(),
                }),
                None,
                false,
            )
        );
        assert_eq!(
            sqs_messages[9],
            Runtime::new(
                "python3.7".to_string(),
                "python3.7".to_string(),
                "index.handler".to_string(),
                "python37".to_string(),
                "x86_64".to_string(),
                256,
                None,
                None,
                false,
            )
        );
    }

    #[tokio::test]
    async fn test_build_sqs_skip_snapstart() {
        let manifest = ManifestManager::new("manifest.test.snapstart.and.not.snapstart.json");
        let sqs_manager = SQSManager::new(
            "123456789",
            "us-east-1",
            "test_queue",
            "snapstart_test_queue",
            true,
            manifest,
            None,
        )
        .await;
        let sqs_messages = sqs_manager.build_message();
        assert_eq!(sqs_messages.len(), 1);

        assert_eq!(
            sqs_messages[0],
            Runtime::new(
                "java11".to_string(),
                "java11".to_string(),
                "io.github.maxday.Handler::handleRequest".to_string(),
                "java_11".to_string(),
                "x86_64".to_string(),
                128,
                None,
                None,
                false,
            )
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
