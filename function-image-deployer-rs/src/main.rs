use aws_lambda_events::{event::sqs::SqsEventObj};
use common_lib::Runtime;
use lambda_manager::FunctionManager;
use lambda_runtime::{service_fn, Error, LambdaEvent};
use serde::{Serialize};


mod lambda_manager;

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
    let runtime = &event.payload.records[0].body;
    let lambda_manager = lambda_manager::LambdaManager::new(None, runtime).await;
    lambda_manager.delete_function().await?;
    Ok(Response { status_code: 200 })
}
