cargo lambda build --release --arm64 --output-format zip

mv target/lambda/function-trigger-deployer-rs/bootstrap.zip target/lambda/function-trigger-deployer-rs/bootstrap-function-trigger-deployer-rs.zip
# add maniest.json to the zip file
zip -j target/lambda/function-trigger-deployer-rs/bootstrap-function-trigger-deployer-rs.zip function-trigger-deployer-rs/manifest.json

mv target/lambda/function-deployer-rs/bootstrap.zip target/lambda/function-deployer-rs/bootstrap-function-deployer-rs.zip
mv target/lambda/function-snapstart-deployer-rs/bootstrap.zip target/lambda/function-deployer-rs/bootstrap-function-snapstart-deployer-rs.zip
