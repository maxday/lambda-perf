use std::time::Duration;

use aws_lambda_events::event::sqs::SqsEventObj;
use common_lib::cloudwatch_manager::{CloudWatchManager, LogManager};
use common_lib::invoker_sqs_manager::InvokerSQSManager;
use common_lib::reponse::Response;
use common_lib::runtime::Runtime;
use common_lib::{lambda_manager::FunctionManager, retry_manager::RetryManager};

use common_lib::lambda_manager::LambdaManager;
use lambda_runtime::{Error, LambdaEvent, service_fn};
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
    let report_log_processor_arn =
        std::env::var("REPORT_LOG_PROCESSOR_ARN").expect("REPORT_LOG_PROCESSOR_ARN not set");
    let invoker_queue_name =
        std::env::var("INVOKER_QUEUE_NAME").expect("INVOKER_QUEUE_NAME not set");

    let invoker_sqs_manager =
        InvokerSQSManager::new(&account_id, &region, &invoker_queue_name, None).await;

    let lambda_manager = LambdaManager::new(None, &account_id, &region, &role_arn).await;

    let cloudwatch_manager = CloudWatchManager::new(None, report_log_processor_arn).await;

    let lambda_manager_ref = &lambda_manager;
    let cloudwatch_manager_ref = &cloudwatch_manager;
    let invoker_sqs_manager_ref = &invoker_sqs_manager;

    let handler_func_closure = |event: LambdaEvent<SqsEventObj<Runtime>>| async move {
        process_event(
            event,
            lambda_manager_ref,
            cloudwatch_manager_ref,
            invoker_sqs_manager_ref,
        )
        .await
    };

    lambda_runtime::run(service_fn(handler_func_closure)).await?;
    Ok(())
}

async fn process_event<'a>(
    event: LambdaEvent<SqsEventObj<Runtime>>,
    lambda_manager: &LambdaManager<'a>,
    cloudwatch_manager: &CloudWatchManager,
    invoker_sqs_manager: &InvokerSQSManager,
) -> Result<Response, Error> {
    for record in event.payload.records.iter() {
        let runtime = &record.body;
        info!("processing runtime: {:?}", runtime);
        info!("deleting function: {}", runtime.function_name());
        let retry = RetryManager::new(3, Duration::from_secs(1), Duration::from_secs(30));
        if retry
            .retry_async(|| async { lambda_manager.delete_function(runtime).await })
            .await?
        {
            info!("waiting for deletion");
            retry
                .retry_async(|| async { lambda_manager.wait_for_deletion(runtime).await })
                .await?;
        }
        info!("function deleted");
        retry
            .retry_async(|| async { cloudwatch_manager.delete_log_group(runtime).await })
            .await?;
        info!("log group deleted");
        retry
            .retry_async(|| async { cloudwatch_manager.create_log_group(runtime).await })
            .await?;
        info!("log group created");

        retry
            .retry_async(|| async { lambda_manager.create_function(runtime).await })
            .await?;
        info!("function created");

        retry
            .retry_async(|| async {
                cloudwatch_manager
                    .create_log_subscription_filter(runtime)
                    .await
            })
            .await?;
        info!("log subscription filter created");

        invoker_sqs_manager.send_message(runtime).await?;
    }
    Ok(Response::success())
}
