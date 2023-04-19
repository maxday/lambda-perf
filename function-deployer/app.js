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
const PROJECT = `lambda-perf`;

const deleteFunction = async (client, functionName) => {
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
      throw e;
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
  singleFunction,
  memorySize,
  architecture
) => {
  const sanitizedRuntime = singleFunction.path
    ? singleFunction.path
    : singleFunction.runtime.replace(".", "");
  const params = {
    FunctionName: functionName,
    Handler: singleFunction.handler,
    Runtime: singleFunction.runtime,
    Code: {
      S3Bucket: `${PROJECT}-${REGION}`,
      S3Key: `${sanitizedRuntime}/code.zip`,
    },
    Role: ROLE_ARN,
    ...(singleFunction.snapStart && singleFunction.snapStart),
    MemorySize: memorySize,
    Architectures: [architecture],
  };
  try {
    const command = new CreateFunctionCommand(params);
    await client.send(command);

    if (singleFunction.snapStart) {
      await waitForActive(client, functionName);

      //publish 10 versions
      for (let i = 0; i < 10; i++) {
        //update variables for publishing new version
        await updateFunction(client, functionName);
        await delay(10000);
        const resp = await publishVersion(client, functionName);
        console.log(
          `published version ${resp.Version} for function ${functionName}`
        );
      }
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

//wait until lambda is active
const waitForActive = async (client, functionName) => {
  let func = await getFunction(client, functionName);
  console.log(`waiting for function ${functionName} to be active`, func);
  while (func.Configuration.State !== "Active") {
    console.log(`waiting for function ${functionName} to be active`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    func = await getFunction(client, functionName);
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
const publishVersion = async (client, functionName) => {
  const params = {
    FunctionName: functionName,
  };
  try {
    const command = new PublishVersionCommand(params);
    return await client.send(command);
    console.log(`function ${functionName} published`);
  } catch (e) {
    console.error(e);
    throw e;
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

const addPermission = async (client, functionName) => {
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
  }
};

const deploy = async (
  lambdaClient,
  cloudWatchLogsClient,
  memorySize,
  architecture
) => {
  const runtimes = require("../manifest.json");
  for (const singleFunction of runtimes) {
    const functionSufix = singleFunction.path
      ? singleFunction.path
      : singleFunction.runtime.replace(".", "");
    const functionName = `${PROJECT}-${functionSufix}-${memorySize}-${architecture}`;
    try {
      await deleteFunction(lambdaClient, functionName);
      await createFunction(
        lambdaClient,
        functionName,
        singleFunction,
        memorySize,
        architecture
      );
      await deleteLogGroup(cloudWatchLogsClient, functionName);
      await createLogGroup(cloudWatchLogsClient, functionName);
      await createSubscriptionFilter(cloudWatchLogsClient, functionName);
    } catch (e) {
      if (e.name === "InvalidParameterValueException") {
        // that's fine, we just need to skip this runtime
        console.log(
          `skipping runtime = ${singleFunction.path}, memorysize = ${memorySize}, archi = ${architecture}`
        );
      } else {
        throw e;
      }
    }
  }
};

exports.handler = async () => {
  try {
    console.log("in handler, clientContext = ", clientContext);
    const { memorySize, architecture } = context.clientContext;
    const lambdaClient = new LambdaClient({ region: REGION });
    const cloudWatchLogsClient = new CloudWatchLogsClient({
      region: REGION,
    });
    await addPermission(lambdaClient, LOG_PROCESSOR_ARN);
    await deploy(lambdaClient, cloudWatchLogsClient, memorySize, architecture);
    return {
      statusCode: 200,
      body: JSON.stringify("success"),
    };
  } catch (_) {
    throw "failure";
  }
};
