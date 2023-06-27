package io.github.maxday;

import java.io.InputStream;
import java.io.OutputStream;

public class Handler {

    public String handleRequest(InputStream inputStream, OutputStream outputStream) {
        return "ok";
    }
}
