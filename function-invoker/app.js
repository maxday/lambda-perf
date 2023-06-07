const {
  LambdaClient,
  InvokeCommand,
  UpdateFunctionConfigurationCommand,
  ListVersionsByFunctionCommand,
} = require("@aws-sdk/client-lambda");

const REGION = process.env.AWS_REGION;
const PROJECT = "lambda-perf";
const NB_INVOKE = 10;
const DELAY = 10000;

const invokeFunction = async (client, functionName, nbRetry) => {
  if (nbRetry > 5) {
    throw "max retries exceeded in invokeFunction";
  }
  const params = {
    FunctionName: functionName,
  };
  try {
    const command = new InvokeCommand(params);
    await client.send(command);
    console.log(`function ${functionName} invoked`);
  } catch (e) {
    console.error(e);
    await delay(DELAY);
    await invokeFunction(client, functionName, nbRetry + 1);
  }
};

const updateFunction = async (client, functionName, environment, nbRetry) => {
  if (nbRetry > 5) {
    throw "max retries exceeded in updateFunction";
  }
  const params = {
    FunctionName: functionName,
    Environment: {
      Variables: { coldStart: `${Math.random()}`, ...environment },
    },
  };
  try {
    const command = new UpdateFunctionConfigurationCommand(params);
    await client.send(command);
    console.log(`function ${functionName} updated`);
  } catch (e) {
    console.error(e);
    await delay(DELAY);
    await updateFunction(client, functionName, nbRetry + 1);
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isSnapStart(path) {
  return path.toLowerCase().includes("snapstart");
}

exports.handler = async (_, context) => {
  try {
    const { path, slug, architecture, memorySize, environment } =
      context.clientContext;

    const functionSufix = slug ? slug : path;

    const functionName = `${PROJECT}-${functionSufix}-${memorySize}-${architecture}`;
    const lambdaClient = new LambdaClient({ region: REGION });

    let versions = [];
    if (isSnapStart(path)) {
      versions = await getFunctionVersions(lambdaClient, functionName);
    }
    for (let i = 0; i < NB_INVOKE; ++i) {
      if (isSnapStart(path)) {
        let functionNameWithVersion = `${functionName}:${versions[i]}`;
        console.log(`invoking function ${functionNameWithVersion}`);
        await invokeFunction(lambdaClient, functionNameWithVersion, 0);
      } else {
        await invokeFunction(lambdaClient, functionName, 0);
        await updateFunction(lambdaClient, functionName, environment, 0);
      }
      await delay(DELAY);
    }
    return {
      statusCode: 200,
      body: JSON.stringify("success"),
    };
  } catch (e) {
    console.error(e);
    context.fail();
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
