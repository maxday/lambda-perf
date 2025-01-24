import * as cdk from 'aws-cdk-lib';
import { LambdaPerfStack } from '../lib/lambda-perf-stack';

const requiredEnvVars = ['AWS_ACCOUNT_ID', 'AWS_REGION'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const app = new cdk.App();
new LambdaPerfStack(app, 'LambdaPerfStack', {
  env: { account: process.env.AWS_ACCOUNT_ID, region: process.env.AWS_REGION },
});