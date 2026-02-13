# bullmq-worker-publish-lambda

## Publishing

1. Make a version bump pull request called e.g. "RELEASE 1.1.0". Update the
   version in `package.json` and `src/types/package.json`. Include a changelog
   entry.
2. From the root of the project, run `npm ci`.
3. From `src/types`, run `npm publish`. This will publish a types package to the
   public NPM registry and then publish the lambda zipfile to GitHub Packages.
   You may need to log on to GitHub to complete the last step of this process.

If you get an authorization failure message, try deleting the `gh-release` config
folder and restarting the auth flow. On a Mac, this is at
`~/Library/Application\ Support/gh-release`.
