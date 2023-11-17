use common_lib::{Image, LayerInfo, Runtime};
use serde::Deserialize;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct InputManifest {
    pub memory_sizes: Vec<i32>,
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
    pub layer: Option<LayerInfo>,
    #[serde(default)]
    pub is_snapstart: bool,
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
                    let zip_runtime = Runtime {
                        display_name: runtime.display_name.to_string(),
                        runtime: runtime.runtime.to_string(),
                        handler: runtime.handler.to_string(),
                        path: runtime.path.to_string(),
                        architecture: architecture.to_string(),
                        memory_size: *memory_size,
                        image: None,
                        layer: runtime.layer.clone(),
                        is_snapstart: runtime.is_snapstart,
                    };
                    runtimes.push(zip_runtime);
                    if runtime.image.is_some() {
                        let image_runtime = Runtime {
                            display_name: runtime.display_name.to_string(),
                            runtime: runtime.runtime.to_string(),
                            handler: runtime.handler.to_string(),
                            path: runtime.path.to_string(),
                            architecture: architecture.to_string(),
                            memory_size: *memory_size,
                            image: runtime.image.clone(),
                            layer: None,
                            is_snapstart: false,
                        };
                        runtimes.push(image_runtime);
                    }
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

        assert_eq!(manifest.runtimes.len(), 10);

        assert_eq!(manifest.runtimes[0].display_name, "nodejs18.x");
        assert_eq!(manifest.runtimes[0].runtime, "nodejs18.x");
        assert_eq!(manifest.runtimes[0].handler, "index.handler");
        assert_eq!(manifest.runtimes[0].path, "nodejs18x");
        assert_eq!(manifest.runtimes[0].architecture, "x86_64");
        assert_eq!(manifest.runtimes[0].memory_size, 128);
        assert!(manifest.runtimes[0].image.is_none());

        assert_eq!(manifest.runtimes[1].display_name, "nodejs18.x");
        assert_eq!(manifest.runtimes[1].runtime, "nodejs18.x");
        assert_eq!(manifest.runtimes[1].handler, "index.handler");
        assert_eq!(manifest.runtimes[1].path, "nodejs18x");
        assert_eq!(manifest.runtimes[1].architecture, "x86_64");
        assert_eq!(manifest.runtimes[1].memory_size, 128);
        let image = manifest.runtimes[1].image.as_ref().unwrap();
        assert_eq!(image.base_image, "public.ecr.aws/lambda/nodejs:18");

        assert_eq!(manifest.runtimes[2].display_name, "nodejs18.x");
        assert_eq!(manifest.runtimes[2].runtime, "nodejs18.x");
        assert_eq!(manifest.runtimes[2].handler, "index.handler");
        assert_eq!(manifest.runtimes[2].path, "nodejs18x");
        assert_eq!(manifest.runtimes[2].architecture, "arm64");
        assert_eq!(manifest.runtimes[2].memory_size, 128);
        assert!(manifest.runtimes[2].image.is_none());

        assert_eq!(manifest.runtimes[3].display_name, "nodejs18.x");
        assert_eq!(manifest.runtimes[3].runtime, "nodejs18.x");
        assert_eq!(manifest.runtimes[3].handler, "index.handler");
        assert_eq!(manifest.runtimes[3].path, "nodejs18x");
        assert_eq!(manifest.runtimes[3].architecture, "arm64");
        assert_eq!(manifest.runtimes[3].memory_size, 128);
        let image = manifest.runtimes[3].image.as_ref().unwrap();
        assert_eq!(image.base_image, "public.ecr.aws/lambda/nodejs:18");

        assert_eq!(manifest.runtimes[4].display_name, "python3.7");
        assert_eq!(manifest.runtimes[4].runtime, "python3.7");
        assert_eq!(manifest.runtimes[4].handler, "index.handler");
        assert_eq!(manifest.runtimes[4].path, "python37");
        assert_eq!(manifest.runtimes[4].architecture, "x86_64");
        assert_eq!(manifest.runtimes[4].memory_size, 128);
        assert!(manifest.runtimes[4].image.is_none());

        assert_eq!(manifest.runtimes[5].display_name, "nodejs18.x");
        assert_eq!(manifest.runtimes[5].runtime, "nodejs18.x");
        assert_eq!(manifest.runtimes[5].handler, "index.handler");
        assert_eq!(manifest.runtimes[5].path, "nodejs18x");
        assert_eq!(manifest.runtimes[5].architecture, "x86_64");
        assert_eq!(manifest.runtimes[5].memory_size, 256);
        assert!(manifest.runtimes[5].image.is_none());

        assert_eq!(manifest.runtimes[6].display_name, "nodejs18.x");
        assert_eq!(manifest.runtimes[6].runtime, "nodejs18.x");
        assert_eq!(manifest.runtimes[6].handler, "index.handler");
        assert_eq!(manifest.runtimes[6].path, "nodejs18x");
        assert_eq!(manifest.runtimes[6].architecture, "x86_64");
        assert_eq!(manifest.runtimes[6].memory_size, 256);
        let image = manifest.runtimes[6].image.as_ref().unwrap();
        assert_eq!(image.base_image, "public.ecr.aws/lambda/nodejs:18");

        assert_eq!(manifest.runtimes[7].display_name, "nodejs18.x");
        assert_eq!(manifest.runtimes[7].runtime, "nodejs18.x");
        assert_eq!(manifest.runtimes[7].handler, "index.handler");
        assert_eq!(manifest.runtimes[7].path, "nodejs18x");
        assert_eq!(manifest.runtimes[7].architecture, "arm64");
        assert_eq!(manifest.runtimes[7].memory_size, 256);
        assert!(manifest.runtimes[7].image.is_none());

        assert_eq!(manifest.runtimes[8].display_name, "nodejs18.x");
        assert_eq!(manifest.runtimes[8].runtime, "nodejs18.x");
        assert_eq!(manifest.runtimes[8].handler, "index.handler");
        assert_eq!(manifest.runtimes[8].path, "nodejs18x");
        assert_eq!(manifest.runtimes[8].architecture, "arm64");
        assert_eq!(manifest.runtimes[8].memory_size, 256);
        let image = manifest.runtimes[8].image.as_ref().unwrap();
        assert_eq!(image.base_image, "public.ecr.aws/lambda/nodejs:18");

        assert_eq!(manifest.runtimes[9].display_name, "python3.7");
        assert_eq!(manifest.runtimes[9].runtime, "python3.7");
        assert_eq!(manifest.runtimes[9].handler, "index.handler");
        assert_eq!(manifest.runtimes[9].path, "python37");
        assert_eq!(manifest.runtimes[9].architecture, "x86_64");
        assert_eq!(manifest.runtimes[9].memory_size, 256);
        assert!(manifest.runtimes[9].image.is_none());
    }

    #[test]
    fn test_read_manifest_layer() {
        let manifest = manifest::ManifestManager::new("manifest.test.layer.json");
        let manifest = manifest.read_manifest();

        assert_eq!(manifest.runtimes.len(), 1);

        assert_eq!(manifest.runtimes[0].display_name, "bun layer(prov.al2)");
        assert_eq!(manifest.runtimes[0].runtime, "provided.al2");
        assert_eq!(manifest.runtimes[0].handler, "index.hello");
        assert_eq!(manifest.runtimes[0].path, "bun_layer");
        assert_eq!(manifest.runtimes[0].architecture, "x86_64");
        assert_eq!(manifest.runtimes[0].memory_size, 128);
        assert!(manifest.runtimes[0].image.is_none());

        let layer = manifest.runtimes[0].layer.as_ref().unwrap();
        assert_eq!(
            layer.x86_64,
            Some("arn:aws:lambda:_REGION_:226609089145:layer:bun-1_0_0-x64:1".to_string())
        )
    }

    #[test]
    fn test_read_manifest_snapstart() {
        let manifest = manifest::ManifestManager::new("manifest.test.snapstart.json");
        let manifest = manifest.read_manifest();

        assert_eq!(manifest.runtimes.len(), 1);

        assert_eq!(manifest.runtimes[0].display_name, "java11 snapstart");
        assert_eq!(manifest.runtimes[0].runtime, "java11");
        assert_eq!(
            manifest.runtimes[0].handler,
            "io.github.maxday.Handler::handleRequest"
        );
        assert_eq!(manifest.runtimes[0].path, "java_11");
        assert_eq!(manifest.runtimes[0].architecture, "x86_64");
        assert_eq!(manifest.runtimes[0].memory_size, 128);
        assert!(manifest.runtimes[0].image.is_none());
        assert!(manifest.runtimes[0].is_snapstart);
    }
}
