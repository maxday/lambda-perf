const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const {
  DynamoDBClient,
  DeleteTableCommand,
  CreateTableCommand,
} = require("@aws-sdk/client-dynamodb");
const {
  LambdaClient,
  AddPermissionCommand,
  RemovePermissionCommand,
} = require("@aws-sdk/client-lambda");

const REGION = process.env.AWS_REGION;
const ACCOUNT_ID = process.env.ACCOUNT_ID;
const QUEUE_NAME = process.env.QUEUE_NAME;
const LOG_PROCESSOR_ARN = process.env.LOG_PROCESSOR_ARN;
const TABLE = "report-log";
const DELAY = 5000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const deleteTable = async (client, table) => {
  const params = {
    TableName: table,
  };
  try {
    const command = new DeleteTableCommand(params);
    await client.send(command);
    console.log(`table ${table} deleted`);
  } catch (e) {
    if (e.name === "ResourceNotFoundException") {
      console.log(`table ${table} does not exist, skipping deletion`);
    } else {
      console.error(e);
      throw e;
    }
  }
};

const createTable = async (client, table) => {
  const params = {
    TableName: table,
    AttributeDefinitions: [
      {
        AttributeName: "requestId",
        AttributeType: "S",
      },
    ],
    KeySchema: [
      {
        AttributeName: "requestId",
        KeyType: "HASH",
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  };
  try {
    const command = new CreateTableCommand(params);
    await client.send(command);
    console.log(`table ${table} created`);
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
  handler,
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
      Handler: {
        DataType: "String",
        StringValue: handler,
      },
      SnapStart: {
        DataType: "String",
        StringValue: snapStart,
      },
    },
    MessageBody: "deploy",
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

const addPermission = async (client, functionName) => {
  const params = {
    FunctionName: functionName,
    Action: "lambda:InvokeFunction",
    Principal: `logs.amazonaws.com`,
    StatementId: "invokePermission",
  };
  try {
    const command = new AddPermissionCommand(params);
    await client.send(command);
    console.log(`permission added to ${functionName}`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const removePermission = async (client, functionName) => {
  const params = {
    FunctionName: functionName,
    StatementId: "invokePermission",
  };
  try {
    const command = new RemovePermissionCommand(params);
    await client.send(command);
    console.log(`permission removed from ${functionName}`);
  } catch (e) {
    console.warn(e);
  }
};

exports.handler = async (_, context) => {
  try {
    const manifest = require("../manifest.json");
    const sqsClient = new SQSClient({ region: REGION });
    const queueUrl = `https://sqs.${REGION}.amazonaws.com/${ACCOUNT_ID}/${QUEUE_NAME}`;

    const lambdaClient = new LambdaClient({ region: REGION });
    await removePermission(lambdaClient, LOG_PROCESSOR_ARN);
    await addPermission(lambdaClient, LOG_PROCESSOR_ARN);

    const dynamoDbClient = new DynamoDBClient({ region: REGION });
    await deleteTable(dynamoDbClient, TABLE);
    await delay(DELAY);
    await createTable(dynamoDbClient, TABLE);

    for (const memorySize of manifest.memorySizes) {
      for (const runtime of manifest.runtimes) {
        for (const architecture of runtime.architectures) {
          await writeEventToQueue(
            sqsClient,
            queueUrl,
            memorySize,
            architecture,
            runtime.runtime,
            runtime.path,
            runtime.handler,
            !!runtime.snapStart
          );
        }
      }
    }
  } catch (e) {
    console.error(e);
    context.fail();
  }
};
