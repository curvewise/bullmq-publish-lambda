// Vendored in from 'graphile-worker'.
export interface TaskSpec {
  /**
   * The queue to run this task under (only specify if you want jobs in this
   * queue to run serially). (Default: null)
   */
  queueName?: string
  /**
   * A Date to schedule this task to run in the future. (Default: now)
   */
  runAt?: Date
  /**
   * Jobs are executed in numerically ascending order of priority (jobs with a
   * numerically smaller priority are run first). (Default: 0)
   */
  priority?: number
  /**
   * How many retries should this task get? (Default: 25)
   */
  maxAttempts?: number
  /**
   * Unique identifier for the job, can be used to update or remove it later if
   * needed. (Default: null)
   */
  jobKey?: string
  /**
   * Modifies the behavior of `jobKey`; when 'replace' all attributes will be
   * updated, when 'preserve_run_at' all attributes except 'run_at' will be
   * updated, when 'unsafe_dedupe' a new job will only be added if no existing
   * job (including locked jobs and permanently failed jobs) with matching job
   * key exists. (Default: 'replace')
   */
  jobKeyMode?: 'replace' | 'preserve_run_at' | 'unsafe_dedupe'
  /**
   * Flags for the job, can be used to dynamically filter which jobs can and
   * cannot run at runtime. (Default: null)
   */
  flags?: string[]
}

export interface Input {
  taskIdentifier: string
  payload?: unknown
  taskSpec?: TaskSpec
}
