package maxday;

import javax.inject.Named;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;

@Named("benchmark")
public class BenchmarkLambda implements RequestHandler<Object, String> {

    @Override
    public String handleRequest(Object input, Context context) {
        return "ok";
    }
}
