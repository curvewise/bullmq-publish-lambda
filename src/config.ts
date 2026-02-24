import Ajv from 'ajv'
import * as configJsonSchema from './generated/config.schema.json'
import type { Config } from './config.schema'
const config: any = require('config')

export function loadConfig(): Config {
  const configValidator = new Ajv({
    removeAdditional: true,
    coerceTypes: true,
  }).addSchema(configJsonSchema)

  if (!configValidator.validate('#/definitions/Config', config)) {
    throw Error(configValidator.errorsText(configValidator.errors))
  }

  return config as Config
}
