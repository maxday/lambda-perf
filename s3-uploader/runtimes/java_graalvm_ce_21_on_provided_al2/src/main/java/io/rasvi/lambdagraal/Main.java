/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 */
package io.rasvi.lambdagraal;

import java.io.IOException;

/**
 *
 * @author mohamedrasvi
 */
public class Main {

    public static void main(String[] args) throws IOException, InterruptedException {
        new LambdaRuntime((req) -> {
            return "ok";
        }).start();
    }
}
