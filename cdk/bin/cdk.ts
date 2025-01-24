import * as cdk from 'aws-cdk-lib';
import { LambdaPerfStack } from '../lib/lambda-perf-stack';

const requiredEnvVars = ['AWS_ACCOUNT_ID', 'AWS_REGION', 'SKIP_SNAPSTART', 'GITHUB_AUTH_TOKEN', 'LAMBDA_PERF_ENV'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const app = new cdk.App();
new LambdaPerfStack(app, 'LambdaPerfStack', {
  env: { account: process.env.AWS_ACCOUNT_ID, region: process.env.AWS_REGION },
  skipSnapstart: process.env.SKIP_SNAPSTART!!,
  githubAuthToken: process.env.GITHUB_AUTH_TOKEN!!,
  lambdaPerfEnv: process.env.LAMBDA_PERF_ENV!!,
});