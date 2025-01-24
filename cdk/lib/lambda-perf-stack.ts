import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import { createRole } from './role';


export class LambdaPerfStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const region = this.region;
    const accountId = this.account;

    // S3 Deployment Bucket
    const deploymentBucket = new s3.Bucket(this, 'LambdaPerfBucket', {
      bucketName: `lambda-perf-${region}`,
    });

    createRole(this);

    // // SQS Queues
    // const deployerQueue = new sqs.Queue(this, 'LambdaPerfDeployerQueue', {
    //   queueName: 'lambda-perf-deployer',
    //   visibilityTimeout: cdk.Duration.seconds(900),
    // });

    // const snapstartDeployerQueue = new sqs.Queue(this, 'LambdaPerfSnapstartDeployerQueue', {
    //   queueName: 'lambda-perf-snapstart-deployer',
    //   visibilityTimeout: cdk.Duration.seconds(900),
    // });

    // const invokerQueue = new sqs.Queue(this, 'LambdaPerfInvokerQueue', {
    //   queueName: 'lambda-perf-invoker',
    //   visibilityTimeout: cdk.Duration.seconds(900),
    // });

    // // Lambda Functions
    // const functionReportLogProcessorRs = new lambda.Function(this, 'FunctionReportLogProcessorRs', {
    //   runtime: lambda.Runtime.PROVIDED_AL2023,
    //   architecture: lambda.Architecture.ARM_64,
    //   handler: 'bootstrap',
    //   code: lambda.Code.fromAsset('../target/lambda/function-report-log-processor-rs/bootstrap-function-report-log-processor-rs.zip'),
    //   environment: { TABLE_NAME: 'report-log' },
    //   memorySize: 128,
    //   timeout: cdk.Duration.seconds(900),
    // });

    // const functionTriggerDeployerRs = new lambda.Function(this, 'FunctionTriggerDeployerRs', {
    //   runtime: lambda.Runtime.PROVIDED_AL2023,
    //   architecture: lambda.Architecture.ARM_64,
    //   handler: 'bootstrap',
    //   code: lambda.Code.fromAsset('../target/lambda/function-trigger-deployer-rs/bootstrap-function-trigger-deployer-rs.zip'),
    //   environment: {
    //     TABLE_NAME: 'report-log',
    //     REPORT_LOG_PROCESSOR_ARN: functionReportLogProcessorRs.functionArn,
    //     FUNCTION_QUEUE_NAME: deployerQueue.queueName,
    //     SNAPSTART_QUEUE_NAME: snapstartDeployerQueue.queueName,
    //     SKIP_SNAPSTART: process.env.SKIP_SNAPSTART || '',
    //     ACCOUNT_ID: accountId,
    //   },
    // });

    // new events.Rule(this, 'FunctionTriggerDeployerSchedule', {
    //   schedule: events.Schedule.cron({ minute: '0', hour: '11', day: '*', month: '*', year: '*' }),
    //   targets: [new targets.LambdaFunction(functionTriggerDeployerRs)],
    // });

    // // Additional Lambda functions and their SQS triggers
    // const functionDeployerRs = new lambda.Function(this, 'FunctionDeployerRs', {
    //   runtime: lambda.Runtime.PROVIDED_AL2023,
    //   architecture: lambda.Architecture.ARM_64,
    //   handler: 'bootstrap',
    //   code: lambda.Code.fromAsset('../target/lambda/function-deployer-rs/bootstrap-function-deployer-rs.zip'),
    //   environment: {
    //     ACCOUNT_ID: accountId,
    //     REPORT_LOG_PROCESSOR_ARN: functionReportLogProcessorRs.functionArn,
    //     ROLE_ARN: lambdaRole.roleArn,
    //     INVOKER_QUEUE_NAME: invokerQueue.queueName,
    //   },
    // });

    // deployerQueue.grantSendMessages(functionDeployerRs);
  }
}
