import { Pool } from 'pg'

export async function resetGraphileWorkerDatabase(pgPool: Pool): Promise<void> {
  await pgPool.query(`DROP SCHEMA graphile_worker CASCADE;`)
}
