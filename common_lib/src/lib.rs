use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Runtime {
    pub display_name: String,
    pub runtime: String,
    pub handler: String,
    pub path: String,
    pub architecture: String,
    pub memory_size: i32,
    pub image: Option<Image>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Image {
    pub base_image: String,
}

impl Runtime {
    fn package_type(&self) -> String {
        match self.image {
            Some(_) => "image".to_string(),
            None => "zip".to_string(),
        }
    }
    pub fn function_name(&self) -> String {
        format!(
            "lambda-perf-{}-{}-{}-{}",
            self.path,
            self.package_type(),
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
}
