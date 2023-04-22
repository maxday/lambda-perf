package com.xavierbouclet;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;

public class OkHandler implements RequestHandler<Object, String>{

    static {
        System.setProperty("software.amazon.awssdk.http.service.impl",
                "software.amazon.awssdk.http.urlconnection.UrlConnectionSdkHttpService");
    }

    @Override
    public String handleRequest(Object s, Context context) {
        return "ok";
    }
}
