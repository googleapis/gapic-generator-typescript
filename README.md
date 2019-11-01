# API Client Generator for TypeScript

## Background

This tool is a TypeScript client library generator for network APIs specified
by [protocol
buffers](https://developers.google.com/protocol-buffers/) (including, but 
not limited to, [client libraries](https://www.npmjs.com/search?q=%40google-cloud) 
for Google Cloud APIs).

It can be used for any API that uses protocol buffers and follows the conventions 
described in [API Improvement Proposals](https://aip.dev/).

## Getting started

The [Showcase API](https://github.com/googleapis/gapic-showcase) is a good API to 
play with if you want to start generating your own client libraries. It has several
services, we'll use `Echo` service as an example.

### Proto definitions for Echo service

Take a look at [echo.proto](https://github.com/googleapis/gapic-showcase/blob/master/schema/google/showcase/v1beta1/echo.proto) that describes a simple
network service.

Download the proto files locally (the following examples work in Linux or macOS):

```sh
$ curl -L https://github.com/googleapis/gapic-showcase/releases/download/v0.6.0/gapic-showcase-0.6.0-protos.tar.gz | tar xz
```

### Run the generator to generate TypeScript libraries

The easiest way to get started is to use our Docker image:

```sh
$ mkdir showcase-typescript
$ docker run --rm \
  --mount type=bind,source=`pwd`/google/showcase/v1beta1,destination=/in/google/showcase/v1beta1,readonly \
  --mount type=bind,source=`pwd`/showcase-typescript,destination=/out \
  gcr.io/gapic-images/gapic-generator-typescript:latest
```

The resulting files are in `showcase-typescript` folder:

```sh
$ cd showcase-typescript
$ npm install  # install dependencies
$ npm run fix  # format the code
$ npm test     # run unit tests
```

### Start the server that serves an API

Download the pre-compiled binary for your operating system from the
[Releases](https://github.com/googleapis/gapic-showcase/releases/tag/v0.6.0) page
and start the binary, or just use Docker:

```sh
# in another window
$ docker run -p 7469:7469/tcp -p 7469:7469/udp -p 1337:1337/tcp --rm gcr.io/gapic-images/gapic-showcase:0.6.0
```

### Write your JavaScript or TypeScript code that uses the server!

Assuming you have Node.js installed and `node` binary in your path:

```sh
$ node
Welcome to Node.js v12.1.0.
Type ".help" for more information.
> const showcase = require('.')  // assuming you're in showcase-typescript
undefined
> const client = new showcase.EchoClient({ sslCreds: require('@grpc/grpc-js').credentials.createInsecure() })
undefined
> client.echo({ content: 'hello world!' }).then(console.log)
Promise { <pending> }
> [ { content: 'hello world!' }, undefined, undefined ]
```

## Want to know more?

Read the [AIPs](https://aip.dev/) or just create an issue in this repository if you have questions!
We support some cool things such as streaming RPCs, auto-pagination for certain types of RPCs, and long running operations.

## Disclaimer

**This is not an official Google product.**

