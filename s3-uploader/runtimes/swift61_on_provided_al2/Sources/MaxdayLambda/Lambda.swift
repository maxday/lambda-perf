import AWSLambdaRuntime

@main
struct MyLambda: SimpleLambdaHandler {
    func handle(_ input: String, context: LambdaContext) async throws -> String {
        "Ok"
    }
}