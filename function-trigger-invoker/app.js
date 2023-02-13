const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");
const {
    DynamoDBClient,
    DeleteTableCommand,
    CreateTableCommand,
} = require("@aws-sdk/client-dynamodb");

const REGION = process.env.AWS_REGION;
const INVOKER = process.env.INVOKER;
const TABLE = "report-log";
const DELAY = 5000;
const RUNTIMES = [
    "dotnet6",
    "dotnetcore31",
    "go_on_provided",
    "go1x",
    "java8",
    "java11",
    "nodejs12x",
    "nodejs14x",
    "nodejs16x",
    "nodejs18x",
    "python37",
    "python38",
    "python39",
    "ruby27",
    "rust_on_provided_al2",
    "dotnet7_aot_on_provided_al2",
    "quarkus_native_on_provided_al2",
    "java11_snapstart",
];

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

const invokeFunction = async (client, runtime) => {
    const params = {
        FunctionName: INVOKER,
        ClientContext: Buffer.from(
            JSON.stringify({ runtime: runtime })
        ).toString("base64"),
    };
    try {
        const command = new InvokeCommand(params);
        await client.send(command);
        console.log(`function ${params.FunctionName} invoked`);
    } catch (e) {
        console.error(e);
        throw e;
    }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

exports.handler = async () => {
    try {
        const dynamoDbClient = new DynamoDBClient({ region: REGION });
        await deleteTable(dynamoDbClient, TABLE);
        await delay(DELAY);
        await createTable(dynamoDbClient, TABLE);
        await delay(DELAY);
        const lambdaClient = new LambdaClient({ region: REGION });
        const allPromises = [];
        for (runtime of RUNTIMES) {
            allPromises.push(invokeFunction(lambdaClient, runtime));
        }
        await Promise.all(allPromises);
        return {
            statusCode: 200,
            body: JSON.stringify("success"),
        };
    } catch (_) {
        throw "failure";
    }
};
