package io.rasvi.lambdagraal;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class LambdaRuntime {

    public final String RUNTIME_HOST;
    public final String HANDLER;
    public final String TASK_ROOT;
    public final HttpClient client;
    public final LambdaHandler handler;

    public LambdaRuntime(LambdaHandler handler) {
        this.HANDLER = System.getenv("_HANDLER");
        this.RUNTIME_HOST = System.getenv("AWS_LAMBDA_RUNTIME_API");
        this.TASK_ROOT = System.getenv("LAMBDA_TASK_ROOT");
        client = HttpClient.newHttpClient();
        this.handler = handler;
    }

    public void start() throws IOException, InterruptedException {
        while (true) {
            URI nextInvocationUri = URI.create(String.format("http://%s/2018-06-01/runtime/invocation/next", RUNTIME_HOST));
            var nextInvocationRequest = HttpRequest
                    .newBuilder(nextInvocationUri)
                    .build();
            var nextInvocationResponse = client.send(nextInvocationRequest, HttpResponse.BodyHandlers.ofString());
            String requestId = nextInvocationResponse.headers().firstValue("Lambda-Runtime-Aws-Request-Id").get();
            String nextRequestData = nextInvocationResponse.body();
            String responseData;
            try {
                responseData = handler.handle(nextRequestData);
            } catch (Exception ex) {
                StringWriter sw = new StringWriter();
                PrintWriter pw = new PrintWriter(sw);
                ex.printStackTrace(pw);
                postInvocationError(requestId, pw.toString());
                continue;
            }

            URI responseUri = URI.create(String.format("http://%s/2018-06-01/runtime/invocation/%s/response", RUNTIME_HOST, requestId));
            var postResponseRequest = HttpRequest
                    .newBuilder(responseUri)
                    .POST(HttpRequest.BodyPublishers.ofString(responseData))
                    .build();
            client.send(postResponseRequest, HttpResponse.BodyHandlers.ofString()).body();

        }
    }

    void postInvocationError(String requestId, String error) throws IOException, InterruptedException {
        URI errorURI = URI.create(String.format("http://%s/2018-06-01/runtime/invocation/%s/error", RUNTIME_HOST, requestId));
        var postErrorRequest = HttpRequest
                .newBuilder(errorURI)
                .POST(HttpRequest.BodyPublishers.ofString(error))
                .build();
        client.send(postErrorRequest, HttpResponse.BodyHandlers.ofString()).body();
    }
}
