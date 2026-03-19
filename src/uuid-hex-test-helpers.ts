import { parse as uuidParse, v4 as uuidv4 } from 'uuid'

export function uuidHex(): string {
  return Buffer.from(uuidParse(uuidv4())).toString('hex')
}
