

use aws_lambda_events::event::sqs::SqsEventObj;


use common_lib::lambda_manager::{LambdaManager};

use common_lib::runtime::Runtime;

use lambda_runtime::{service_fn, Error, LambdaEvent};
use serde::Serialize;
use tracing::info;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Response {
    status_code: u32,
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .json()
        .with_max_level(tracing::Level::INFO)
        .with_current_span(false)
        .with_target(false)
        .with_ansi(false)
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
    _lambda_manager: &LambdaManager<'a>,
) -> Result<Response, Error> {
    for record in event.payload.records.iter() {
        let runtime = &record.body;
        info!("processing runtime: {}", runtime.function_name());
    }
    Ok(Response { status_code: 200 })
}
