# Deploy runner for `qpq go:docker`. Containers deploy PRE-SYNTHESIZED
# cloud assemblies (`cdk deploy --app /assembly <stack>`), so the image needs
# only the CDK CLI — not the workspace, its npm-linked quidproquo packages, or
# any platform-specific node_modules.
#
# CDK_VERSION is passed at build time to match the workspace's aws-cdk, so the
# CLI can always read the assembly schema the host synthesized.
FROM node:24-slim

ARG CDK_VERSION=2
RUN npm install -g aws-cdk@${CDK_VERSION}

WORKDIR /work
