use rand::Rng;
use std::future::Future;
use std::time::Duration;
use tracing::info;

pub struct RetryManager {
    max_attempts: u32,
    delay_min: Duration,
    delay_max: Duration,
}

impl RetryManager {
    pub fn new(max_attempts: u32, delay_min: Duration, delay_max: Duration) -> Self {
        RetryManager {
            max_attempts,
            delay_min,
            delay_max,
        }
    }

    pub async fn retry_async<T, E, Fut, F: FnMut() -> Fut>(&self, mut f: F) -> Result<T, E>
    where
        Fut: Future<Output = Result<T, E>>,
        E: std::fmt::Debug,
        T: std::fmt::Debug,
    {
        let mut nb_attempt = 0;
        loop {
            let result = f().await;

            if result.is_ok() {
                break result;
            } else {
                info!("attempt #{}, error: {:?}", (nb_attempt + 1), result);
                if nb_attempt > self.max_attempts {
                    break result;
                }
                nb_attempt += 1;
                let delay = rand::rng().random_range(self.delay_min..self.delay_max);
                info!("delay: {:?}", delay);
                tokio::time::sleep(delay).await;
            }
        }
    }
}
