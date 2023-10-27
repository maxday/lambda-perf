const {
  DeleteFunctionCommand,
  GetFunctionCommand,
  UpdateFunctionConfigurationCommand,
} = require("@aws-sdk/client-lambda");
const {
  CreateLogGroupCommand,
  DeleteLogGroupCommand,
  PutSubscriptionFilterCommand,
} = require("@aws-sdk/client-cloudwatch-logs");

const MAX_RETRY = 10;
const SLEEP_DELAY_IN_MILLISEC = 5000;

const { SendMessageCommand } = require("@aws-sdk/client-sqs");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const deleteFunction = async (client, functionName, nbRetry) => {
  if (nbRetry > MAX_RETRY) {
    throw "max retries exceeded in deleteFunction";
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
      await delay(SLEEP_DELAY_IN_MILLISEC);
      await deleteFunction(client, functionName, nbRetry + 1);
    }
  }
};

async function updateFunction(client, functionName, nbRetry) {
  if (nbRetry > MAX_RETRY) {
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
  } catch (e) {
    console.error(e);
    await delay(SLEEP_DELAY_IN_MILLISEC);
    await updateFunction(client, functionName, nbRetry + 1);
  }
}

const deleteLogGroup = async (client, functionName, nbRetry) => {
  if (nbRetry > MAX_RETRY) {
    throw "max retries exceeded in deleteLogGroup";
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
      console.error(e);
      await delay(SLEEP_DELAY_IN_MILLISEC);
      await deleteLogGroup(client, functionName, nbRetry + 1);
    }
  }
};

const createLogGroup = async (client, functionName, nbRetry) => {
  if (nbRetry > MAX_RETRY) {
    throw "max retries exceeded in createLogGroup";
  }
  const params = {
    logGroupName: `/aws/lambda/${functionName}`,
  };
  try {
    const command = new CreateLogGroupCommand(params);
    await client.send(command);
    console.log(`log group ${params.logGroupName} created`);
  } catch (e) {
    console.error(e);
    await delay(SLEEP_DELAY_IN_MILLISEC);
    await createLogGroup(client, functionName, nbRetry + 1);
  }
};

const createSubscriptionFilter = async (
  client,
  functionName,
  logProcessorArn,
  nbRetry
) => {
  if (nbRetry > MAX_RETRY) {
    throw "max retries exceeded in createSubscriptionFilter";
  }
  const params = {
    destinationArn: logProcessorArn,
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
    await delay(SLEEP_DELAY_IN_MILLISEC);
    await createSubscriptionFilter(
      client,
      functionName,
      logProcessorArn,
      nbRetry + 1
    );
  }
};

const writeEventToQueue = async (
  client,
  queueUrl,
  memorySize,
  architecture,
  runtime,
  path,
  snapStart,
  isContainer
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
      IsContainer: {
        DataType: "String",
        StringValue: isContainer ? "true" : "false",
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

const getFunction = async (client, functionName, nbRetry) => {
  if (nbRetry > MAX_RETRY) {
    throw "max retries exceeded in getFunction";
  }
  const params = {
    FunctionName: functionName,
  };
  try {
    const command = new GetFunctionCommand(params);
    return await client.send(command);
  } catch (e) {
    console.error(e);
    await delay(SLEEP_DELAY_IN_MILLISEC);
    await getFunction(client, functionName, nbRetry + 1);
  }
};

const waitForActive = async (client, functionName, nbRetry) => {
  if (nbRetry > MAX_RETRY) {
    throw "max retries exceeded in waitForActive";
  }
  try {
    let func = await getFunction(client, functionName);
    console.log(`waiting for function ${functionName} to be active`, func);
    while (func.Configuration.State !== "Active") {
      console.log(`waiting for function ${functionName} to be active`);
      await delay(1000);
      func = await getFunction(client, functionName);
    }
  } catch (e) {
    console.error(e);
    await delay(SLEEP_DELAY_IN_MILLISEC);
    await waitForActive(client, functionName, nbRetry + 1);
  }
};

module.exports = {
  delay,
  deleteFunction,
  updateFunction,
  deleteLogGroup,
  createLogGroup,
  createSubscriptionFilter,
  writeEventToQueue,
  waitForActive,
  MAX_RETRY,
  SLEEP_DELAY_IN_MILLISEC,
};
