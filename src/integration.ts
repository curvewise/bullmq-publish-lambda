import assert from 'assert'
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda'
import chai, { expect } from 'chai'
import dirtyChai from 'dirty-chai'
import { Queue, Worker } from 'bullmq'

import {
  AWS_REGION,
  ENV_VARS,
  createLambdaFunction,
  deleteLambdaFunction,
  setReservedConcurrency,
} from './aws-test-helpers'
import { Input } from './types'
import { uuidHex } from './uuid-hex-test-helpers'

chai.use(dirtyChai)

if (process.env.AWS_PROFILE !== 'curvewise') {
  throw Error('Expected the curvewise AWS profile')
}

// For faster iteration on the integration test using an existing Lambda
// deployment, set `shouldCleanupLambda` to false. Then on the next iteration,
// set `shouldDeployLambda` to true and reassign `deploymentEnvironment` below.
const shouldDeployLambda = true
const shouldCleanupLambda = true

// For a stress test, increase this from 10 to 10000.
const numRequests = 10
const redisUrl = ENV_VARS.REDIS_URL

describe('bullmq-publish Lambda', () => {
  const taskIdentifier = 'bullmq-worker-publish-test'

  let queue: Queue

  before(async function () {
    this.timeout(30000)

    queue = new Queue(taskIdentifier, {
      connection: { url: process.env.REDIS_URL },
    })

    console.log(`Draining existing jobs from ${taskIdentifier}`)
    await queue.drain(true) // remove waiting + delayed
    await queue.clean(0, 0, 'completed')
    await queue.clean(0, 0, 'failed')
  })

  const uniqueFunctionName = `bullmq-publish-test-${uuidHex()}`

  let lambdaFunctionCreated = false
  before('create the unique lambda function', async function () {
    this.timeout('10m')
    if (shouldDeployLambda) {
      console.error(`Using unique function name ${uniqueFunctionName}`)
      await createLambdaFunction(uniqueFunctionName)
      if (numRequests > 20) {
        await setReservedConcurrency(uniqueFunctionName, 20)
      }
      lambdaFunctionCreated = true
    }
  })

  after('delete the unique lambda function', async function () {
    if (lambdaFunctionCreated && shouldCleanupLambda) {
      await deleteLambdaFunction(uniqueFunctionName)
    }
  })

  after(async () => {
    await queue.close()
  })

  const payload = { 'this-is': ['my', 'payload', uniqueFunctionName] }

  beforeEach('send a message to the lambda function', async function () {
    this.timeout('10m')

    const lambdaPayload: Input = { taskIdentifier, payload }
    const lambdaClient = new LambdaClient({ region: AWS_REGION })
    const command = new InvokeCommand({
      FunctionName: uniqueFunctionName,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(lambdaPayload),
    })

    for (let i = 0; i < numRequests; i++) {
      const response = await lambdaClient.send(command)

      if (response.StatusCode !== 200) {
        console.error(JSON.stringify(response, undefined, 2))
      }
      expect(response.StatusCode).to.equal(200)
      assert.ok(response.Payload)

      if (response.FunctionError) {
        const payload = JSON.parse(Buffer.from(response.Payload).toString())
        console.error('Lambda error:')
        console.error(JSON.stringify(payload, null, 2))
      }

      expect(response).not.to.have.property('FunctionError')
      console.log(`Invoked lambda ${i + 1} of ${numRequests}`)
    }
  })

  it('should have been processed', async function () {
    this.timeout(120000)

    let completed = 0

    const worker = new Worker(
      taskIdentifier,
      async job => {
        expect(job.data).to.deep.equal(payload)
      },
      { connection: { url: redisUrl } },
    )

    await new Promise<void>((resolve, reject) => {
      worker.on('completed', () => {
        completed++
        if (completed === numRequests) resolve()
      })

      worker.on('failed', (_job, err) => {
        reject(err)
      })

      worker.on('error', reject)
    })

    await worker.close()

    expect(completed).to.equal(numRequests)
  })
})
