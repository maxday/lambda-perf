cargo lambda build --release --arm64 --output-format zip

mv target/lambda/function-trigger-deployer-rs/bootstrap.zip target/lambda/function-trigger-deployer-rs/bootstrap-function-trigger-deployer-rs.zip
# add maniest.json to the zip file
zip -j target/lambda/function-trigger-deployer-rs/bootstrap-function-trigger-deployer-rs.zip function-trigger-deployer-rs/manifest.json

mv target/lambda/function-image-deployer-rs/bootstrap.zip target/lambda/function-image-deployer-rs/bootstrap-function-image-deployer-rs.zip
