use lambda_runtime::{service_fn, Error, LambdaEvent};
use serde_json::Value;
use tracing::log::debug;

use common_lib::Response;

mod lambda_manager;
use lambda_manager::{LambdaManager, PermissionManager};

mod sqs_manager;
use sqs_manager::{QueueManager, SQSManager};

pub mod dynamodb_manager;
use dynamodb_manager::{DynamoDBManager, TableManager};

mod manifest;
use manifest::ManifestManager;

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::DEBUG)
        .with_target(false)
        .with_ansi(false)
        .without_time()
        .init();
    let func = service_fn(func);
    lambda_runtime::run(func).await?;
    Ok(())
}

async fn func(_: LambdaEvent<Value>) -> Result<Response, Error> {
    debug!("checking env variables");
    let table_name = std::env::var("TABLE_NAME").expect("TABLE_NAME not set");
    let log_processor_arn = std::env::var("LOG_PROCESSOR_ARN").expect("LOG_PROCESSOR_ARN not set");
    let image_queue_name = std::env::var("IMAGE_QUEUE_NAME").expect("IMAGE_QUEUE_NAME not set");
    let account_id = std::env::var("ACCOUNT_ID").expect("ACCOUNT_ID not set");
    let region = std::env::var("AWS_REGION").expect("AWS_REGION not set");

    let db_manager = DynamoDBManager::new(table_name, None).await;

    debug!("deleting table");
    db_manager.delete().await?;
    db_manager.wait_for_deletion().await?;

    debug!("creating the table");
    db_manager.create().await?;
    db_manager.wait_for_created().await?;

    let lambda_manager = LambdaManager::new(log_processor_arn, None).await;

    debug!("removing permission");
    lambda_manager.remove_permission().await?;

    debug!("adding permission");
    lambda_manager.add_permission().await?;

    let manifest_manager = ManifestManager::new("manifest.json");

    let queue_manager = SQSManager::new(
        &account_id,
        &region,
        &image_queue_name,
        manifest_manager,
        None,
    )
    .await;

    tracing::info!("sending messages");
    queue_manager.send_message().await?;

    Ok(Response::success())
}
