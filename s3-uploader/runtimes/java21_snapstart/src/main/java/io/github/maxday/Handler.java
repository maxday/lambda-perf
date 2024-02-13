package io.github.maxday;

import org.crac.Context;
import org.crac.Core;
import org.crac.Resource;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.IOException;
import java.io.OutputStream;

public class Handler implements Resource {

    public Handler() {
        Core.getGlobalContext().register(this);
    }

    public void handleRequest(InputStream inputStream, OutputStream outputStream) throws IOException {
        try {
            outputStream.write("ok".getBytes());
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            outputStream.close();
        }
    }

    // Making best use of the snapshotting, by priming the function
    // https://aws.amazon.com/blogs/compute/reducing-java-cold-starts-on-aws-lambda-functions-with-snapstart/
    @Override
    public void beforeCheckpoint(Context<? extends Resource> context) throws Exception {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            outputStream.write("ok".getBytes());
        }
    }

    @Override
    public void afterRestore(Context<? extends Resource> context) throws Exception {
        // intentionally empty
    }
}
