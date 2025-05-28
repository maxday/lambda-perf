use lambda_runtime::{Error, LambdaEvent, service_fn};
use serde_json::Value;
use tracing::log::info;

use common_lib::{
    dynamodb_manager::{DynamoDBManager, TableManager},
    lambda_permission_manager::{LambdaPermissionManager, PermissionManager},
    manifest::ManifestManager,
    reponse::Response,
    sqs_manager::{QueueManager, SQSManager},
};

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .json()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .with_ansi(false)
        .with_current_span(false)
        .with_span_list(false)
        .without_time()
        .init();
    let func = service_fn(func);
    lambda_runtime::run(func).await?;
    Ok(())
}

async fn func(_: LambdaEvent<Value>) -> Result<Response, Error> {
    info!("checking env variables");
    let table_name = std::env::var("TABLE_NAME").expect("TABLE_NAME not set");
    let report_log_processor_arn =
        std::env::var("REPORT_LOG_PROCESSOR_ARN").expect("REPORT_LOG_PROCESSOR_ARN not set");
    let function_queue_name =
        std::env::var("FUNCTION_QUEUE_NAME").expect("FUNCTION_QUEUE_NAME not set");
    let account_id = std::env::var("ACCOUNT_ID").expect("ACCOUNT_ID not set");
    let region = std::env::var("AWS_REGION").expect("AWS_REGION not set");

    let db_manager = DynamoDBManager::new(table_name, None).await;

    info!("deleting table");
    db_manager.delete().await?;
    db_manager.wait_for_deletion().await?;

    info!("creating the table");
    db_manager.create().await?;
    db_manager.wait_for_created().await?;

    let lambda_permission_manager = PermissionManager::new(report_log_processor_arn, None).await;

    info!("removing permission");
    lambda_permission_manager.remove_permission().await?;

    info!("adding permission");
    lambda_permission_manager.add_permission().await?;

    let manifest_manager = ManifestManager::new("manifest.json");

    let queue_manager = SQSManager::new(
        &account_id,
        &region,
        &function_queue_name,
        manifest_manager,
        None,
    )
    .await;

    info!("sending messages");
    queue_manager.send_message().await?;

    Ok(Response::success())
}
