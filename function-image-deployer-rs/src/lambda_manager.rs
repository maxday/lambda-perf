use std::{thread, time::Duration};

use async_trait::async_trait;
use aws_sdk_lambda::Client as LambdaClient;
use common_lib::Runtime;
use lambda_runtime::Error;

pub struct LambdaManager<'a> {
    pub client: LambdaClient,
    pub runtime: &'a Runtime,
}

#[async_trait]
pub trait FunctionManager {
    async fn delete_function(&self) -> Result<(), Error>;
    async fn wait_for_deletion(&self) -> Result<(), Error>;
}

impl<'a> LambdaManager<'a> {
    pub async fn new(client: Option<LambdaClient>, runtime: &'a Runtime) -> LambdaManager<'a> {
        let client = match client {
            Some(client) => client,
            None => {
                let config = aws_config::from_env().load().await;
                LambdaClient::new(&config)
            }
        };
        LambdaManager { client, runtime }
    }
}

#[async_trait]
impl<'a> FunctionManager for LambdaManager<'a> {
    async fn delete_function(&self) -> Result<(), Error> {
        let function_name = self.runtime.function_name();
        self.client
            .delete_function()
            .function_name(&function_name)
            .send()
            .await?;
        Ok(())
    }
    async fn wait_for_deletion(&self) -> Result<(), Error> {
        let res = self
            .client
            .get_function()
            .function_name(&self.runtime.function_name())
            .send()
            .await;
        match res {
            Ok(_) => {
                println!("Waiting for function to be deleted");
                thread::sleep(Duration::from_secs(10));
                self.wait_for_deletion().await
            }
            Err(e) => {
                if e.to_string().contains("ResourceNotFoundException") {
                    return Ok(());
                }
                Err(Box::new(e))
            }
        }
    }
}
