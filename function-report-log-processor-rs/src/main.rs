use aws_lambda_events::cloudwatch_logs::LogsEvent;

use common_lib::{
    dynamodb_manager::{DynamoDBManager, TableManager},
    manifest::{Manifest, ManifestManager},
    reponse::Response,
    report_log::{ReportLog, ReportLogData},
};
use lambda_runtime::{Error, LambdaEvent, service_fn};
use tracing::info;

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

    let table_name = std::env::var("TABLE_NAME").expect("TABLE_NAME not set");

    let manifest = ManifestManager::new("manifest.json");
    let manifest = manifest.read_manifest();
    let manifest_ref = &manifest;

    let db_manager = DynamoDBManager::new(table_name, None).await;
    let db_manager_ref = &db_manager;

    let handler_func_closure = |event: LambdaEvent<LogsEvent>| async move {
        process_event(event, manifest_ref, db_manager_ref).await
    };

    lambda_runtime::run(service_fn(handler_func_closure)).await?;
    Ok(())
}

async fn process_event(
    event: LambdaEvent<LogsEvent>,
    manifest: &Manifest,
    dynamodb_manager: &DynamoDBManager,
) -> Result<Response, Error> {
    let data = event.payload.aws_logs.data;
    info!("Coming from log_group  = : {}", data.log_group);
    let report_log = ReportLog::new(&data.log_group, manifest);
    info!("{:?}", report_log);
    for log_event in data.log_events {
        info!("log_event = {:?}", log_event.message);
        match ReportLogData::new(&log_event.message) {
            Ok(report_log_data) => {
                info!("report_log_data = {:?}", report_log);
                dynamodb_manager
                    .insert_report_log(&report_log, &report_log_data)
                    .await?;
            }
            Err(error_message) => {
                info!("Could not create report_log_data: {}", error_message);
            }
        }
    }
    Ok(Response::success())
}
