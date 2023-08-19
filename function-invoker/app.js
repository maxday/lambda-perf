const {
  LambdaClient,
  InvokeCommand,
  UpdateFunctionConfigurationCommand,
  ListVersionsByFunctionCommand,
} = require("@aws-sdk/client-lambda");

const invokeFunction = async (client, functionName, delayInMs, nbRetry) => {
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
    await delay(delayInMs);
    await invokeFunction(client, functionName, delayInMs, nbRetry + 1);
  }
};

const updateFunction = async (client, functionName, delayInMs, nbRetry) => {
  if (nbRetry > 5) {
    throw "max retries exceeded in updateFunction";
  }
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
    await delay(delayInMs);
    await updateFunction(client, functionName, delayInMs, nbRetry + 1);
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

exports.handler = async (event, context) => {
  const REGION = process.env.AWS_REGION;
  const PREFIX = "lambda-perf-";
  const NB_INVOKE = 10;
  const DELAY = 30000;
  try {
    const lambdaClient = new LambdaClient({ region: REGION });
    // should only contain 1 record as batch size is set to 1
    for (const record of event.Records) {
      console.log(record);
      const { MemorySize, Architecture, Path, SnapStart } =
        record.messageAttributes;
      const isSnapStart = SnapStart.stringValue === "true";
      const functionName = `${PREFIX}${Path.stringValue}-${MemorySize.stringValue}-${Architecture.stringValue}`;
      let versions = [];
      if (isSnapStart) {
        versions = await getFunctionVersions(lambdaClient, functionName);
      }
      for (let i = 0; i < NB_INVOKE; ++i) {
        if (isSnapStart) {
          let functionNameWithVersion = `${functionName}:${versions[i]}`;
          console.log(`invoking function ${functionNameWithVersion}`);
          await invokeFunction(lambdaClient, functionNameWithVersion, DELAY, 0);
        } else {
          await invokeFunction(lambdaClient, functionName, DELAY, 0);
          await updateFunction(lambdaClient, functionName, DELAY, 0);
        }
        await delay(DELAY);
      }
    }
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
