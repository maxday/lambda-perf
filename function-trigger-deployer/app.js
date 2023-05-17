const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const DEPLOYER = process.env.DEPLOYER;
const REGION = process.env.AWS_REGION;

const invokeFunction = async (client, path, slug, memorySize, architecture) => {
  const params = {
    FunctionName: DEPLOYER,
    ClientContext: Buffer.from(
      JSON.stringify({ path, slug, memorySize, architecture })
    ).toString("base64"),
  };
  try {
    const command = new InvokeCommand(params);
    await client.send(command);
    console.log(`function ${params.FunctionName} invoked`);
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
              runtime.slug,
              memorySize,
              architecture
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
