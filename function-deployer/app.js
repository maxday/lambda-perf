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
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const REGION = process.env.AWS_REGION;
const ROLE_ARN = process.env.ROLE_ARN;
const LOG_PROCESSOR_ARN = process.env.LOG_PROCESSOR_ARN;
const ACCOUNT_ID = process.env.ACCOUNT_ID;
const QUEUE_NAME = process.env.QUEUE_NAME;
const PROJECT = `lambda-perf`;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  memorySize,
  architecture,
  runtime,
  path,
  handler,
  snapStart
) => {
  const snapStartEnabled = snapStart === "true";
  const params = {
    FunctionName: functionName,
    Handler: handler,
    Runtime: runtime,
    Code: {
      S3Bucket: `${PROJECT}-${REGION}`,
      S3Key: `${path}/code_${architecture}.zip`,
    },
    Role: ROLE_ARN,
    ...(snapStartEnabled && {
      SnapStart: {
        ApplyOn: "PublishedVersions",
      },
    }),
    MemorySize: parseInt(memorySize, 10),
    Architectures: [architecture],
  };
  try {
    console.log(
      `Creation function ${functionName} for ${architecture} (${memorySize})`
    );
    const command = new CreateFunctionCommand(params);
    await client.send(command);

    if (snapStartEnabled) {
      await waitForActive(client, functionName);

      //publish 10 versions
      for (let i = 0; i < 10; i++) {
        //update variables for publishing new version
        await updateFunction(client, functionName);
        await delay(10000);
        const resp = await publishVersion(client, functionName, 0);
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

const deploy = async (
  lambdaClient,
  cloudWatchLogsClient,
  memorySize,
  architecture,
  runtime,
  path,
  handler,
  snapStart
) => {
  const functionName = `${PROJECT}-${path}-${memorySize}-${architecture}`;
  try {
    await deleteFunction(lambdaClient, functionName);
    await createFunction(
      lambdaClient,
      functionName,
      memorySize,
      architecture,
      runtime,
      path,
      handler,
      snapStart
    );
    await deleteLogGroup(cloudWatchLogsClient, functionName);
    await createLogGroup(cloudWatchLogsClient, functionName);
    await createSubscriptionFilter(cloudWatchLogsClient, functionName);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const writeEventToQueue = async (
  client,
  queueUrl,
  memorySize,
  architecture,
  runtime,
  path,
  snapStart
) => {
  const params = {
    MessageAttributes: {
      Architecture: {
        DataType: "String",
        StringValue: architecture,
      },
      MemorySize: {
        DataType: "Number",
        StringValue: memorySize,
      },
      Runtime: {
        DataType: "String",
        StringValue: runtime,
      },
      Path: {
        DataType: "String",
        StringValue: path,
      },
      SnapStart: {
        DataType: "String",
        StringValue: snapStart,
      },
    },
    MessageBody: "invoke",
    QueueUrl: queueUrl,
  };

  try {
    const command = new SendMessageCommand(params);
    await client.send(command);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

exports.handler = async (event, context) => {
  try {
    const lambdaClient = new LambdaClient({ region: REGION });
    const cloudWatchLogsClient = new CloudWatchLogsClient({
      region: REGION,
    });
    // should only contain 1 record as batch size is set to 1
    for (const record of event.Records) {
      console.log(record);
      const { MemorySize, Architecture, Runtime, Path, Handler, SnapStart } =
        record.messageAttributes;

      await deploy(
        lambdaClient,
        cloudWatchLogsClient,
        MemorySize.stringValue,
        Architecture.stringValue,
        Runtime.stringValue,
        Path.stringValue,
        Handler.stringValue,
        SnapStart.stringValue
      );

      const sqsClient = new SQSClient({ region: REGION });
      const queueUrl = `https://sqs.${REGION}.amazonaws.com/${ACCOUNT_ID}/${QUEUE_NAME}`;

      await writeEventToQueue(
        sqsClient,
        queueUrl,
        MemorySize.stringValue,
        Architecture.stringValue,
        Runtime.stringValue,
        Path.stringValue,
        SnapStart.stringValue
      );
    }
  } catch (e) {
    console.error(e);
    context.fail();
  }
};
