use crate::manifest::Manifest;
use chrono::prelude::{DateTime, Utc};
use std::{collections::HashMap, time::SystemTime};

#[derive(Debug)]
pub struct ReportLog {
    pub path: String,
    pub package_type: String,
    pub memory_size: String,
    pub architecture: String,
    pub display_name: String,
}

#[derive(Debug)]
pub struct ReportLogData {
    pub request_id: String,
    pub duration: String,
    pub billed_duration: String,
    pub billed_restore_duration: String,
    pub memory_size: String,
    pub max_memory_used: String,
    pub init_duration: String,
    pub insert_date: String,
}

impl ReportLog {
    pub fn new(log_group: &str, manifest: &Manifest) -> Self {
        let from_lambda = log_group.replace("/aws/lambda/", "");
        let function_name = from_lambda.replace("lambda-perf-", "");
        let tokens = function_name.split('-').collect::<Vec<&str>>();
        if tokens.len() != 4 {
            panic!("Could not parse function name");
        }
        let path = tokens[0];
        let package_type = tokens[1];
        let memory_size = tokens[2];
        let architecture = tokens[3];
        let result = manifest
            .runtimes
            .iter()
            .find(|runtime| runtime.path() == path);
        match result {
            Some(found_runtime) => ReportLog {
                path: path.to_string(),
                package_type: package_type.to_string(),
                memory_size: memory_size.to_string(),
                architecture: architecture.to_string(),
                display_name: found_runtime.display_name().to_string(),
            },
            None => {
                panic!("Could not find the display name in the manisfest file");
            }
        }
    }
}

impl ReportLogData {
    pub fn new(report_log: &str) -> Self {
        let regex = regex::Regex::new(
            r"REPORT RequestId: (?P<request_id>.*)\tDuration: (?P<duration>.*) ms\tBilled Duration: (?P<billed_duration>.*) ms\tMemory Size: (?P<memory_size>.*) MB\tMax Memory Used: (?P<max_memory_used>.*) MB(\tRestore Duration: (?P<restore_duration>.*) ms\tBilled Restore Duration: (?P<billed_restore_duration>.*) ms)?(\tInit Duration: (?P<init_duration>.*) ms)?\t",
        ).expect("could not find the regexp");

        let caps = regex
            .captures(report_log)
            .expect("could not match the regexp");
        let dict: HashMap<&str, &str> = regex
            .capture_names()
            .flatten()
            .filter_map(|n| Some((n, caps.name(n)?.as_str())))
            .collect();

        let insert_date = ReportLogData::iso8601(&SystemTime::now());

        ReportLogData {
            request_id: dict
                .get("request_id")
                .expect("could not find the request_id")
                .to_string(),
            duration: dict
                .get("duration")
                .expect("could not find the duration")
                .to_string(),
            billed_duration: dict
                .get("billed_duration")
                .expect("could not find the billed_duration")
                .to_string(),
            memory_size: dict
                .get("memory_size")
                .expect("could not find the memory_size")
                .to_string(),
            max_memory_used: dict
                .get("max_memory_used")
                .expect("could not find the max_memory_used")
                .to_string(),
            init_duration: ReportLogData::init_duration(&dict),
            billed_restore_duration: ReportLogData::billed_restore_duration(&dict),
            insert_date: insert_date.to_string(),
        }
    }
    fn iso8601(system_time: &std::time::SystemTime) -> String {
        let dt: DateTime<Utc> = (*system_time).into();
        format!("{}", dt.format("%+"))
    }
    fn init_duration(dict: &HashMap<&str, &str>) -> String {
        match dict.get("init_duration") {
            Some(init_duration) => init_duration.to_string(),
            None => dict
                .get("restore_duration")
                .expect("could not find initDuration/restoreDuration")
                .to_string(),
        }
    }
    fn billed_restore_duration(dict: &HashMap<&str, &str>) -> String {
        match dict.get("billed_restore_duration") {
            Some(billed_restore_duration) => billed_restore_duration.to_string(),
            None => String::from("0"),
        }
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    use crate::manifest::ManifestManager;

    #[test]
    fn test_report_log_new() {
        let manifest = ManifestManager::new("manifest.test.json");
        let manifest = manifest.read_manifest();
        let log_group = "/aws/lambda/lambda-perf-nodejs18x-zip-128-arm64";
        let report_log = ReportLog::new(log_group, &manifest);
        assert_eq!(report_log.path, "nodejs18x");
        assert_eq!(report_log.package_type, "zip");
        assert_eq!(report_log.memory_size, "128");
        assert_eq!(report_log.architecture, "arm64");
        assert_eq!(report_log.display_name, "nodejs18.x");
    }

    #[test]
    fn test_report_log_details_new() {
        let report_log = "REPORT RequestId: 32f5cbf1-dd22-422a-a566-8965da5a3465	Duration: 8.40 ms	Billed Duration: 9 ms	Memory Size: 128 MB	Max Memory Used: 66 MB	Init Duration: 170.13 ms	";
        let report_log_details = ReportLogData::new(report_log);
        assert_eq!(
            report_log_details.request_id,
            "32f5cbf1-dd22-422a-a566-8965da5a3465"
        );
        assert_eq!(report_log_details.duration, "8.40");
        assert_eq!(report_log_details.billed_duration, "9");
        assert_eq!(report_log_details.memory_size, "128");
        assert_eq!(report_log_details.max_memory_used, "66");
        assert_eq!(report_log_details.init_duration, "170.13");
    }

    #[test]
    fn test_report_log_details_new_snapstart() {
        let report_log = "REPORT RequestId: 1d4e1c44-b211-4a4c-972b-39c8da774f2e	Duration: 36.97 ms	Billed Duration: 173 ms	Memory Size: 128 MB	Max Memory Used: 68 MB	Restore Duration: 511.56 ms	Billed Restore Duration: 136 ms	";
        let report_log_details = ReportLogData::new(report_log);
        assert_eq!(
            report_log_details.request_id,
            "1d4e1c44-b211-4a4c-972b-39c8da774f2e"
        );
        assert_eq!(report_log_details.duration, "36.97");
        assert_eq!(report_log_details.billed_duration, "173");
        assert_eq!(report_log_details.memory_size, "128");
        assert_eq!(report_log_details.max_memory_used, "68");
        assert_eq!(report_log_details.init_duration, "511.56");
        assert_eq!(report_log_details.billed_restore_duration, "136");
    }
}
