const { LambdaClient, AddPermissionCommand, CreateFunctionCommand, DeleteFunctionCommand } = require("@aws-sdk/client-lambda");
const { CloudWatchLogsClient, CreateLogGroupCommand, DeleteLogGroupCommand, PutSubscriptionFilterCommand } = require("@aws-sdk/client-cloudwatch-logs");

const PROJECT = 'lambda-perf';

const REGION = process.env.AWS_REGION;
const ROLE_ARN = process.env.ROLE_ARN;
const LOG_PROCESSOR_ARN = process.env.LOG_PROCESSOR_ARN;

const functionsToDeploy = [
    {
        runtime:    'nodejs12.x',
        handler:    'index.handler',
    },
    {
        runtime:    'nodejs14.x',
        handler:    'index.handler',
    },
    {
        runtime:    'nodejs16.x',
        handler:    'index.handler',
    },
    {
        runtime:    'nodejs18.x',
        handler:    'index.handler',
    },
    {
        runtime:    'python3.7',
        handler:    'index.handler',
    },
    {
        runtime:    'python3.8',
        handler:    'index.handler',
    },
    {
        runtime:    'python3.9',
        handler:    'index.handler',
    },
    {
        runtime:    'dotnetcore3.1',
        handler:    'LambdaPerf::LambdaPerf.Function::Handler',
    },
    {
        runtime:    'dotnet6',
        handler:    'LambdaPerf::LambdaPerf.Function::Handler',
    },
    {
        runtime:    'go1.x',
        handler:    'main',
    },
    {
        runtime:    'java11',
        handler:    'io.github.maxday.Handler',
    },
    {
        runtime:    'java8',
        handler:    'io.github.maxday.Handler',
    },
    {
        runtime:    'ruby2.7',
        handler:    'index.handler',
    },
    {
        runtime:    'provided',
        handler:    'bootstrap',
        path:       'go_on_provided',
    },
    {
        runtime:    'provided.al2',
        handler:    'bootstrap',
        path:       'rust_on_provided_al2',
    },
];

const deleteFunction = async (client, functionName) => {
    const params = {
        FunctionName: functionName
    };
    try {
        const command = new DeleteFunctionCommand(params);
        await client.send(command);
        console.log(`function ${functionName} deleted`);
    } catch (e) {
        if (e.name === 'ResourceNotFoundException') {
            console.log(`function ${functionName} does not exist, skipping deletion`);
        } else {
            console.error(e);
            throw e;
        }
    }
}

const createFunction = async (client, functionName, singleFunction) => {
    const sanitizedRuntime = singleFunction.path ? singleFunction.path : singleFunction.runtime.replace('.', '');
    const params = {
        FunctionName: functionName,
        Handler: singleFunction.handler,
        Runtime: singleFunction.runtime,
        Code: {
            S3Bucket: PROJECT,
            S3Key: `${sanitizedRuntime}/code.zip`
        },
        Role: ROLE_ARN
    };
    try {
        const command = new CreateFunctionCommand(params);
        await client.send(command);
        console.log(`function ${functionName} created`);
    } catch (e) {
        console.error(e);
        throw e;
    }
}

const deleteLogGroup = async (client, functionName) => {
    const params = {
        logGroupName: `/aws/lambda/${functionName}`
    }
    try {
        const command = new DeleteLogGroupCommand(params);
        await client.send(command);
        console.log(`log group ${params.logGroupName} deleted`);
    } catch (e) {
        if (e.name === 'ResourceNotFoundException') {
            console.log(`loggroup ${params.logGroupName} does not exist, skipping deletion`);
        } else {
            console.error(e);
            throw e;
        }
    }
}

const createLogGroup = async (client, functionName) => {
    const params = {
        logGroupName: `/aws/lambda/${functionName}`
    }
    try {
        const command = new CreateLogGroupCommand(params);
        await client.send(command);
        console.log(`log group ${params.logGroupName} created`);
    } catch (e) {
        console.error(e);
        throw e;
    }
}

const createSubscriptionFilter = async (client, functionName) => {
    const params = {
        destinationArn: LOG_PROCESSOR_ARN,
        filterName: `report-log-from-${functionName}`,
        filterPattern: 'REPORT',
        logGroupName: `/aws/lambda/${functionName}`,
    }
    try {
        const command = new PutSubscriptionFilterCommand(params);
        await client.send(command);
        console.log(`subscription ${params.filterName} created`);
    } catch (e) {
        console.error(e);
        throw e;
    }
}

const addPermission = async (client, functionName) => {
    const params = {
        FunctionName: functionName,
        Action: 'lambda:InvokeFunction',
        Principal: `logs.amazonaws.com`,
        StatementId: 'addInvokePermission',
    };
    try {
        const command = new AddPermissionCommand(params);
        await client.send(command);
        console.log(`permission added to ${functionName}`);
    } catch (e) {
        console.error(e);
    }
}

exports.handler = async () => {
    try {
        const lambdaClient = new LambdaClient({ region: REGION });
        const cloudWatchLogsClient = new CloudWatchLogsClient({ region: REGION });
        await addPermission(lambdaClient, LOG_PROCESSOR_ARN);
        for(const singleFunction of functionsToDeploy) {
            const functionSufix = singleFunction.path ? singleFunction.path : singleFunction.runtime.replace('.', '');
            const functionName = `${PROJECT}-${functionSufix}`;
            await deleteFunction(lambdaClient, functionName);
            await createFunction(lambdaClient, functionName, singleFunction);
            await deleteLogGroup(cloudWatchLogsClient, functionName);
            await createLogGroup(cloudWatchLogsClient, functionName);
            await createSubscriptionFilter(cloudWatchLogsClient, functionName);
        }
        return {
            statusCode:200,
            body: JSON.stringify('success'),
        }
    } catch (_) {
        throw 'failure';
    }
};