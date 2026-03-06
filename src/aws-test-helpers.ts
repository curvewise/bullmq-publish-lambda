import path from 'path'
import {
  LambdaClient,
  PutFunctionConcurrencyCommand,
} from '@aws-sdk/client-lambda'
import { createFunction, deleteFunction } from 'werkit'

export const AWS_REGION = 'us-east-1'
export const LAMBDA_ROLE =
  'arn:aws:iam::312760052655:role/publish-lambda-test'
export const SCRATCH_BUCKET = 'goldilocks-scratch-test'
export const TIMEOUT_SECONDS = 10
export const MEMORY_SIZE_MB = 256
export const RUNTIME = 'nodejs24.x'

const localPathToZipfile = path.resolve(
  __dirname,
  '..',
  'lambdas',
  'bullmq-publish.zip',
)

export async function createLambdaFunction(
  functionName: string,
  envVars: { redisUrl: string; queueName: string },
): Promise<void> {
  await createFunction({
    region: AWS_REGION,
    runtime: RUNTIME,
    functionName,
    handler: 'handler.handler',
    role: LAMBDA_ROLE,
    localPathToZipfile,
    s3CodeBucket: SCRATCH_BUCKET,
    timeoutSeconds: TIMEOUT_SECONDS,
    memorySizeMb: MEMORY_SIZE_MB,
    verbose: true,
    envVars: {
      REDIS_URL: envVars.redisUrl,
      QUEUE_NAME: envVars.queueName,
    },
  })
}

export async function setReservedConcurrency(
  functionName: string,
  concurrentExecutions: number,
): Promise<void> {
  await new LambdaClient({ region: AWS_REGION }).send(
    new PutFunctionConcurrencyCommand({
      FunctionName: functionName,
      ReservedConcurrentExecutions: concurrentExecutions,
    }),
  )
}

export async function deleteLambdaFunction(
  functionName: string,
): Promise<void> {
  await deleteFunction({ region: AWS_REGION, functionName })
}
