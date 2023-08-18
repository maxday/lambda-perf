#include <aws/lambda-runtime/runtime.h>

using namespace aws::lambda_runtime;

static invocation_response handler(invocation_request)
{
    return invocation_response::success("Ok", "text/plain");
}

int main()
{
    run_handler(handler);
    return 0;
}