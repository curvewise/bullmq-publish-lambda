import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { Queue } from 'bullmq'

import { jsonSchema as inputJsonSchema, Input } from './types/src'
import * as configJsonSchema from './generated/config.schema.json'
import { Config } from './config.schema'
const config: any = require('config')

// Use separate Ajv instances to try to dodge (intermittent?) error
// "schema with key or id \"\" already exists".
const inputValidator = addFormats(
  new Ajv({ removeAdditional: true }).addSchema(inputJsonSchema),
)
const configValidator = new Ajv({
  removeAdditional: true,
  coerceTypes: true,
}).addSchema(configJsonSchema)

if (!configValidator.validate('#/definitions/Config', config)) {
  throw Error(configValidator.errorsText(configValidator.errors))
}

const validatedConfig = config as Config

const queueName = process.env.QUEUE_NAME ?? validatedConfig.queueName

if (!queueName) {
  throw Error('QUEUE_NAME not configured')
}

const redisUrl = process.env.REDIS_URL ?? validatedConfig.redisUrl

if (!redisUrl) {
  throw Error('REDIS_URL not configured')
}

export async function handler(event: Input, context: any): Promise<void> {
  if (!inputValidator.validate('#/definitions/Input', event)) {
    throw Error(inputValidator.errorsText(inputValidator.errors))
  }

  const queue = new Queue(queueName, {
    connection: {
      url: redisUrl,
    },
  })

  const { taskIdentifier, payload } = event

  console.log('Publishing to queue')
  await queue.add(taskIdentifier, payload)
  console.log('Finished publishing to queue')
}
