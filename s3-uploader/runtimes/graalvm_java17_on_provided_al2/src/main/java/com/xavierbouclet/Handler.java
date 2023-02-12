package com.xavierbouclet;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;

public class Handler implements RequestHandler<String ,String>{
    @Override
    public String handleRequest(String s, Context context) {
        return "ok";
    }
}
