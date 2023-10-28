use aws_lambda_events::{event::sqs::SqsEventObj, sqs::SqsEvent};
use common_lib::Runtime;
use lambda_runtime::{service_fn, Error, LambdaEvent};
use serde::{Deserialize, Serialize};
use serde_json::Value;

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
    println!("event: {:?}", event);
    let data = &event.payload.records[0];
    tracing::info!(text = ?data, "data received from SQS");
    Ok(Response { status_code: 200 })
}
