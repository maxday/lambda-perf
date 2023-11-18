use lambda_runtime::{service_fn, Error, LambdaEvent};
use serde::Serialize;
use serde_json::Value;
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

    let handler_func_closure = |event: LambdaEvent<Value>| async move {
        process_event(event).await
    };

    lambda_runtime::run(service_fn(handler_func_closure)).await?;
    Ok(())
}

async fn process_event(
    event: LambdaEvent<Value>,
) -> Result<Response, Error> {
    info!("processing event: {}", event.payload);
    Ok(Response { status_code: 200 })
}