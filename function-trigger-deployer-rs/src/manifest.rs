use common_lib::{Image, Runtime};
use serde::Deserialize;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct InputManifest {
    pub memory_sizes: Vec<u32>,
    pub runtimes: Vec<InputRuntime>,
}

pub struct Manifest {
    pub runtimes: Vec<Runtime>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct InputRuntime {
    pub display_name: String,
    pub runtime: String,
    pub handler: String,
    pub path: String,
    pub architectures: Vec<String>,
    pub image: Option<Image>,
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
        let manifest: InputManifest =
            serde_json::from_str(&manifest).expect("Could not parse manifest.json");
        let mut runtimes = Vec::<Runtime>::new();
        for memory_size in manifest.memory_sizes.iter() {
            for runtime in manifest.runtimes.iter() {
                for architecture in runtime.architectures.iter() {
                    let runtime = Runtime {
                        display_name: runtime.display_name.to_string(),
                        runtime: runtime.runtime.to_string(),
                        handler: runtime.handler.to_string(),
                        path: runtime.path.to_string(),
                        architecture: architecture.to_string(),
                        memory_size: *memory_size,
                        image: runtime.image.clone(),
                    };
                    runtimes.push(runtime);
                }
            }
        }
        Manifest { runtimes }
    }
}

#[cfg(test)]
mod tests {

    use crate::manifest;

    #[test]
    fn test_read_manifest() {
        let manifest = manifest::ManifestManager::new("manifest.test.json");
        let manifest = manifest.read_manifest();

        assert_eq!(manifest.runtimes.len(), 6);

        assert_eq!(manifest.runtimes[0].display_name, "nodejs18.x");
        assert_eq!(manifest.runtimes[0].runtime, "nodejs18.x");
        assert_eq!(manifest.runtimes[0].handler, "index.handler");
        assert_eq!(manifest.runtimes[0].path, "nodejs18x");
        assert_eq!(manifest.runtimes[0].architecture, "x86_64");
        assert_eq!(manifest.runtimes[0].memory_size, 128);
        let image = manifest.runtimes[0].image.as_ref().unwrap();
        assert_eq!(image.base_image, "public.ecr.aws/lambda/nodejs:18");

        assert_eq!(manifest.runtimes[1].display_name, "nodejs18.x");
        assert_eq!(manifest.runtimes[1].runtime, "nodejs18.x");
        assert_eq!(manifest.runtimes[1].handler, "index.handler");
        assert_eq!(manifest.runtimes[1].path, "nodejs18x");
        assert_eq!(manifest.runtimes[1].architecture, "arm64");
        assert_eq!(manifest.runtimes[1].memory_size, 128);
        let image = manifest.runtimes[1].image.as_ref().unwrap();
        assert_eq!(image.base_image, "public.ecr.aws/lambda/nodejs:18");

        assert_eq!(manifest.runtimes[2].display_name, "python3.7");
        assert_eq!(manifest.runtimes[2].runtime, "python3.7");
        assert_eq!(manifest.runtimes[2].handler, "index.handler");
        assert_eq!(manifest.runtimes[2].path, "python37");
        assert_eq!(manifest.runtimes[2].architecture, "x86_64");
        assert_eq!(manifest.runtimes[2].memory_size, 128);
        let image = manifest.runtimes[2].image.as_ref().unwrap();
        assert_eq!(image.base_image, "public.ecr.aws/lambda/python:3.7");

        assert_eq!(manifest.runtimes[3].display_name, "nodejs18.x");
        assert_eq!(manifest.runtimes[3].runtime, "nodejs18.x");
        assert_eq!(manifest.runtimes[3].handler, "index.handler");
        assert_eq!(manifest.runtimes[3].path, "nodejs18x");
        assert_eq!(manifest.runtimes[3].architecture, "x86_64");
        assert_eq!(manifest.runtimes[3].memory_size, 256);
        let image = manifest.runtimes[3].image.as_ref().unwrap();
        assert_eq!(image.base_image, "public.ecr.aws/lambda/nodejs:18");

        assert_eq!(manifest.runtimes[4].display_name, "nodejs18.x");
        assert_eq!(manifest.runtimes[4].runtime, "nodejs18.x");
        assert_eq!(manifest.runtimes[4].handler, "index.handler");
        assert_eq!(manifest.runtimes[4].path, "nodejs18x");
        assert_eq!(manifest.runtimes[4].architecture, "arm64");
        assert_eq!(manifest.runtimes[4].memory_size, 256);
        let image = manifest.runtimes[4].image.as_ref().unwrap();
        assert_eq!(image.base_image, "public.ecr.aws/lambda/nodejs:18");

        assert_eq!(manifest.runtimes[5].display_name, "python3.7");
        assert_eq!(manifest.runtimes[5].runtime, "python3.7");
        assert_eq!(manifest.runtimes[5].handler, "index.handler");
        assert_eq!(manifest.runtimes[5].path, "python37");
        assert_eq!(manifest.runtimes[5].architecture, "x86_64");
        assert_eq!(manifest.runtimes[5].memory_size, 256);
        let image = manifest.runtimes[5].image.as_ref().unwrap();
        assert_eq!(image.base_image, "public.ecr.aws/lambda/python:3.7");
    }
}
