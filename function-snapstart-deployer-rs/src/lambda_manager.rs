use std::{thread, time::Duration};

use async_trait::async_trait;
use aws_sdk_lambda::types::SnapStartApplyOn::PublishedVersions;
use aws_sdk_lambda::{
    types::{
        builders::{FunctionCodeBuilder, SnapStartBuilder},
        Architecture, ImageConfig, PackageType, Runtime as LambdaRuntime,
    },
    Client as LambdaClient,
};
use common_lib::Runtime;
use lambda_runtime::Error;

use tracing::info;

pub struct LambdaManager<'a> {
    pub client: LambdaClient,
    pub runtime: &'a Runtime,
    pub role_arn: &'a str,
    pub account_id: &'a str,
    pub region: &'a str,
}

#[async_trait]
pub trait FunctionManager {
    async fn delete_function(&self) -> Result<bool, Error>;
    async fn wait_for_deletion(&self) -> Result<(), Error>;
    async fn create_function(&self) -> Result<(), Error>;
    async fn invoke_function(&self) -> Result<(), Error>;
    async fn publish_version(&self) -> Result<(), Error>;
    async fn create_snapstart_function(&self) -> Result<(), Error>;
    async fn create_image_function(&self, image_uri: String) -> Result<(), Error>;
    async fn create_zip_function(&self) -> Result<(), Error>;
}

impl<'a> LambdaManager<'a> {
    pub async fn new(
        client: Option<LambdaClient>,
        account_id: &'a str,
        region: &'a str,
        runtime: &'a Runtime,
        role_arn: &'a str,
    ) -> LambdaManager<'a> {
        let client = match client {
            Some(client) => client,
            None => {
                let config = aws_config::from_env().load().await;
                LambdaClient::new(&config)
            }
        };
        LambdaManager {
            client,
            runtime,
            role_arn,
            account_id,
            region,
        }
    }
}

#[async_trait]
impl<'a> FunctionManager for LambdaManager<'a> {
    async fn delete_function(&self) -> Result<bool, Error> {
        let function_name = self.runtime.function_name();
        let res = self
            .client
            .delete_function()
            .function_name(&function_name)
            .send()
            .await;
        match res {
            Ok(_) => Ok(true),
            Err(e) => {
                let e = e.into_service_error();
                if e.is_resource_not_found_exception() {
                    return Ok(false);
                }
                Err(Box::new(e))
            }
        }
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
                info!("Waiting for function to be deleted");
                thread::sleep(Duration::from_secs(10));
                self.wait_for_deletion().await
            }
            Err(e) => {
                let e = e.into_service_error();
                if e.is_resource_not_found_exception() {
                    return Ok(());
                }
                Err(Box::new(e))
            }
        }
    }

    async fn create_function(&self) -> Result<(), Error> {
        match self.runtime.image {
            Some(_) => {
                self.create_image_function(self.runtime.image_name(self.account_id, self.region))
                    .await
            }
            None => self.create_zip_function().await,
        }
    }

    async fn create_snapstart_function(&self) -> Result<(), Error> {
        self.create_zip_function().await?;
        thread::sleep(Duration::from_secs(10));
        self.invoke_function().await?;
        thread::sleep(Duration::from_secs(10));
        self.publish_version().await?;
        thread::sleep(Duration::from_secs(10));
        Ok(())
    }

    async fn invoke_function(&self) -> Result<(), Error> {
        self.client
            .invoke()
            .function_name(&self.runtime.function_name())
            .send()
            .await?;
        Ok(())
    }

    async fn publish_version(&self) -> Result<(), Error> {
        self.client
            .publish_version()
            .function_name(&self.runtime.function_name())
            .send()
            .await?;
        Ok(())
    }

    async fn create_image_function(&self, image_uri: String) -> Result<(), Error> {
        let function_name = self.runtime.function_name();
        info!("Creating IMAGE function: {}", function_name);
        info!("Image URI: {}", image_uri);
        let package_type = PackageType::Image;
        let mut res = self
            .client
            .create_function()
            .function_name(&function_name)
            .package_type(package_type)
            .code(
                FunctionCodeBuilder::default()
                    .image_uri(self.runtime.image_name(self.account_id, self.region))
                    .build(),
            )
            .image_config(
                ImageConfig::builder()
                    .command(self.runtime.handler.as_str())
                    .build(),
            )
            .role(self.role_arn)
            .memory_size(self.runtime.memory_size)
            .architectures(Architecture::from(self.runtime.architecture.as_str()));
        if self.runtime.is_snapstart {
            res = res.snap_start(
                SnapStartBuilder::default()
                    .apply_on(PublishedVersions)
                    .build(),
            );
        }
        let res = res.send().await;
        match res {
            Ok(_) => Ok(()),
            Err(e) => Err(Box::new(e.into_service_error())),
        }
    }

    async fn create_zip_function(&self) -> Result<(), Error> {
        let function_name = self.runtime.function_name();
        info!("Creating ZIP function: {}", function_name);
        let package_type = PackageType::Zip;
        let layers = get_layer_name(self.runtime, self.region);
        let res = self
            .client
            .create_function()
            .function_name(&function_name)
            .package_type(package_type)
            .code(
                FunctionCodeBuilder::default()
                    .s3_bucket(format!("lambda-perf-{}", self.region))
                    .s3_key(format!(
                        "{}/code_{}.zip",
                        self.runtime.path, self.runtime.architecture
                    ))
                    .build(),
            )
            .role(self.role_arn)
            .memory_size(self.runtime.memory_size)
            .architectures(Architecture::from(self.runtime.architecture.as_str()))
            .runtime(LambdaRuntime::from(self.runtime.runtime.as_str()))
            .handler(self.runtime.handler.as_str())
            .set_layers(layers)
            .send()
            .await;
        match res {
            Ok(_) => Ok(()),
            Err(e) => Err(Box::new(e.into_service_error())),
        }
    }
}

fn get_layer_name(runtime: &Runtime, region: &str) -> Option<Vec<String>> {
    match &runtime.layer {
        Some(layer) => {
            if runtime.architecture == "x86_64" {
                return layer
                    .x86_64
                    .as_ref()
                    .map(|arn| vec![arn.replace("_REGION_", region)]);
            }
            if runtime.architecture == "arm64" {
                return layer
                    .arm64
                    .as_ref()
                    .map(|arn| vec![arn.replace("_REGION_", region)]);
            }
            None
        }
        None => None,
    }
}
