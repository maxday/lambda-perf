package io.github.maxday;

import java.io.InputStream;
import java.io.IOException;
import java.io.OutputStream;

public class Handler {

    public void handleRequest(InputStream inputStream, OutputStream outputStream) throws IOException {
        try {
            outputStream.write("ok".getBytes());
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            outputStream.close();
        }
    }
}
