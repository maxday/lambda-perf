use rand::Rng;
use std::future::Future;
use std::time::Duration;

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
    {
        let mut count = 0;
        loop {
            println!("attempt: {}", count);
            let result = f().await;

            if result.is_ok() {
                break result;
            } else {
                if count > self.max_attempts {
                    break result;
                }
                count += 1;
                // get a random value between delay_min and delay_max
                let delay = rand::thread_rng().gen_range(self.delay_min..self.delay_max);
                // print the random value
                println!("delay: {:?}", delay);
                tokio::time::sleep(delay).await;
            }
        }
    }
}
