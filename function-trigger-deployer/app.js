const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const DEPLOYER = process.env.DEPLOYER;
const REGION = process.env.AWS_REGION;

const invokeFunction = async (client, memorySize, architecture) => {
  const params = {
    FunctionName: DEPLOYER,
    ClientContext: Buffer.from(
      JSON.stringify({ memorySize, architecture })
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

exports.handler = async () => {
  try {
    const manifest = require("../manifest.json");
    const allPromises = [];
    const lambdaClient = new LambdaClient({ region: REGION });

    for (memorySize of manifest.memorySizes) {
      for (architecture of manifest.architectures) {
        allPromises.push(
          invokeFunction(lambdaClient, memorySize, architecture)
        );
      }
    }
    await Promise.all(allPromises);
    return {
      statusCode: 200,
      body: JSON.stringify("success"),
    };
  } catch (e) {
    console.log(e);
    throw "failure";
  }
};
