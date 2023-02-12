package com.xavierbouclet;

import com.amazonaws.services.lambda.runtime.Context;
import com.formkiq.lambda.runtime.graalvm.LambdaContext;

import java.util.UUID;

public class Lambda {

    public static void main(String[] args) {
        Context context = new LambdaContext(UUID.randomUUID().toString());
        new Handler().handleRequest("ok", context);
    }
}
