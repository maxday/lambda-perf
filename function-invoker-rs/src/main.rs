use aws_lambda_events::event::sqs::SqsEventObj;
use common_lib::lambda_manager::{FunctionManager, LambdaManager};
use common_lib::reponse::Response;
use common_lib::retry_manager::RetryManager;
use common_lib::runtime::Runtime;
use lambda_runtime::{Error, LambdaEvent, service_fn};
use std::thread;
use std::time::Duration;
use tracing::info;

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

    let role_arn = std::env::var("ROLE_ARN").expect("ROLE_ARN not set");
    let account_id = std::env::var("ACCOUNT_ID").expect("ACCOUNT_ID not set");
    let region = std::env::var("AWS_REGION").expect("AWS_REGION not set");
    let lambda_manager = LambdaManager::new(None, &account_id, &region, &role_arn).await;

    lambda_runtime::run(service_fn(|event: LambdaEvent<SqsEventObj<Runtime>>| {
        let lambda_manager_ref = &lambda_manager; // Reference instead of move
        async move { process_event(event, lambda_manager_ref).await }
    }))
    .await?;

    Ok(())
}

async fn process_event(
    event: LambdaEvent<SqsEventObj<Runtime>>,
    lambda_manager: &LambdaManager<'_>,
) -> Result<Response, Error> {
    for record in event.payload.records.iter() {
        let retry = RetryManager::new(3, Duration::from_secs(1), Duration::from_secs(30));
        let runtime = &record.body;
        info!("processing runtime: {}", runtime.function_name());
        invoke(runtime, &retry, lambda_manager).await?;
    }
    Ok(Response::success())
}

async fn invoke(
    runtime: &Runtime,
    retry: &RetryManager,
    lambda_manager: &LambdaManager<'_>,
) -> Result<(), Error> {
    for i in 0..10 {
        info!("run #: {}", i);
        retry
            .retry_async(|| async {
                lambda_manager
                    .update_function_configuration(&runtime.function_name())
                    .await
            })
            .await?;
        info!("function updated to ensure cold start");
        thread::sleep(Duration::from_secs(5));
        retry
            .retry_async(|| async {
                lambda_manager
                    .invoke_function(&runtime.function_name())
                    .await
            })
            .await?;
        info!("function invoked");
    }
    Ok(())
}
