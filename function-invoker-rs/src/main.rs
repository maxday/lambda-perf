use std::thread;
use std::time::Duration;

use aws_lambda_events::event::sqs::SqsEventObj;

use common_lib::lambda_manager::{FunctionManager, LambdaManager};

use common_lib::reponse::Response;
use common_lib::retry_manager::RetryManager;
use common_lib::runtime::Runtime;

use lambda_runtime::{service_fn, Error, LambdaEvent};
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
    let lambda_manager_ref = &lambda_manager;
    let handler_func_closure = |event: LambdaEvent<SqsEventObj<Runtime>>| async move {
        process_event(event, lambda_manager_ref).await
    };

    lambda_runtime::run(service_fn(handler_func_closure)).await?;
    Ok(())
}

async fn process_event<'a>(
    event: LambdaEvent<SqsEventObj<Runtime>>,
    lambda_manager: &LambdaManager<'a>,
) -> Result<Response, Error> {
    for record in event.payload.records.iter() {
        let retry = RetryManager::new(3, Duration::from_secs(1), Duration::from_secs(30));
        let runtime = &record.body;
        info!("processing runtime: {}", runtime.function_name());
        match runtime.is_snapstart() {
            true => invoke_snapstart(runtime, &retry, lambda_manager).await,
            false => invoke(runtime, &retry, lambda_manager).await,
        }?;
    }
    Ok(Response::success())
}

async fn invoke_snapstart<'a>(
    runtime: &Runtime,
    retry: &RetryManager,
    lambda_manager: &LambdaManager<'a>,
) -> Result<(), Error> {
    let arns = lambda_manager.list_versions_by_function(runtime).await?;
    for i in 0..10 {
        info!("snapstart run #: {}", i);
        if let Some(arn) = arns.get(i) {
            info!("arn = {}", arn);
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
                .retry_async(|| async { lambda_manager.invoke_function(arn).await })
                .await?;
            info!("function invoked");
        }
    }
    Ok(())
}

async fn invoke<'a>(
    runtime: &Runtime,
    retry: &RetryManager,
    lambda_manager: &LambdaManager<'a>,
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
        thread::sleep(Duration::from_secs(20));
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
