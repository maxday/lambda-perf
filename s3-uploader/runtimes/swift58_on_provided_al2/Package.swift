// swift-tools-version: 5.8
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "MaxdayLambda",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(name: "MaxdayLambda", targets: ["MaxdayLambda"]),
    ],
    dependencies: [
        .package(url: "https://github.com/swift-server/swift-aws-lambda-runtime.git", from: "1.0.0-alpha"),
    ],
    targets: [
        .executableTarget(name: "MaxdayLambda", dependencies: [
            .product(name: "AWSLambdaRuntime", package: "swift-aws-lambda-runtime"),
        ]),
    ]
)

