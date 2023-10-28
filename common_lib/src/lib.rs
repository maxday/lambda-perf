use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Runtime {
    pub display_name: String,
    pub runtime: String,
    pub handler: String,
    pub path: String,
    pub architecture: String,
    pub memory_size: u32,
    pub image: Image,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Image {
    pub base_image: String,
}
