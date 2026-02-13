import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { Queue } from 'bullmq'
import IORedis, { Redis } from 'ioredis'

import { jsonSchema as inputJsonSchema, Input } from './types/src'
import * as configJsonSchema from './generated/config.schema.json'
import { Config } from './config.schema'

// Use separate Ajv instances to try to dodge (intermittent?) error
// "schema with key or id \"\" already exists".
const inputValidator = addFormats(
  new Ajv({ removeAdditional: true }).addSchema(inputJsonSchema),
)
const configValidator = new Ajv({
  removeAdditional: true,
  coerceTypes: true,
}).addSchema(configJsonSchema)

const queue = new Queue('bullmq-worker-publish-test', {
  connection: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
})

export async function handler(event: Input, context: any): Promise<void> {
  if (!inputValidator.validate('#/definitions/Input', event)) {
    throw Error(inputValidator.errorsText(inputValidator.errors))
  }

  const { taskIdentifier, payload, taskSpec } = event

  console.log('Publishing to queue')
  await queue.add(taskIdentifier, payload, taskSpec)
  console.log('Finished publishing to queue')
}
