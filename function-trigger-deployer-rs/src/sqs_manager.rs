use std::collections::HashMap;

use aws_sdk_sqs::types::MessageAttributeValue;
use aws_sdk_sqs::Client as SQSClient;

use async_trait::async_trait;

use crate::manifest::ManifestManager;

use lambda_runtime::Error;

pub struct SQSDeployMessage {
    attributes: HashMap<String, MessageAttributeValue>,
    body: String,
}
impl SQSDeployMessage {
    fn new(attributes: HashMap<String, MessageAttributeValue>) -> Self {
        SQSDeployMessage {
            body: "deploy".to_string(),
            attributes,
        }
    }
}

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
        SQSManager { client, queue_url, manifest_manager }
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
    fn build_message(&self) -> Vec<SQSDeployMessage>;
    async fn send_message(&self) -> Result<(), Error>;
}

#[async_trait]
impl QueueManager for SQSManager {
    fn build_message(&self) -> Vec<SQSDeployMessage> {
        let mut sqs_messages: Vec<SQSDeployMessage> = Vec::new();
        let manifest = self.manifest_manager.read_manifest();
    for memory_size in manifest.memory_sizes {
        for runtime in manifest.runtimes.iter() {
            for architecture in runtime.architectures.iter() {
                let mut attributes = HashMap::new();
                attributes.insert(
                    "architecture".to_string(),
                    MessageAttributeValue::builder()
                        .data_type("String")
                        .string_value(architecture.to_string())
                        .build(),
                );
                attributes.insert(
                    "memorysize".to_string(),
                    MessageAttributeValue::builder()
                        .data_type("Number")
                        .string_value(memory_size.to_string())
                        .build(),
                );
                attributes.insert(
                    "runtime".to_string(),
                    MessageAttributeValue::builder()
                        .data_type("String")
                        .string_value(runtime.runtime.to_string())
                        .build(),
                );
                attributes.insert(
                    "path".to_string(),
                    MessageAttributeValue::builder()
                        .data_type("String")
                        .string_value(runtime.path.to_string())
                        .build(),
                );
                // todo snapstart
                // todo layer
                // todo do not hardcode
                attributes.insert(
                    "packageType".to_string(),
                    MessageAttributeValue::builder()
                        .data_type("String")
                        .string_value("image".to_string())
                        .build(),
                );
                sqs_messages.push(SQSDeployMessage::new(attributes));
            }
        }
    }
    sqs_messages
    }

    async fn send_message(&self) -> Result<(), Error> {
        let messages = self.build_message();
        for message in messages {
            self.client
                .send_message()
                .queue_url(&self.queue_url)
                .message_body(message.body)
                .set_message_attributes(Some(message.attributes))
                .send()
                .await?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use crate::{sqs_manager::{SQSManager, QueueManager}, manifest::ManifestManager};

    #[tokio::test]
    async fn test_build_sqs() {
        let manifest = ManifestManager::new("manifest.test.json");
        let sqs_manager = SQSManager::new("123456789", "us-east-1", "test_queue", manifest, None).await;
        let sqs_messages = sqs_manager.build_message();
        assert_eq!(sqs_messages.len(), 6);

        assert_eq!(sqs_messages[0].attributes.len(), 5);
        assert_eq!(
            sqs_messages[0].attributes["architecture"].string_value,
            Some("x86_64".to_string())
        );
        assert_eq!(
            sqs_messages[0].attributes["memorysize"].string_value,
            Some("128".to_string())
        );
        assert_eq!(
            sqs_messages[0].attributes["runtime"].string_value,
            Some("nodejs18.x".to_string())
        );
        assert_eq!(
            sqs_messages[0].attributes["path"].string_value,
            Some("nodejs18x".to_string())
        );
        assert_eq!(
            sqs_messages[0].attributes["packageType"].string_value,
            Some("image".to_string())
        );

        assert_eq!(sqs_messages[1].attributes.len(), 5);
        assert_eq!(
            sqs_messages[1].attributes["architecture"].string_value,
            Some("arm64".to_string())
        );
        assert_eq!(
            sqs_messages[1].attributes["memorysize"].string_value,
            Some("128".to_string())
        );
        assert_eq!(
            sqs_messages[1].attributes["runtime"].string_value,
            Some("nodejs18.x".to_string())
        );
        assert_eq!(
            sqs_messages[1].attributes["path"].string_value,
            Some("nodejs18x".to_string())
        );
        assert_eq!(
            sqs_messages[1].attributes["packageType"].string_value,
            Some("image".to_string())
        );

        assert_eq!(sqs_messages[2].attributes.len(), 5);
        assert_eq!(
            sqs_messages[2].attributes["architecture"].string_value,
            Some("x86_64".to_string())
        );
        assert_eq!(
            sqs_messages[2].attributes["memorysize"].string_value,
            Some("128".to_string())
        );
        assert_eq!(
            sqs_messages[2].attributes["runtime"].string_value,
            Some("python3.7".to_string())
        );
        assert_eq!(
            sqs_messages[2].attributes["path"].string_value,
            Some("python37".to_string())
        );
        assert_eq!(
            sqs_messages[2].attributes["packageType"].string_value,
            Some("image".to_string())
        );

        assert_eq!(sqs_messages[3].attributes.len(), 5);
        assert_eq!(
            sqs_messages[3].attributes["architecture"].string_value,
            Some("x86_64".to_string())
        );
        assert_eq!(
            sqs_messages[3].attributes["memorysize"].string_value,
            Some("256".to_string())
        );
        assert_eq!(
            sqs_messages[3].attributes["runtime"].string_value,
            Some("nodejs18.x".to_string())
        );
        assert_eq!(
            sqs_messages[3].attributes["path"].string_value,
            Some("nodejs18x".to_string())
        );
        assert_eq!(
            sqs_messages[3].attributes["packageType"].string_value,
            Some("image".to_string())
        );

        assert_eq!(sqs_messages[4].attributes.len(), 5);
        assert_eq!(
            sqs_messages[4].attributes["architecture"].string_value,
            Some("arm64".to_string())
        );
        assert_eq!(
            sqs_messages[4].attributes["memorysize"].string_value,
            Some("256".to_string())
        );
        assert_eq!(
            sqs_messages[4].attributes["runtime"].string_value,
            Some("nodejs18.x".to_string())
        );
        assert_eq!(
            sqs_messages[4].attributes["path"].string_value,
            Some("nodejs18x".to_string())
        );
        assert_eq!(
            sqs_messages[4].attributes["packageType"].string_value,
            Some("image".to_string())
        );

        assert_eq!(sqs_messages[5].attributes.len(), 5);
        assert_eq!(
            sqs_messages[5].attributes["architecture"].string_value,
            Some("x86_64".to_string())
        );
        assert_eq!(
            sqs_messages[5].attributes["memorysize"].string_value,
            Some("256".to_string())
        );
        assert_eq!(
            sqs_messages[5].attributes["runtime"].string_value,
            Some("python3.7".to_string())
        );
        assert_eq!(
            sqs_messages[5].attributes["path"].string_value,
            Some("python37".to_string())
        );
        assert_eq!(
            sqs_messages[5].attributes["packageType"].string_value,
            Some("image".to_string())
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