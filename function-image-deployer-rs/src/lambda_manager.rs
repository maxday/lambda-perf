use std::{thread, time::Duration};

use async_trait::async_trait;
use aws_sdk_lambda::{
    types::{
        builders::FunctionCodeBuilder, Architecture, ImageConfig, PackageType,
        Runtime as LambdaRuntime,
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

    async fn create_image_function(&self, image_uri: String) -> Result<(), Error> {
        let function_name = self.runtime.function_name();
        info!("Creating IMAGE function: {}", function_name);
        info!("Image URI: {}", image_uri);
        let package_type = PackageType::Image;
        let res = self
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
            .architectures(Architecture::from(self.runtime.architecture.as_str()))
            .send()
            .await;
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
                return match &layer.x86_64 {
                    Some(arn) => Some(vec![arn.replace("_REGION_", region)]),
                    None => None,
                };
            }
            if runtime.architecture == "arm64" {
                return match &layer.arm64 {
                    Some(arn) => Some(vec![arn.replace("_REGION_", region)]),
                    None => None,
                };
            }
            None
        }
        None => None,
    }
}

#[cfg(test)]
mod tests {
    use common_lib::LayerInfo;

    use super::*;

    #[test]
    fn test_get_layer_name_no_layer() {
        let runtime = Runtime {
            architecture: "arm64".to_string(),
            memory_size: 128,
            runtime: "nodejs18.x".to_string(),
            path: "nodejs18x".to_string(),
            display_name: "nodejs18.x".to_string(),
            handler: "index.handler".to_string(),
            image: None,
            layer: None,
        };
        assert_eq!(get_layer_name(&runtime, "us-east-1"), None);
    }

    #[test]
    fn test_get_layer_name_no_correct_arch_layer() {
        let runtime = Runtime {
            architecture: "arm64".to_string(),
            memory_size: 128,
            runtime: "nodejs18.x".to_string(),
            path: "nodejs18x".to_string(),
            display_name: "nodejs18.x".to_string(),
            handler: "index.handler".to_string(),
            image: None,
            layer: Some(LayerInfo {
                x86_64: Some(
                    "arn:aws:lambda:_REGION_:226609089145:layer:bun-1_0_0-x64:1".to_string(),
                ),
                arm64: None,
            }),
        };
        assert_eq!(get_layer_name(&runtime, "us-east-1"), None);
    }

    #[test]
    fn test_get_layer_name_correct_arch_layer_arm64() {
        let runtime = Runtime {
            architecture: "arm64".to_string(),
            memory_size: 128,
            runtime: "nodejs18.x".to_string(),
            path: "nodejs18x".to_string(),
            display_name: "nodejs18.x".to_string(),
            handler: "index.handler".to_string(),
            image: None,
            layer: Some(LayerInfo {
                x86_64: None,
                arm64: Some(
                    "arn:aws:lambda:_REGION_:226609089145:layer:bun-1_0_0-arm:1".to_string(),
                ),
            }),
        };
        assert_eq!(
            get_layer_name(&runtime, "us-east-1"),
            Some(vec![String::from(
                "arn:aws:lambda:us-east-1:226609089145:layer:bun-1_0_0-arm:1"
            )])
        );
    }

    #[test]
    fn test_get_layer_name_correct_arch_layer_x86_64() {
        let runtime = Runtime {
            architecture: "x86_64".to_string(),
            memory_size: 128,
            runtime: "nodejs18.x".to_string(),
            path: "nodejs18x".to_string(),
            display_name: "nodejs18.x".to_string(),
            handler: "index.handler".to_string(),
            image: None,
            layer: Some(LayerInfo {
                x86_64: Some(
                    "arn:aws:lambda:_REGION_:226609089145:layer:bun-1_0_0-x64:1".to_string(),
                ),
                arm64: None,
            }),
        };
        assert_eq!(
            get_layer_name(&runtime, "us-east-1"),
            Some(vec![String::from(
                "arn:aws:lambda:us-east-1:226609089145:layer:bun-1_0_0-x64:1"
            )])
        );
    }
}
