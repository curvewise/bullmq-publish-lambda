#!/bin/bash

set -eux -o pipefail

mkdir -p lambda-build/contents lambdas

# Exclude .bin to avoid resolving symlinks in `.bin` which `npm prune` will
# complain about later.
rsync \
    -ac \
    --exclude ".bin" \
    --exclude "config/local*.yml" \
    package.json \
    package-lock.json \
    dist/ \
    config \
    node_modules \
    lambda-build/contents

cd lambda-build/contents

npm prune --omit=dev
rm package.json package-lock.json

zip -r ../../lambdas/bullmq-publish.zip .
