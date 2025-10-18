// swift-tools-version: 6.1

import PackageDescription

let package = Package(
    name: "MaxdayLambda",
    platforms: [.macOS(.v15)],
    products: [
        .executable(name: "MaxdayLambda", targets: ["MaxdayLambda"]),
    ],
    dependencies: [
        .package(url: "https://github.com/swift-server/swift-aws-lambda-runtime.git", from: "2.0.0-beta.3"),
    ],
    targets: [
        .executableTarget(name: "MaxdayLambda", dependencies: [
            .product(name: "AWSLambdaRuntime", package: "swift-aws-lambda-runtime"),
        ]),
    ]
)

