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
        let manifest =
            std::fs::read_to_string(&self.file_name).expect("Could not read manifest.json");
        let manifest: Manifest =
            serde_json::from_str(&manifest).expect("Could not parse manifest.json");
        manifest
    }
}

#[cfg(test)]
mod tests {

    use crate::manifest;

    #[test]
    fn test_read_manifest() {
        let manifest = manifest::ManifestManager::new("manifest.test.json");
        let manifest = manifest.read_manifest();
        assert_eq!(manifest.memory_sizes.len(), 2);
        assert_eq!(manifest.runtimes.len(), 2);

        assert_eq!(manifest.runtimes[0].display_name, "nodejs18.x");
        assert_eq!(manifest.runtimes[0].runtime, "nodejs18.x");
        assert_eq!(manifest.runtimes[0].handler, "index.handler");
        assert_eq!(manifest.runtimes[0].path, "nodejs18x");
        assert_eq!(manifest.runtimes[0].architectures.len(), 2);
        assert_eq!(manifest.runtimes[0].architectures[0], "x86_64");
        assert_eq!(manifest.runtimes[0].architectures[1], "arm64");
        assert_eq!(
            manifest.runtimes[0].image.base_image,
            "public.ecr.aws/lambda/nodejs:18"
        );

        assert_eq!(manifest.runtimes[1].display_name, "python3.7");
        assert_eq!(manifest.runtimes[1].runtime, "python3.7");
        assert_eq!(manifest.runtimes[1].handler, "index.handler");
        assert_eq!(manifest.runtimes[1].path, "python37");
        assert_eq!(manifest.runtimes[1].architectures.len(), 1);
        assert_eq!(manifest.runtimes[1].architectures[0], "x86_64");
        assert_eq!(
            manifest.runtimes[1].image.base_image,
            "public.ecr.aws/lambda/python:3.7"
        );
    }
}
