import AWSLambdaRuntime

let runtime = LambdaRuntime {
    (event: String, context: LambdaContext) in
    "OK"
}

try await runtime.run()
