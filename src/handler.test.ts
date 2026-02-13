import { strict as assert } from 'assert'
import { GenericContainer } from 'testcontainers'
import { Queue } from 'bullmq'

describe('BullMQ enqueue', function () {
  this.timeout(20000)

  let container: any
  let queue: Queue
  let redisUrl: string

  before(async () => {
    container = await new GenericContainer('redis:7')
      .withExposedPorts(6379)
      .start()

    const port = container.getMappedPort(6379)
    redisUrl = `redis://localhost:${port}`

    queue = new Queue('test-queue', {
      connection: { url: redisUrl },
    })
  })

  after(async () => {
    await queue.close()
    await container.stop()
  })

  it('adds a job to the queue', async () => {
    await queue.add('my-task', { foo: 'bar' })

    const jobs = await queue.getJobs(['waiting'])
    assert.equal(jobs.length, 1)
    assert.equal(jobs[0].name, 'my-task')
    assert.deepEqual(jobs[0].data, { foo: 'bar' })
  })
})
