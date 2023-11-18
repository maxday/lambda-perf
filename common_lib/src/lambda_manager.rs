use std::time::SystemTime;
use std::{thread, time::Duration};

use async_trait::async_trait;
use aws_sdk_lambda::types::builders::EnvironmentBuilder;
use aws_sdk_lambda::types::SnapStartApplyOn::PublishedVersions;
use aws_sdk_lambda::{
    types::{
        builders::{FunctionCodeBuilder, SnapStartBuilder},
        Architecture, ImageConfig, PackageType, Runtime as LambdaRuntime,
    },
    Client as LambdaClient,
};

use lambda_runtime::Error;

use tracing::info;

use crate::runtime::Runtime;

pub struct LambdaManager<'a> {
    pub client: LambdaClient,
    pub role_arn: &'a str,
    pub account_id: &'a str,
    pub region: &'a str,
}

#[async_trait]
pub trait FunctionManager {
    async fn delete_function(&self, runtime: &Runtime) -> Result<bool, Error>;
    async fn wait_for_deletion(&self, runtime: &Runtime) -> Result<(), Error>;
    async fn create_function(&self, runtime: &Runtime) -> Result<(), Error>;
    async fn update_function_configuration(&self, function_name: &String) -> Result<(), Error>;
    async fn invoke_function(&self, function_name: &String) -> Result<(), Error>;
    async fn publish_version(&self, runtime: &Runtime) -> Result<(), Error>;
    async fn create_snapstart_function(&self, runtime: &Runtime) -> Result<(), Error>;
    async fn create_image_function(&self, runtime: &Runtime) -> Result<(), Error>;
    async fn create_zip_function(&self, runtime: &Runtime) -> Result<(), Error>;
    async fn list_versions_by_function(&self, runtime: &Runtime) -> Result<Vec<String>, Error>;
}

impl<'a> LambdaManager<'a> {
    pub async fn new(
        client: Option<LambdaClient>,
        account_id: &'a str,
        region: &'a str,
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
            role_arn,
            account_id,
            region,
        }
    }
}

#[async_trait]
impl<'a> FunctionManager for LambdaManager<'a> {
    async fn delete_function(&self, runtime: &Runtime) -> Result<bool, Error> {
        let function_name = runtime.function_name();
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
    async fn wait_for_deletion(&self, runtime: &Runtime) -> Result<(), Error> {
        let res = self
            .client
            .get_function()
            .function_name(runtime.function_name())
            .send()
            .await;
        match res {
            Ok(_) => {
                info!("Waiting for function to be deleted");
                thread::sleep(Duration::from_secs(10));
                self.wait_for_deletion(runtime).await
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

    async fn create_function(&self, runtime: &Runtime) -> Result<(), Error> {
        if runtime.is_snapstart {
            return self.create_snapstart_function(runtime).await;
        }
        match runtime.image {
            Some(_) => self.create_image_function(runtime).await,
            None => self.create_zip_function(runtime).await,
        }
    }

    async fn list_versions_by_function(&self, runtime: &Runtime) -> Result<Vec<String>, Error> {
        let mut arns = vec![];
        let result = self
            .client
            .list_versions_by_function()
            .function_name(runtime.function_name())
            .send()
            .await?;
        if let Some(versions) = result.versions {
            for version in versions {
                if let Some(arn) = version.function_arn() {
                    arns.push(arn.to_string());
                }
            }
        }
        Ok(arns)
    }

    async fn create_snapstart_function(&self, runtime: &Runtime) -> Result<(), Error> {
        self.create_zip_function(runtime).await?;
        for i in 0..10 {
            thread::sleep(Duration::from_secs(10));
            info!("Invoking function #{}", i);
            self.invoke_function(&runtime.function_name()).await?;
            thread::sleep(Duration::from_secs(10));
            self.update_function_configuration(&runtime.function_name())
                .await?;
            thread::sleep(Duration::from_secs(10));
            info!("Publishing function #{}", i);
            self.publish_version(runtime).await?;
            thread::sleep(Duration::from_secs(10));
        }
        Ok(())
    }

    async fn invoke_function(&self, function_name: &String) -> Result<(), Error> {
        let res = self
            .client
            .invoke()
            .function_name(function_name)
            .send()
            .await?;
        info!("Result: {:?}", res);
        Ok(())
    }

    async fn update_function_configuration(&self, function_name: &String) -> Result<(), Error> {
        let current_time = SystemTime::now();
        let current_time = format!("{:?}", current_time);
        let res = self
            .client
            .update_function_configuration()
            .function_name(function_name)
            .environment(
                EnvironmentBuilder::default()
                    .variables("current_time", current_time)
                    .build(),
            )
            .send()
            .await?;
        info!("Result: {:?}", res);

        Ok(())
    }

    async fn publish_version(&self, runtime: &Runtime) -> Result<(), Error> {
        let res = self
            .client
            .publish_version()
            .function_name(runtime.function_name())
            .send()
            .await?;
        info!("Result: {:?}", res);
        Ok(())
    }

    async fn create_image_function(&self, runtime: &Runtime) -> Result<(), Error> {
        let function_name = runtime.function_name();
        let image_uri = runtime.image_name(self.account_id, self.region);
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
                    .image_uri(runtime.image_name(self.account_id, self.region))
                    .build(),
            )
            .image_config(
                ImageConfig::builder()
                    .command(runtime.handler.as_str())
                    .build(),
            )
            .role(self.role_arn)
            .memory_size(runtime.memory_size)
            .architectures(Architecture::from(runtime.architecture.as_str()));
        if runtime.is_snapstart {
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

    async fn create_zip_function(&self, runtime: &Runtime) -> Result<(), Error> {
        let function_name = runtime.function_name();
        info!("Creating ZIP function: {}", function_name);
        let package_type = PackageType::Zip;
        let layers = get_layer_name(runtime, self.region);
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
                        runtime.path, runtime.architecture
                    ))
                    .build(),
            )
            .role(self.role_arn)
            .memory_size(runtime.memory_size)
            .architectures(Architecture::from(runtime.architecture.as_str()))
            .runtime(LambdaRuntime::from(runtime.runtime.as_str()))
            .handler(runtime.handler.as_str())
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
