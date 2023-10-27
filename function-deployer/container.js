const {
  LambdaClient,
  CreateFunctionCommand,
} = require("@aws-sdk/client-lambda");
const { CloudWatchLogsClient } = require("@aws-sdk/client-cloudwatch-logs");
const { SQSClient } = require("@aws-sdk/client-sqs");

const {
  delay,
  deleteFunction,
  deleteLogGroup,
  createLogGroup,
  createSubscriptionFilter,
  writeEventToQueue,
  waitForActive,
  MAX_RETRY,
  SLEEP_DELAY_IN_MILLISEC,
} = require("./common");

const createFunction = async (
  client,
  accountId,
  project,
  region,
  roleArn,
  functionName,
  memorySize,
  architecture,
  path,
  handler,
  nbRetry
) => {
  if (nbRetry > MAX_RETRY) {
    throw "max retries exceeded in createFunction";
  }
  const params = {
    FunctionName: functionName,
    PackageType: "Image",
    Code: {
      ImageUri: `${accountId}.dkr.ecr.${region}.amazonaws.com/${project}:${path}-${architecture}`,
    },
    ImageConfig: {
      Command: [handler],
    },
    Role: roleArn,
    MemorySize: parseInt(memorySize, 10),
    Architectures: [architecture],
  };
  try {
    console.log(
      `Creation function ${functionName} for ${architecture} (${memorySize})`
    );
    const command = new CreateFunctionCommand(params);
    await client.send(command);
  } catch (e) {
    console.error(e);
    await delay(SLEEP_DELAY_IN_MILLISEC);
    await createFunction(
      client,
      accountId,
      project,
      region,
      roleArn,
      functionName,
      memorySize,
      architecture,
      path,
      handler,
      nbRetry + 1
    );
  }
};

const deploy = async (
  lambdaClient,
  accountId,
  cloudWatchLogsClient,
  project,
  region,
  roleArn,
  logProcessorArn,
  memorySize,
  architecture,
  path,
  handler
) => {
  const functionName = `${project}-${path}-container-${memorySize}-${architecture}`;
  try {
    await deleteFunction(lambdaClient, functionName, 0);
    await createFunction(
      lambdaClient,
      accountId,
      project,
      region,
      roleArn,
      functionName,
      memorySize,
      architecture,
      path,
      handler,
      0
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
      const { MemorySize, Architecture, Runtime, Path, Handler, SnapStart } =
        record.messageAttributes;

      await deploy(
        lambdaClient,
        ACCOUNT_ID,
        cloudWatchLogsClient,
        PROJECT,
        REGION,
        ROLE_ARN,
        LOG_PROCESSOR_ARN,
        MemorySize.stringValue,
        Architecture.stringValue,
        Path.stringValue,
        Handler.stringValue
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
        true
      );
    }
  } catch (e) {
    console.error(e);
    context.fail();
  }
};
