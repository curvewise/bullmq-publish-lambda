import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { Queue } from 'bullmq'

import { jsonSchema as inputJsonSchema, Input } from './types/src'
import { loadConfig } from './config'

// Use separate Ajv instances to try to dodge (intermittent?) error
// "schema with key or id \"\" already exists".
const inputValidator = addFormats(
  new Ajv({ removeAdditional: true }).addSchema(inputJsonSchema),
)

const { queueName, redisUrl } = loadConfig()
let queue: Queue

function getQueue(): Queue {
  if (!queue) {
    queue = new Queue(queueName, {
      connection: { url: redisUrl },
    })
  }
  return queue
}

export async function handler(event: Input, context: any): Promise<void> {
  if (!inputValidator.validate('#/definitions/Input', event)) {
    throw Error(inputValidator.errorsText(inputValidator.errors))
  }
  const queue = getQueue()
  const { taskIdentifier, payload } = event

  console.log(`Publishing to queue with taskIdentifier ${taskIdentifier}`)
  await queue.add(taskIdentifier, payload, {
    attempts: 1,
    removeOnFail: true,
    removeOnComplete: true,
  })
  console.log(
    `Finished publishing to queue with taskIdentifier ${taskIdentifier}`,
  )
}
