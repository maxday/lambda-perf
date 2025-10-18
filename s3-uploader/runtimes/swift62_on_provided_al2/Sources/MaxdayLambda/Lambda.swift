import AWSLambdaRuntime

let runtime = LambdaRuntime {
    (event: [String: String], context: LambdaContext) in
    "OK"
}

try await runtime.run()