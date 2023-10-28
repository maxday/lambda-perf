use std::{collections::HashMap, thread, time::Duration};

use async_trait::async_trait;
use aws_sdk_dynamodb::{
    types::{
        self, AttributeDefinition, BillingMode, KeySchemaElement, KeyType, ScalarAttributeType,
    },
    Client as DynamoDbClient,
};
use aws_sdk_lambda::Client as LambdaClient;
use aws_sdk_sqs::types::MessageAttributeValue;
use aws_sdk_sqs::Client as SQSClient;
use lambda_runtime::{service_fn, Error, LambdaEvent};
use serde::{Deserialize, Serialize};
use serde_json::Value;

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

async fn func(event: LambdaEvent<Value>) -> Result<Response, Error> {
    println!("event: {:?}", event);
    Ok(Response { status_code: 200 })
}
