use std::time::Duration;

use aws_lambda_events::event::sqs::SqsEventObj;
use common_lib::Runtime;
use lambda_manager::FunctionManager;
use lambda_runtime::{service_fn, Error, LambdaEvent};
use serde::Serialize;

use crate::{retry_manager::RetryManager, cloudwatch_manager::LogManager};
mod lambda_manager;
mod cloudwatch_manager;

mod retry_manager;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Response {
    status_code: u32,
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .with_ansi(false)
        .without_time()
        .init();
    let func = service_fn(func);
    lambda_runtime::run(func).await?;
    Ok(())
}

async fn func(event: LambdaEvent<SqsEventObj<Runtime>>) -> Result<Response, Error> {
    let role_arn = std::env::var("ROLE_ARN").expect("ROLE_ARN not set");
    let account_id = std::env::var("ACCOUNT_ID").expect("ACCOUNT_ID not set");
    let region = std::env::var("AWS_REGION").expect("AWS_REGION not set");
    for record in event.payload.records.iter() {
        let runtime = &record.body;
        let lambda_manager = lambda_manager::LambdaManager::new(None, &account_id, &region, runtime, &role_arn).await;
        let cloudwatch_manager = cloudwatch_manager::CloudWatchManager::new(None, runtime).await;
        println!("deleting function: {}", runtime.function_name());
        let retry = RetryManager::new(3, Duration::from_secs(1), Duration::from_secs(30));
        if retry
            .retry_async(|| async { lambda_manager.delete_function().await })
            .await?
        {
            println!("waiting for deletion");
            retry
                .retry_async(|| async { lambda_manager.wait_for_deletion().await })
                .await?;
        }
        println!("function deleted");
        retry.retry_async(|| async { cloudwatch_manager.delete_log_group().await }).await?;
        println!("log group deleted");
        retry.retry_async(|| async { cloudwatch_manager.create_log_group().await }).await?;
        println!("log group created");

        if runtime.image.is_some() {
            retry
            .retry_async(|| async { lambda_manager.create_function().await })
            .await?;
            println!("function created");
        }
    }
    Ok(Response { status_code: 200 })
}
