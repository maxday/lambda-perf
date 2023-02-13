const {
  LambdaClient,
  InvokeCommand,
  UpdateFunctionConfigurationCommand,
} = require("@aws-sdk/client-lambda");

const REGION = process.env.AWS_REGION;
const PREFIX = "lambda-perf-";
const NB_INVOKE = 10;
const DELAY = 10000;

const invokeFunction = async (client, functionName) => {
  const params = {
    FunctionName: `${PREFIX}${functionName}`,
  };
  try {
    const command = new InvokeCommand(params);
    await client.send(command);
    console.log(`function ${functionName} invoked`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const updateFunction = async (client, functionName) => {
  const params = {
    FunctionName: `${PREFIX}${functionName}`,
    Environment: {
      Variables: { coldStart: `${Math.random()}` },
    },
  };
  try {
    const command = new UpdateFunctionConfigurationCommand(params);
    await client.send(command);
    console.log(`function ${functionName} updated`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

exports.handler = async (event, context) => {
  try {
    const runtime = context.clientContext.runtime;
    const lambdaClient = new LambdaClient({ region: REGION });
    for (let i = 0; i < NB_INVOKE; ++i) {
      await invokeFunction(lambdaClient, runtime);
      await updateFunction(lambdaClient, runtime);
      await delay(DELAY);
    }
    return {
      statusCode: 200,
      body: JSON.stringify("success"),
    };
  } catch (_) {
    throw "failure";
  }
};
