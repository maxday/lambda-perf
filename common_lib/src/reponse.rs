use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Response {
    status_code: u32,
}

impl Response {
    pub fn success() -> Self {
        Response { status_code: 200 }
    }
}
