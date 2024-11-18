using Amazon.Lambda.RuntimeSupport;
using Amazon.Lambda.Serialization.SystemTextJson;
using System.Text.Json.Serialization;

namespace LambdaPerf;

public class Function
{
    private static async Task Main()
    {
        await LambdaBootstrapBuilder.Create(FunctionHandler, new SourceGeneratorLambdaJsonSerializer<LambdaFunctionJsonSerializerContext>())
            .Build()
            .RunAsync();
    }

    public static StatusResponse FunctionHandler()
    {
        return new StatusResponse(StatusCode: 200);
    }
}

public record StatusResponse(int StatusCode);

[JsonSerializable(typeof(StatusResponse))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class LambdaFunctionJsonSerializerContext : JsonSerializerContext
{
}
