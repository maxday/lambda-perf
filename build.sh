cargo lambda build --release --arm64 --output-format zip

mv target/lambda/function-trigger-deployer-rs/bootstrap.zip target/lambda/function-trigger-deployer-rs/bootstrap-function-trigger-deployer-rs.zip
mv target/lambda/function-deployer-image-rs/bootstrap.zip target/lambda/function-deployer-image-rs/bootstrap-function-deployer-image-rs.zip