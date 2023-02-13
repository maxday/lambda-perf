const {
  LambdaClient,
  InvokeCommand,
  UpdateFunctionConfigurationCommand,
  ListVersionsByFunctionCommand,
} = require("@aws-sdk/client-lambda");

const REGION = process.env.AWS_REGION;
const PREFIX = "lambda-perf-";
const NB_INVOKE = 10;
const DELAY = 10000;

const invokeFunction = async (client, functionName) => {
  const params = {
    FunctionName: functionName,
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
    FunctionName: functionName,
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

function isSnapStart(runtime) {
  return runtime.toLowerCase().includes("snapstart");
}

exports.handler = async (event, context) => {
  try {
    const runtime = context.clientContext.runtime;
    const functionName = `${PREFIX}${runtime}`;
    const lambdaClient = new LambdaClient({ region: REGION });

    let versions = [];
    if (isSnapStart(runtime)) {
      versions = await getFunctionVersions(lambdaClient, functionName);
    }
    for (let i = 0; i < NB_INVOKE; ++i) {
      if (isSnapStart(runtime)) {
        let functionNameWithVersion = `${functionName}:${versions[i]}`;
        console.log(`invoking function ${functionNameWithVersion}`);
        await invokeFunction(lambdaClient, functionNameWithVersion);
      } else {
        await invokeFunction(lambdaClient, functionName);
        await updateFunction(lambdaClient, functionName);
        await delay(DELAY);
      }
    }
    return {
      statusCode: 200,
      body: JSON.stringify("success"),
    };
  } catch (_) {
    throw "failure";
  }
};

// get all function versions
const getFunctionVersions = async (client, functionName) => {
  const params = {
    FunctionName: functionName,
  };
  try {
    const command = new ListVersionsByFunctionCommand(params);
    const response = await client.send(command);
    //filter all versions except $LATEST in a string array
    return response.Versions.filter(
      (version) => version.Version !== "$LATEST"
    ).map((version) => version.Version);
  } catch (e) {
    console.error(e);
    throw e;
  }
};
