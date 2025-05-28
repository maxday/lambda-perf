use aws_sdk_lambda::types::{PackageType, Runtime as LambdaRuntime};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Serialize, Deserialize, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Runtime {
    display_name: String,
    runtime: String,
    handler: String,
    path: String,
    architecture: String,
    memory_size: i32,
    image: Option<Image>,
    layer: Option<LayerInfo>,
}

impl Runtime {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        display_name: String,
        runtime: String,
        handler: String,
        path: String,
        architecture: String,
        memory_size: i32,
        image: Option<Image>,
        layer: Option<LayerInfo>
    ) -> Self {
        Runtime {
            display_name,
            runtime,
            handler,
            path,
            architecture,
            memory_size,
            image,
            layer
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct LayerInfo {
    pub x86_64: Option<String>,
    pub arm64: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Image {
    pub base_image: String,
}

impl Image {
    pub fn new(base_image: String) -> Self {
        Image { base_image }
    }
}

impl Runtime {
    pub fn package_type(&self) -> PackageType {
        match self.image {
            Some(_) => PackageType::Image,
            None => PackageType::Zip,
        }
    }
    pub fn function_name(&self) -> String {
        format!(
            "lambda-perf-{}-{}-{}-{}",
            self.path,
            self.package_type().as_str().to_lowercase(),
            self.memory_size,
            self.architecture
        )
    }
    pub fn image_name(&self, account_id: &str, region: &str) -> String {
        format!(
            "{}.dkr.ecr.{}.amazonaws.com/lambda-perf:{}-{}",
            account_id, region, self.path, self.architecture
        )
    }

    pub fn build_s3_key(&self) -> String {
        format!("{}/code_{}.zip", self.path, self.architecture)
    }

    pub fn has_image(&self) -> bool {
        self.image.is_some()
    }

    pub fn json(&self) -> String {
        json!(&self).to_string()
    }

    pub fn memory_size(&self) -> i32 {
        self.memory_size
    }

    pub fn architecture(&self) -> &str {
        &self.architecture
    }

    pub fn path(&self) -> &str {
        &self.path
    }

    pub fn runtime(&self) -> LambdaRuntime {
        LambdaRuntime::from(self.runtime.as_str())
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }

    pub fn handler(&self) -> &str {
        &self.handler
    }

    pub fn get_layer_name(&self, region: &str) -> Option<Vec<String>> {
        match &self.layer {
            Some(layer) => {
                if self.architecture == "x86_64" {
                    return layer
                        .x86_64
                        .as_ref()
                        .map(|arn| vec![arn.replace("_REGION_", region)]);
                }
                if self.architecture == "arm64" {
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
}

#[cfg(test)]
mod tests {

    use super::*;

    #[test]
    fn test_package_type_zip() {
        let test_runtime = Runtime::new(
            String::from("nodejs20"),
            String::from("nodejs20.x"),
            String::from("index.handler"),
            String::from("nodejs20"),
            String::from("arm64"),
            128,
            None,
            None,
        );
        assert_eq!(test_runtime.package_type(), PackageType::Zip);
        assert!(!test_runtime.has_image());
    }

    #[test]
    fn test_build_s3_key() {
        let test_runtime = Runtime::new(
            String::from("nodejs20"),
            String::from("nodejs20.x"),
            String::from("index.handler"),
            String::from("nodejs20"),
            String::from("arm64"),
            128,
            None,
            None,
        );
        assert_eq!(test_runtime.build_s3_key(), "nodejs20/code_arm64.zip");
    }

    #[test]
    fn test_accessors() {
        let test_runtime = Runtime::new(
            String::from("nodejs20 display"),
            String::from("nodejs20.x"),
            String::from("index.handler"),
            String::from("nodejs20"),
            String::from("arm64"),
            128,
            None,
            None,
        );
        assert_eq!(test_runtime.architecture(), "arm64");
        assert_eq!(test_runtime.memory_size(), 128);
        assert_eq!(test_runtime.handler(), "index.handler");
        assert_eq!(test_runtime.runtime(), LambdaRuntime::Nodejs20x);
        assert_eq!(test_runtime.path(), "nodejs20");
        assert_eq!(test_runtime.display_name(), "nodejs20 display");
    }

    #[test]
    fn test_package_type_image() {
        let test_runtime = Runtime::new(
            String::from("nodejs20"),
            String::from("nodejs20.x"),
            String::from("index.handler"),
            String::from("nodejs20"),
            String::from("arm64"),
            128,
            Some(Image::new(String::from("test_image"))),
            None,
        );
        assert_eq!(test_runtime.package_type(), PackageType::Image);
        assert!(test_runtime.has_image());
    }

    #[test]
    fn test_function_name() {
        let test_runtime = Runtime::new(
            String::from("nodejs20"),
            String::from("nodejs20.x"),
            String::from("index.handler"),
            String::from("nodejs20"),
            String::from("arm64"),
            128,
            None,
            None,
        );
        assert_eq!(
            test_runtime.function_name(),
            "lambda-perf-nodejs20-zip-128-arm64"
        );
    }

    #[test]
    fn test_image_name() {
        let test_runtime = Runtime::new(
            String::from("nodejs20"),
            String::from("nodejs20.x"),
            String::from("index.handler"),
            String::from("nodejs20"),
            String::from("arm64"),
            128,
            Some(Image::new(String::from("test_image"))),
            None,
        );
        assert_eq!(
            test_runtime.image_name("0123456789", "us-east-1"),
            "0123456789.dkr.ecr.us-east-1.amazonaws.com/lambda-perf:nodejs20-arm64"
        );
    }

    #[test]
    fn test_json() {
        let test_runtime = Runtime::new(
            String::from("nodejs20"),
            String::from("nodejs20.x"),
            String::from("index.handler"),
            String::from("nodejs20"),
            String::from("arm64"),
            128,
            Some(Image::new(String::from("test_image"))),
            None
        );
        assert_eq!(
            test_runtime.json(),
            "{\"architecture\":\"arm64\",\"displayName\":\"nodejs20\",\"handler\":\"index.handler\",\"image\":{\"baseImage\":\"test_image\"},\"layer\":null,\"memorySize\":128,\"path\":\"nodejs20\",\"runtime\":\"nodejs20.x\"}"
        );
    }

    #[test]
    fn test_layer_name_none() {
        let test_runtime = Runtime::new(
            String::from("nodejs20"),
            String::from("nodejs20.x"),
            String::from("index.handler"),
            String::from("nodejs20"),
            String::from("arm64"),
            128,
            Some(Image::new(String::from("test_image"))),
            None,
        );
        assert_eq!(test_runtime.get_layer_name("us-east-1"), None);
    }

    #[test]
    fn test_layer_name_x86() {
        let test_runtime = Runtime::new(
            String::from("nodejs20"),
            String::from("nodejs20.x"),
            String::from("index.handler"),
            String::from("nodejs20"),
            String::from("x86_64"),
            128,
            Some(Image::new(String::from("test_image"))),
            Some(LayerInfo {
                x86_64: Some(String::from(
                    "arn:aws:lambda:_REGION_:226609089145:layer:bun-1_0_0-x64:1",
                )),
                arm64: None,
            }),
        );
        assert_eq!(
            test_runtime.get_layer_name("us-east-1"),
            Some(vec![String::from(
                "arn:aws:lambda:us-east-1:226609089145:layer:bun-1_0_0-x64:1"
            )])
        );
    }

    #[test]
    fn test_layer_name_arm64() {
        let test_runtime = Runtime::new(
            String::from("nodejs20"),
            String::from("nodejs20.x"),
            String::from("index.handler"),
            String::from("nodejs20"),
            String::from("arm64"),
            128,
            Some(Image::new(String::from("test_image"))),
            Some(LayerInfo {
                x86_64: None,
                arm64: Some(String::from(
                    "arn:aws:lambda:_REGION_:226609089145:layer:bun-1_0_0-arm64:1",
                )),
            }),
        );
        assert_eq!(
            test_runtime.get_layer_name("us-east-1"),
            Some(vec![String::from(
                "arn:aws:lambda:us-east-1:226609089145:layer:bun-1_0_0-arm64:1"
            )])
        );
    }

    #[test]
    fn test_layer_name_mismatch() {
        let test_runtime = Runtime::new(
            String::from("nodejs20"),
            String::from("nodejs20.x"),
            String::from("index.handler"),
            String::from("nodejs20"),
            String::from("x86_64"),
            128,
            Some(Image::new(String::from("test_image"))),
            Some(LayerInfo {
                x86_64: None,
                arm64: Some(String::from(
                    "arn:aws:lambda:_REGION_:226609089145:layer:bun-1_0_0-arm64:1",
                )),
            }),
        );
        assert_eq!(test_runtime.get_layer_name("us-east-1"), None);
    }
}
