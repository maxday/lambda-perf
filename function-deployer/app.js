const {
  LambdaClient,
  AddPermissionCommand,
  CreateFunctionCommand,
  DeleteFunctionCommand,
  PublishVersionCommand,
  GetFunctionCommand,
  UpdateFunctionConfigurationCommand,
} = require("@aws-sdk/client-lambda");
const {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  DeleteLogGroupCommand,
  PutSubscriptionFilterCommand,
} = require("@aws-sdk/client-cloudwatch-logs");

const REGION = process.env.AWS_REGION;
const ROLE_ARN = process.env.ROLE_ARN;
const LOG_PROCESSOR_ARN = process.env.LOG_PROCESSOR_ARN;
const PROJECT = "lambda-perf";
const MAX_RETRY = 20;
const SHORT_DELAY = 5000;
const RETRY_DELAY = 30000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const deleteFunction = async (client, functionName, nbRetry) => {
  if (nbRetry > MAX_RETRY) {
    throw "max retries exceeded";
  }
  const params = {
    FunctionName: functionName,
  };
  try {
    console.log(`function ${functionName} is about to be deleted`);
    const command = new DeleteFunctionCommand(params);
    await client.send(command);
    console.log(`function ${functionName} deleted`);
  } catch (e) {
    if (e.name === "ResourceNotFoundException") {
      console.log(`function ${functionName} does not exist, skipping deletion`);
    } else {
      console.error(e);
      await delay(RETRY_DELAY);
      await deleteFunction(client, functionName, nbRetry + 1);
    }
  }
};

async function updateFunction(client, functionName, environment) {
  const params = {
    FunctionName: functionName,
    Environment: {
      Variables: { coldStart: `${Math.random()}`, ...environment },
    },
  };
  try {
    const command = new UpdateFunctionConfigurationCommand(params);
    await client.send(command);
  } catch (e) {
    console.error(e);
    throw e;
  }
}

const createFunction = async (
  client,
  functionName,
  path,
  handler,
  runtime,
  memorySize,
  architecture,
  environment,
  snapStart,
  nbRetry
) => {
  if (nbRetry > MAX_RETRY) {
    throw "max retries exceeded";
  }
  const params = {
    FunctionName: functionName,
    Handler: handler,
    Runtime: runtime,
    Code: {
      S3Bucket: `${PROJECT}-${REGION}`,
      S3Key: `${path}/code_${architecture}.zip`,
    },
    Role: ROLE_ARN,
    ...snapStart,
    MemorySize: memorySize,
    Architectures: [architecture],
    Environment: {
      Variables: environment,
    },
  };
  try {
    console.log(
      `Creation function ${functionName} for ${architecture} (${memorySize})`
    );
    const command = new CreateFunctionCommand(params);
    await client.send(command);
  } catch (e) {
    console.error(e);
    await delay(RETRY_DELAY);
    await createFunction(
      client,
      functionName,
      path,
      handler,
      runtime,
      memorySize,
      architecture,
      environment,
      snapStart,
      nbRetry + 1
    );
  }
};

//wait until lambda is active
const waitForActive = async (client, functionName) => {
  let func = await getFunction(client, functionName);
  console.log(`waiting for function ${functionName} to be active`, func);
  while (func.Configuration.State !== "Active") {
    console.log(`waiting for function ${functionName} to be active`);
    await delay(SHORT_DELAY);
    func = await getFunction(client, functionName);
  }
};

const getFunction = async (client, functionName) => {
  const params = {
    FunctionName: functionName,
  };
  try {
    const command = new GetFunctionCommand(params);
    return await client.send(command);
  } catch (e) {
    console.error(e);
    throw e;
  }
};
const publishVersion = async (client, functionName, nbRetry) => {
  if (nbRetry > 2 * MAX_RETRY) {
    throw "max retries exceeded";
  }
  const params = {
    FunctionName: functionName,
  };
  try {
    const command = new PublishVersionCommand(params);
    const resp = await client.send(command);
    console.log(
      `published version ${resp.Version} for function ${functionName}`
    );
  } catch (e) {
    console.error(e);
    await delay(RETRY_DELAY);
    await publishVersion(client, functionName, nbRetry + 1);
  }
};

const deleteLogGroup = async (client, functionName, nbRetry) => {
  if (nbRetry > MAX_RETRY) {
    throw "max retries exceeded";
  }
  const params = {
    logGroupName: `/aws/lambda/${functionName}`,
  };
  try {
    const command = new DeleteLogGroupCommand(params);
    await client.send(command);
    console.log(`log group ${params.logGroupName} deleted`);
  } catch (e) {
    if (e.name === "ResourceNotFoundException") {
      console.log(
        `loggroup ${params.logGroupName} does not exist, skipping deletion`
      );
    } else {
      await delay(RETRY_DELAY);
      await deleteLogGroup(client, functionName, nbRetry + 1);
    }
  }
};

const createLogGroup = async (client, functionName, nbRetry) => {
  if (nbRetry > MAX_RETRY) {
    throw "max retries exceeded";
  }
  const params = {
    logGroupName: `/aws/lambda/${functionName}`,
  };
  try {
    const command = new CreateLogGroupCommand(params);
    await client.send(command);
    console.log(`log group ${params.logGroupName} created`);
  } catch (e) {
    await delay(RETRY_DELAY);
    await createLogGroup(client, functionName, nbRetry + 1);
  }
};

const createSubscriptionFilter = async (client, functionName, nbRetry) => {
  if (nbRetry > MAX_RETRY) {
    throw "max retries exceeded";
  }
  const params = {
    destinationArn: LOG_PROCESSOR_ARN,
    filterName: `report-log-from-${functionName}`,
    filterPattern: "REPORT",
    logGroupName: `/aws/lambda/${functionName}`,
  };
  try {
    const command = new PutSubscriptionFilterCommand(params);
    await client.send(command);
    console.log(`subscription ${params.filterName} created`);
  } catch (e) {
    await delay(RETRY_DELAY);
    await createSubscriptionFilter(client, functionName, nbRetry + 1);
  }
};

const addPermission = async (client, functionName, nbRetry) => {
  if (nbRetry > MAX_RETRY) {
    throw "max retries exceeded";
  }
  const params = {
    FunctionName: functionName,
    Action: "lambda:InvokeFunction",
    Principal: `logs.amazonaws.com`,
    StatementId: "addInvokePermission",
  };
  try {
    const command = new AddPermissionCommand(params);
    await client.send(command);
    console.log(`permission added to ${functionName}`);
  } catch (e) {
    console.error(e);
    await delay(RETRY_DELAY);
    await addPermission(client, functionName, nbRetry + 1);
  }
};

const deploy = async (
  lambdaClient,
  cloudWatchLogsClient,
  path,
  slug,
  handler,
  runtime,
  memorySize,
  architecture,
  environment,
  snapStart
) => {
  const functionSufix = slug ? slug : path;
  const functionName = `${PROJECT}-${functionSufix}-${memorySize}-${architecture}`;
  try {
    await deleteFunction(lambdaClient, functionName, 0);
    await createFunction(
      lambdaClient,
      functionName,
      path,
      handler,
      runtime,
      memorySize,
      architecture,
      environment,
      snapStart,
      0
    );
    if (snapStart) {
      await waitForActive(client, functionName);

      //publish 10 versions
      for (let i = 0; i < 10; i++) {
        //update variables for publishing new version
        await updateFunction(client, functionName, environment);
        await delay(SHORT_DELAY);
        await publishVersion(client, functionName, 0);
      }
    }
    await deleteLogGroup(cloudWatchLogsClient, functionName, 0);
    await createLogGroup(cloudWatchLogsClient, functionName, 0);
    await createSubscriptionFilter(cloudWatchLogsClient, functionName, 0);
  } catch (e) {
    throw e;
  }
};

exports.handler = async (event, context) => {
  try {
    console.log("event = ", event);
    console.log(JSON.stringify(event));
    console.log("context = ", context);
    console.log(JSON.stringify(context));
    console.log("clientContext = ", context.clientContext);
    const {
      memorySize,
      architecture,
      path,
      slug,
      handler,
      runtime,
      environment,
      snapStart,
    } = context.clientContext;
    const lambdaClient = new LambdaClient({ region: REGION });
    const cloudWatchLogsClient = new CloudWatchLogsClient({
      region: REGION,
    });
    //await addPermission(lambdaClient, LOG_PROCESSOR_ARN);
    await deploy(
      lambdaClient,
      cloudWatchLogsClient,
      path,
      slug,
      handler,
      runtime,
      memorySize,
      architecture,
      environment,
      snapStart
    );
    return {
      statusCode: 200,
      body: JSON.stringify("success"),
    };
  } catch (e) {
    console.error(e);
    context.fail();
  }
};
