cargo lambda build --release --arm64 --output-format zip

mv target/lambda/function-trigger-deployer-rs/bootstrap.zip target/lambda/function-trigger-deployer-rs/bootstrap-function-trigger-deployer-rs.zip
# add maniest.json to the zip file
zip -j target/lambda/function-trigger-deployer-rs/bootstrap-function-trigger-deployer-rs.zip manifest.json
mv target/lambda/function-deployer-rs/bootstrap.zip target/lambda/function-deployer-rs/bootstrap-function-deployer-rs.zip
mv target/lambda/function-invoker-rs/bootstrap.zip target/lambda/function-invoker-rs/bootstrap-function-invoker-rs.zip
mv target/lambda/function-report-log-processor-rs/bootstrap.zip target/lambda/function-report-log-processor-rs/bootstrap-function-report-log-processor-rs.zip
# add maniest.json to the zip file
zip -j target/lambda/function-report-log-processor-rs/bootstrap-function-report-log-processor-rs.zip manifest.json