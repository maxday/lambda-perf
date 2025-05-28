use serde::Deserialize;

use crate::runtime::{Image, LayerInfo, Runtime};

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
            std::fs::read_to_string(&self.file_name).expect("Could not read the manifest file");
        let manifest: InputManifest =
            serde_json::from_str(&manifest).expect("Could not parse the manifest file");
        let mut runtimes = Vec::<Runtime>::new();
        for memory_size in manifest.memory_sizes.iter() {
            for runtime in manifest.runtimes.iter() {
                for architecture in runtime.architectures.iter() {
                    let zip_runtime = Runtime::new(
                        runtime.display_name.to_string(),
                        runtime.runtime.to_string(),
                        runtime.handler.to_string(),
                        runtime.path.to_string(),
                        architecture.to_string(),
                        *memory_size,
                        None,
                        runtime.layer.clone(),
                    );
                    runtimes.push(zip_runtime);
                    if runtime.image.is_some() {
                        let image_runtime = Runtime::new(
                            runtime.display_name.to_string(),
                            runtime.runtime.to_string(),
                            runtime.handler.to_string(),
                            runtime.path.to_string(),
                            architecture.to_string(),
                            *memory_size,
                            runtime.image.clone(),
                            None,
                        );
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
    use aws_sdk_lambda::types::Runtime as LambdaRuntime;

    #[test]
    fn test_read_manifest() {
        let manifest = manifest::ManifestManager::new("manifest.test.json");
        let manifest = manifest.read_manifest();

        assert_eq!(manifest.runtimes.len(), 10);

        assert_eq!(manifest.runtimes[0].display_name(), "nodejs18.x");
        assert_eq!(manifest.runtimes[0].runtime(), LambdaRuntime::Nodejs18x);
        assert_eq!(manifest.runtimes[0].handler(), "index.handler");
        assert_eq!(manifest.runtimes[0].path(), "nodejs18x");
        assert_eq!(manifest.runtimes[0].architecture(), "x86_64");
        assert_eq!(manifest.runtimes[0].memory_size(), 128);
        assert!(!manifest.runtimes[0].has_image());

        assert_eq!(manifest.runtimes[1].display_name(), "nodejs18.x");
        assert_eq!(manifest.runtimes[1].runtime(), LambdaRuntime::Nodejs18x);
        assert_eq!(manifest.runtimes[1].handler(), "index.handler");
        assert_eq!(manifest.runtimes[1].path(), "nodejs18x");
        assert_eq!(manifest.runtimes[1].architecture(), "x86_64");
        assert_eq!(manifest.runtimes[1].memory_size(), 128);
        let image = manifest.runtimes[1].image_name("0123456789", "us-east-1");
        assert_eq!(
            image,
            String::from("0123456789.dkr.ecr.us-east-1.amazonaws.com/lambda-perf:nodejs18x-x86_64")
        );

        assert_eq!(manifest.runtimes[2].display_name(), "nodejs18.x");
        assert_eq!(manifest.runtimes[2].runtime(), LambdaRuntime::Nodejs18x);
        assert_eq!(manifest.runtimes[2].handler(), "index.handler");
        assert_eq!(manifest.runtimes[2].path(), "nodejs18x");
        assert_eq!(manifest.runtimes[2].architecture(), "arm64");
        assert_eq!(manifest.runtimes[2].memory_size(), 128);
        assert!(!manifest.runtimes[2].has_image());

        assert_eq!(manifest.runtimes[3].display_name(), "nodejs18.x");
        assert_eq!(manifest.runtimes[3].runtime(), LambdaRuntime::Nodejs18x);
        assert_eq!(manifest.runtimes[3].handler(), "index.handler");
        assert_eq!(manifest.runtimes[3].path(), "nodejs18x");
        assert_eq!(manifest.runtimes[3].architecture(), "arm64");
        assert_eq!(manifest.runtimes[3].memory_size(), 128);
        let image = manifest.runtimes[3].image_name("0123456789", "us-east-1");
        assert_eq!(
            image,
            String::from("0123456789.dkr.ecr.us-east-1.amazonaws.com/lambda-perf:nodejs18x-arm64")
        );

        assert_eq!(manifest.runtimes[4].display_name(), "python3.7");
        assert_eq!(manifest.runtimes[4].runtime(), LambdaRuntime::Python37);
        assert_eq!(manifest.runtimes[4].handler(), "index.handler");
        assert_eq!(manifest.runtimes[4].path(), "python37");
        assert_eq!(manifest.runtimes[4].architecture(), "x86_64");
        assert_eq!(manifest.runtimes[4].memory_size(), 128);
        assert!(!manifest.runtimes[4].has_image());

        assert_eq!(manifest.runtimes[5].display_name(), "nodejs18.x");
        assert_eq!(manifest.runtimes[5].runtime(), LambdaRuntime::Nodejs18x);
        assert_eq!(manifest.runtimes[5].handler(), "index.handler");
        assert_eq!(manifest.runtimes[5].path(), "nodejs18x");
        assert_eq!(manifest.runtimes[5].architecture(), "x86_64");
        assert_eq!(manifest.runtimes[5].memory_size(), 256);
        assert!(!manifest.runtimes[5].has_image());

        assert_eq!(manifest.runtimes[6].display_name(), "nodejs18.x");
        assert_eq!(manifest.runtimes[6].runtime(), LambdaRuntime::Nodejs18x);
        assert_eq!(manifest.runtimes[6].handler(), "index.handler");
        assert_eq!(manifest.runtimes[6].path(), "nodejs18x");
        assert_eq!(manifest.runtimes[6].architecture(), "x86_64");
        assert_eq!(manifest.runtimes[6].memory_size(), 256);
        let image = manifest.runtimes[6].image_name("0123456789", "us-east-1");
        assert_eq!(
            image,
            String::from("0123456789.dkr.ecr.us-east-1.amazonaws.com/lambda-perf:nodejs18x-x86_64")
        );

        assert_eq!(manifest.runtimes[7].display_name(), "nodejs18.x");
        assert_eq!(manifest.runtimes[7].runtime(), LambdaRuntime::Nodejs18x);
        assert_eq!(manifest.runtimes[7].handler(), "index.handler");
        assert_eq!(manifest.runtimes[7].path(), "nodejs18x");
        assert_eq!(manifest.runtimes[7].architecture(), "arm64");
        assert_eq!(manifest.runtimes[7].memory_size(), 256);
        assert!(!manifest.runtimes[7].has_image());

        assert_eq!(manifest.runtimes[8].display_name(), "nodejs18.x");
        assert_eq!(manifest.runtimes[8].runtime(), LambdaRuntime::Nodejs18x);
        assert_eq!(manifest.runtimes[8].handler(), "index.handler");
        assert_eq!(manifest.runtimes[8].path(), "nodejs18x");
        assert_eq!(manifest.runtimes[8].architecture(), "arm64");
        assert_eq!(manifest.runtimes[8].memory_size(), 256);
        let image = manifest.runtimes[8].image_name("0123456789", "us-east-1");
        assert_eq!(
            image,
            String::from("0123456789.dkr.ecr.us-east-1.amazonaws.com/lambda-perf:nodejs18x-arm64")
        );

        assert_eq!(manifest.runtimes[9].display_name(), "python3.7");
        assert_eq!(manifest.runtimes[9].runtime(), LambdaRuntime::Python37);
        assert_eq!(manifest.runtimes[9].handler(), "index.handler");
        assert_eq!(manifest.runtimes[9].path(), "python37");
        assert_eq!(manifest.runtimes[9].architecture(), "x86_64");
        assert_eq!(manifest.runtimes[9].memory_size(), 256);
        assert!(!manifest.runtimes[9].has_image());
    }

    #[test]
    fn test_read_manifest_layer() {
        let manifest = manifest::ManifestManager::new("manifest.test.layer.json");
        let manifest = manifest.read_manifest();

        assert_eq!(manifest.runtimes.len(), 1);

        assert_eq!(manifest.runtimes[0].display_name(), "bun layer(prov.al2)");
        assert_eq!(manifest.runtimes[0].runtime(), LambdaRuntime::Providedal2);
        assert_eq!(manifest.runtimes[0].handler(), "index.hello");
        assert_eq!(manifest.runtimes[0].path(), "bun_layer");
        assert_eq!(manifest.runtimes[0].architecture(), "x86_64");
        assert_eq!(manifest.runtimes[0].memory_size(), 128);
        assert!(!manifest.runtimes[0].has_image());

        let layer = manifest.runtimes[0].get_layer_name("us-east-1");
        assert_eq!(
            layer,
            Some(vec![String::from(
                "arn:aws:lambda:us-east-1:226609089145:layer:bun-1_0_0-x64:1"
            )])
        )
    }

}
