import AWSLambdaRuntime

typealias Event = [String: AWSLambdaRuntime.LambdaCodable]

let runtime = LambdaRuntime {
    (event: Event, context: LambdaContext) in
    "OK"
}

try await runtime.run()