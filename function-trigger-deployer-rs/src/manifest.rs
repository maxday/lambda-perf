use serde::Deserialize;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Manifest {
    pub memory_sizes: Vec<u32>,
    pub runtimes: Vec<Runtime>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Runtime {
    pub display_name: String,
    pub runtime: String,
    pub handler: String,
    pub path: String,
    pub architectures: Vec<String>,
    pub image: Image,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Image {
    pub base_image: String,
}

pub struct ManifestManager {
    file_name: String,
}

impl ManifestManager {
    pub fn new(file_name: &str) -> Self {
        ManifestManager {
            file_name: file_name.to_string(),
        }
    }

    pub fn read_manifest(&self) -> Manifest {
        let manifest = std::fs::read_to_string(&self.file_name).expect("Could not read manifest.json");
        let manifest: Manifest =
            serde_json::from_str(&manifest).expect("Could not parse manifest.json");
        manifest
    }
}
