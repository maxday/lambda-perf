import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export const createRole = (scope: Construct): string => {
    const region = cdk.Aws.REGION;
    const accountId = cdk.Aws.ACCOUNT_ID;
    const policyStatements: iam.PolicyStatementProps[] = [
        {
            effect: iam.Effect.ALLOW,
            actions: ['logs:CreateLogGroup'],
            resources: [
                `arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/LambdaPerfStack-*`,
                `arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/lambda-perf-*`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['logs:CreateLogStream'],
            resources: [
                `arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/LambdaPerfStack-*`,
                `arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/lambda-perf-*`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['logs:DeleteLogGroup'],
            resources: [
                `arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/LambdaPerfStack-*`,
                `arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/lambda-perf-*`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['logs:PutLogEvents'],
            resources: [
                `arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/LambdaPerfStack-*`,
                `arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/lambda-perf-*:log-stream:*`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['lambda:CreateFunction'],
            resources: [
                `arn:aws:lambda:${region}:${accountId}:function:lambda-perf-*`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['lambda:DeleteFunction'],
            resources: [
                `arn:aws:lambda:${region}:${accountId}:function:lambda-perf-*`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['lambda:InvokeFunction'],
            resources: [
                `arn:aws:lambda:${region}:${accountId}:function:lambda-perf-*`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['lambda:AddPermission'],
            resources: [
                `arn:aws:lambda:${region}:${accountId}:function:LambdaPerfStack-FunctionReportLogProcessorRs*`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['lambda:RemovePermission'],
            resources: [
                `arn:aws:lambda:${region}:${accountId}:function:LambdaPerfStack-FunctionReportLogProcessorRs*`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['logs:PutSubscriptionFilter'],
            resources: [
                `arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/lambda-perf-*`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['lambda:UpdateFunctionConfiguration'],
            resources: [
                `arn:aws:lambda:${region}:${accountId}:function:lambda-perf-*`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['lambda:GetFunction'],
            resources: [
                `arn:aws:lambda:${region}:${accountId}:function:lambda-perf-*`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['lambda:GetFunctionConfiguration'],
            resources: [
                `arn:aws:lambda:${region}:${accountId}:function:lambda-perf-*`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['lambda:GetLayerVersion'],
            resources: [
                `arn:aws:lambda:*:*:layer:*:*`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['lambda:ListVersionsByFunction'],
            resources: [
                `arn:aws:lambda:${region}:${accountId}:function:lambda-perf-*`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['lambda:PublishVersion'],
            resources: [
                `arn:aws:lambda:${region}:${accountId}:function:lambda-perf-*`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['iam:PassRole'],
            resources: [
                `arn:aws:iam::${accountId}:role/lambda-perf-role-${region}`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['s3:GetObject'],
            resources: [
                `arn:aws:s3:::lambda-perf-${region}/*`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['dynamodb:DeleteTable'],
            resources: [
                `arn:aws:dynamodb:${region}:${accountId}:table/report-log`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['dynamodb:CreateTable'],
            resources: [
                `arn:aws:dynamodb:${region}:${accountId}:table/report-log`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['dynamodb:DescribeTable'],
            resources: [
                `arn:aws:dynamodb:${region}:${accountId}:table/report-log`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['dynamodb:Scan'],
            resources: [
                `arn:aws:dynamodb:${region}:${accountId}:table/report-log`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['dynamodb:PutItem'],
            resources: [
                `arn:aws:dynamodb:${region}:${accountId}:table/report-log`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['sqs:SendMessage'],
            resources: [
                `arn:aws:sqs:${region}:${accountId}:lambda-perf-deployer`,
                `arn:aws:sqs:${region}:${accountId}:lambda-perf-invoker`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['ecr:GetRepositoryPolicy'],
            resources: [
                `arn:aws:ecr:${region}:${accountId}:repository/lambda-perf`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['ecr:SetRepositoryPolicy'],
            resources: [
                `arn:aws:ecr:${region}:${accountId}:repository/lambda-perf`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['ecr:BatchGetImage'],
            resources: [
                `arn:aws:ecr:${region}:${accountId}:repository/lambda-perf`,
            ],
        },
        {
            effect: iam.Effect.ALLOW,
            actions: ['ecr:GetDownloadUrlForLayer'],
            resources: [
                `arn:aws:ecr:${region}:${accountId}:repository/lambda-perf`,
            ],
        },
    ];

    const role = new iam.Role(scope, 'LambdaPerfRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        roleName: `lambda-perf-role-${region}`,
    });

    policyStatements.forEach((policyStatement) => {
        role.addToPolicy(new iam.PolicyStatement(policyStatement));
    });

    return role.roleArn;
};
