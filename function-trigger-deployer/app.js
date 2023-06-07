const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const DEPLOYER = process.env.DEPLOYER;
const REGION = process.env.AWS_REGION;

const invokeFunction = async (
  client,
  path,
  handler,
  slug,
  memorySize,
  architecture,
  runtime,
  environment,
  snapStart
) => {
  const payload = JSON.stringify({
    path,
    slug,
    handler,
    memorySize,
    architecture,
    runtime,
    environment,
    snapStart,
  });
  const params = {
    FunctionName: DEPLOYER,
    InvocationType: "Event",
    Payload: Buffer.from(payload),
  };
  try {
    const command = new InvokeCommand(params);
    await client.send(command);
    console.log(
      `function ${params.FunctionName} invoked, payload = ${payload}`
    );
  } catch (e) {
    console.error(e);
    throw e;
  }
};

exports.handler = async (_, context) => {
  try {
    const manifest = require("../manifest.json");
    const allPromises = [];
    const lambdaClient = new LambdaClient({ region: REGION });

    for (memorySize of manifest.memorySizes) {
      for (runtime of manifest.runtimes) {
        for (architecture of runtime.architectures) {
          allPromises.push(
            invokeFunction(
              lambdaClient,
              runtime.path,
              runtime.handler,
              runtime.slug,
              memorySize,
              architecture,
              runtime.runtime,
              runtime.environment,
              runtime.snapStart
            )
          );
        }
      }
    }
    await Promise.all(allPromises);
    return {
      statusCode: 200,
      body: JSON.stringify("success"),
    };
  } catch (e) {
    console.error(e);
    context.fail();
  }
};
