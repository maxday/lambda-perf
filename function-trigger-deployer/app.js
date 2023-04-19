const { InvokeCommand } = require("@aws-sdk/client-lambda");

const DEPLOYER = process.env.DEPLOYER;

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
    const memorySizes = [128, 256, 512, 1024];
    const architectures = ["x86_64"];
    const allPromises = [];
    for (memorySize of memorySizes) {
      for (architecture of architectures) {
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
  } catch (_) {
    throw "failure";
  }
};
