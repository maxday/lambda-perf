import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { createRole } from './role';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';

interface LambdaPerfStackProps extends cdk.StackProps {
  skipSnapstart: string;
  githubAuthToken: string;
  lambdaPerfEnv: string;
}

export class LambdaPerfStack extends Stack {

  attachCronScheduleIfNeeded = (env: string, hour: number, lambdaFunction: lambda.Function, ruleName: string) => {
    if (env === 'production') {
      const rule = new events.Rule(this, ruleName, {
        schedule: events.Schedule.cron({
          minute: '0',
          hour: hour.toString(),
          day: '*',
          month: '*',
        })
      });
      rule.addTarget(new targets.LambdaFunction(lambdaFunction));
    }
  }

  constructor(scope: Construct, id: string, props: LambdaPerfStackProps) {
    super(scope, id, props);

    const region = this.region;
    const accountId = this.account;

    // S3 Deployment Bucket
    new s3.Bucket(this, 'LambdaPerfBucket', {
      bucketName: `lambda-perf-${region}`,
    });

    const lambdaRoleArn = createRole(this);

    // SQS Queues
    const deployerQueue = new sqs.Queue(this, 'LambdaPerfDeployerQueue', {
      queueName: 'lambda-perf-deployer',
      visibilityTimeout: cdk.Duration.seconds(900),
    });

    const snapstartDeployerQueue = new sqs.Queue(this, 'LambdaPerfSnapstartDeployerQueue', {
      queueName: 'lambda-perf-snapstart-deployer',
      visibilityTimeout: cdk.Duration.seconds(900),
    });

    const invokerQueue = new sqs.Queue(this, 'LambdaPerfInvokerQueue', {
      queueName: 'lambda-perf-invoker',
      visibilityTimeout: cdk.Duration.seconds(900),
    });

    // Lambda Functions
    const functionReportLogProcessorRs = new lambda.Function(this, 'FunctionReportLogProcessorRs', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset('../target/lambda/function-report-log-processor-rs/bootstrap-function-report-log-processor-rs.zip'),
      environment: { TABLE_NAME: 'report-log' },
      memorySize: 128,
      timeout: cdk.Duration.seconds(900),
      role: iam.Role.fromRoleArn(this, 'RoleFunctionReportLogProcessorRs', lambdaRoleArn),
    });

    const functionTriggerDeployerRs = new lambda.Function(this, 'FunctionTriggerDeployerRs', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset('../target/lambda/function-trigger-deployer-rs/bootstrap-function-trigger-deployer-rs.zip'),
      environment: {
        TABLE_NAME: 'report-log',
        REPORT_LOG_PROCESSOR_ARN: functionReportLogProcessorRs.functionArn,
        FUNCTION_QUEUE_NAME: deployerQueue.queueName,
        SNAPSTART_QUEUE_NAME: snapstartDeployerQueue.queueName,
        SKIP_SNAPSTART: props.skipSnapstart,
        ACCOUNT_ID: accountId,
      },
      timeout: cdk.Duration.seconds(60),
      role: iam.Role.fromRoleArn(this, 'RoleFunctionTriggerDeployerRs', lambdaRoleArn),
    });

    this.attachCronScheduleIfNeeded(props.lambdaPerfEnv, 11, functionTriggerDeployerRs, 'FunctionTriggerDeployerSchedule');

    const functionDeployerRs = new lambda.Function(this, 'FunctionDeployerRs', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset('../target/lambda/function-deployer-rs/bootstrap-function-deployer-rs.zip'),
      environment: {
        ACCOUNT_ID: accountId,
        REPORT_LOG_PROCESSOR_ARN: functionReportLogProcessorRs.functionArn,
        ROLE_ARN: lambdaRoleArn,
        INVOKER_QUEUE_NAME: invokerQueue.queueName,
      },
      timeout: cdk.Duration.seconds(900),
      role: iam.Role.fromRoleArn(this, 'RoleFunctionDeployerRs', lambdaRoleArn),
    });

    deployerQueue.grantSendMessages(functionDeployerRs);

    functionDeployerRs.addEventSource(
      new lambdaEventSources.SqsEventSource(deployerQueue, {
        batchSize: 5,
        maxBatchingWindow: cdk.Duration.seconds(30),
      })
    );

    const functionSnapstartDeployerRs = new lambda.Function(this, 'FunctionSnapstartDeployerRs', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset('../target/lambda/function-deployer-rs/bootstrap-function-deployer-rs.zip'),
      environment: {
        ACCOUNT_ID: accountId,
        REPORT_LOG_PROCESSOR_ARN: functionReportLogProcessorRs.functionArn,
        ROLE_ARN: lambdaRoleArn,
        INVOKER_QUEUE_NAME: invokerQueue.queueName,
      },
      timeout: cdk.Duration.seconds(900),
      role: iam.Role.fromRoleArn(this, 'RoleFunctionSnapstartDeployerRs', lambdaRoleArn),
    });

    snapstartDeployerQueue.grantSendMessages(functionSnapstartDeployerRs);

    functionSnapstartDeployerRs.addEventSource(
      new lambdaEventSources.SqsEventSource(snapstartDeployerQueue, {
        batchSize: 2,
        maxBatchingWindow: cdk.Duration.seconds(120),
        maxConcurrency: 2,
      })
    );

    const functionInvokerRs = new lambda.Function(this, 'FunctionInvokerRs', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset('../target/lambda/function-invoker-rs/bootstrap-function-invoker-rs.zip'),
      environment: {
        ACCOUNT_ID: cdk.Aws.ACCOUNT_ID,
        ROLE_ARN: lambdaRoleArn,
      },
      timeout: cdk.Duration.seconds(900),
      role: iam.Role.fromRoleArn(this, 'RoleFunctionInvokerRs', lambdaRoleArn),
    });

    invokerQueue.grantConsumeMessages(functionInvokerRs);

    functionInvokerRs.addEventSource(
      new lambdaEventSources.SqsEventSource(invokerQueue, {
        batchSize: 3,
        maxBatchingWindow: cdk.Duration.seconds(30),
      })
    );

    const resultBuilder = new lambda.Function(this, 'ResultBuilder', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'app.handler',
      code: lambda.Code.fromAsset('../result-builder'),
      environment: {
        GH_AUTH_TOKEN: props.githubAuthToken,
        LAMBDA_PERF_ENV: props.lambdaPerfEnv,
      },
      timeout: cdk.Duration.seconds(60),
      role: iam.Role.fromRoleArn(this, 'RoleFunctionResultBuilder', lambdaRoleArn),
    });
    this.attachCronScheduleIfNeeded(props.lambdaPerfEnv, 14, resultBuilder, 'ScheduleRule');
  }
}
