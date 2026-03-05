using Amazon.Lambda.Core;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]
namespace LambdaPerf
{
    public class Function
    {
        public object Handler()
        {
            return new { statusCode = 200 };
        }
    }
}