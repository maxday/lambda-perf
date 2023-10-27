const {
  LambdaClient,
  CreateFunctionCommand,
  PublishVersionCommand,
} = require("@aws-sdk/client-lambda");
const { CloudWatchLogsClient } = require("@aws-sdk/client-cloudwatch-logs");
const { SQSClient } = require("@aws-sdk/client-sqs");
const {
  delay,
  deleteFunction,
  updateFunction,
  deleteLogGroup,
  createLogGroup,
  createSubscriptionFilter,
  writeEventToQueue,
  waitForActive,
} = require("./common");

const createFunction = async (
  client,
  project,
  region,
  roleArn,
  functionName,
  memorySize,
  architecture,
  runtime,
  path,
  handler,
  snapStart,
  layer
) => {
  const snapStartEnabled = snapStart === "true";
  const params = {
    FunctionName: functionName,
    Handler: handler,
    Runtime: runtime,
    Code: {
      S3Bucket: `${project}-${region}`,
      S3Key: `${path}/code_${architecture}.zip`,
    },
    Role: roleArn,
    ...(snapStartEnabled && {
      SnapStart: {
        ApplyOn: "PublishedVersions",
      },
    }),
    MemorySize: parseInt(memorySize, 10),
    Architectures: [architecture],
    ...(layer && {
      Layers: [layer],
    }),
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

const deploy = async (
  lambdaClient,
  cloudWatchLogsClient,
  project,
  region,
  roleArn,
  logProcessorArn,
  memorySize,
  architecture,
  runtime,
  path,
  handler,
  snapStart,
  layer
) => {
  const functionName = `${project}-${path}-zip-${memorySize}-${architecture}`;
  try {
    await deleteFunction(lambdaClient, functionName, 0);
    await createFunction(
      lambdaClient,
      project,
      region,
      roleArn,
      functionName,
      memorySize,
      architecture,
      runtime,
      path,
      handler,
      snapStart,
      layer
    );
    await deleteLogGroup(cloudWatchLogsClient, functionName, 0);
    await createLogGroup(cloudWatchLogsClient, functionName, 0);
    await createSubscriptionFilter(
      cloudWatchLogsClient,
      functionName,
      logProcessorArn,
      0
    );
    await waitForActive(lambdaClient, functionName, 0);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

exports.handler = async (event, context) => {
  const REGION = process.env.AWS_REGION;
  const ROLE_ARN = process.env.ROLE_ARN;
  const LOG_PROCESSOR_ARN = process.env.LOG_PROCESSOR_ARN;
  const ACCOUNT_ID = process.env.ACCOUNT_ID;
  const QUEUE_NAME = process.env.QUEUE_NAME;
  const PROJECT = `lambda-perf`;

  try {
    const lambdaClient = new LambdaClient({ region: REGION });
    const cloudWatchLogsClient = new CloudWatchLogsClient({
      region: REGION,
    });
    // should only contain 1 record as batch size is set to 1
    for (const record of event.Records) {
      const {
        MemorySize,
        Architecture,
        Runtime,
        Path,
        Handler,
        SnapStart,
        Layer,
      } = record.messageAttributes;

      const layer = Layer ? Layer.stringValue : null;

      await deploy(
        lambdaClient,
        cloudWatchLogsClient,
        PROJECT,
        REGION,
        ROLE_ARN,
        LOG_PROCESSOR_ARN,
        MemorySize.stringValue,
        Architecture.stringValue,
        Runtime.stringValue,
        Path.stringValue,
        Handler.stringValue,
        SnapStart.stringValue,
        layer
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
        SnapStart.stringValue,
        false
      );
    }
  } catch (e) {
    console.error(e);
    context.fail();
  }
};
