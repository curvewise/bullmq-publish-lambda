export interface Config {
  db: {
    region: string
    hostname: string
    port: number
    username: string
    databaseName: string
  }
  awsProfile?: string
}
