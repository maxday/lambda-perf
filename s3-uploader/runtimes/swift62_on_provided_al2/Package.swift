// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "MaxdayLambda",
    platforms: [.macOS(.v15)],
    products: [
        .executable(name: "MaxdayLambda", targets: ["MaxdayLambda"]),
    ],
    dependencies: [
        .package(url: "https://github.com/awslabs/swift-aws-lambda-runtime", from: "2.3.0"),
    ],
    targets: [
        .executableTarget(name: "MaxdayLambda", dependencies: [
            .product(name: "AWSLambdaRuntime", package: "swift-aws-lambda-runtime"),
        ]),
    ]
)

