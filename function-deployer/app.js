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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const deleteFunction = async (client, functionName, nbRetry) => {
  if (nbRetry > 5) {
    throw "max retries exceeded";
  }
  const params = {
    FunctionName: functionName,
  };
  try {
    const command = new DeleteFunctionCommand(params);
    await client.send(command);
    console.log(`function ${functionName} deleted`);
  } catch (e) {
    if (e.name === "ResourceNotFoundException") {
      console.log(`function ${functionName} does not exist, skipping deletion`);
    } else {
      console.error(e);
      await delay(5000);
      await deleteFunction(client, functionName, nbRetry + 1);
    }
  }
};

async function updateFunction(client, functionName) {
  const params = {
    FunctionName: functionName,
    Environment: {
      Variables: { coldStart: `${Math.random()}` },
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
  if (nbRetry > 5) {
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

    if (snapStart) {
      await waitForActive(client, functionName);

      //publish 10 versions
      for (let i = 0; i < 10; i++) {
        //update variables for publishing new version
        await updateFunction(client, functionName);
        await delay(10000);
        await publishVersion(client, functionName, 0);
      }
    }
  } catch (e) {
    console.error(e);
    await delay(5000);
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
    await delay(1000);
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
  if (nbRetry > 5) {
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
    await delay(20000);
    await publishVersion(client, functionName, nbRetry + 1);
  }
};

const deleteLogGroup = async (client, functionName) => {
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
      console.error(e);
      throw e;
    }
  }
};

const createLogGroup = async (client, functionName) => {
  const params = {
    logGroupName: `/aws/lambda/${functionName}`,
  };
  try {
    const command = new CreateLogGroupCommand(params);
    await client.send(command);
    console.log(`log group ${params.logGroupName} created`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const createSubscriptionFilter = async (client, functionName) => {
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
    console.error(e);
    throw e;
  }
};

const addPermission = async (client, functionName, nbRetry) => {
  if (nbRetry > 5) {
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
    await delay(2000);
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
    await deleteLogGroup(cloudWatchLogsClient, functionName);
    await createLogGroup(cloudWatchLogsClient, functionName);
    await createSubscriptionFilter(cloudWatchLogsClient, functionName);
  } catch (e) {
    throw e;
  }
};

exports.handler = async (_, context) => {
  try {
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
