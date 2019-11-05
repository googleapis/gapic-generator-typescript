// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as assert from 'assert';
import * as showcase from 'showcase';

import * as grpc from '@grpc/grpc-js'; // to create credentials for local Showcase server

interface ClientOptions{
  [name: string] : Object,
  servicePath: string,
  port: number
}
interface Options{
  [name: string] : Object
}
// Fake auth client for fallback
const authStub = {
  getRequestHeaders() {
    return {Authorization: 'Bearer SOME_TOKEN'};
  },
};
// Finally, using mocha!
describe('Showcase tests', () => {
  if (typeof window !== 'undefined') {
    describe('browser library works', () => {
      testShowcase({browser: true});
    });
  } else {
    describe('grpc-fallback works', () => {
      testShowcase({fallback: true});
    });
    describe('@grpc/grpc-js works', () => {
      testShowcase({grpcJs: true});
    });
    describe('grpc works', () => {
      testShowcase({grpc: true});
    });
  }
});

async function testShowcase(opts: Options) {
  opts = opts || {};
  const clientOptions: ClientOptions = {servicePath: 'localhost', port: 7469};
  let hasStreaming = true;
  clientOptions.servicePath = 'localhost';
  clientOptions.port = 7469;
  if (opts.browser) {
    clientOptions.protocol = 'http';
    clientOptions.servicePath = 'localhost';
    clientOptions.port = 1337;
    clientOptions.auth = authStub;
    hasStreaming = false;
  } else if (opts.fallback) {
    clientOptions.protocol = 'http';
    clientOptions.servicePath = 'localhost';
    clientOptions.port = 1337;
    clientOptions.auth = authStub;
    clientOptions.fallback = true;
    hasStreaming = false;
  } else if (opts.grpcJs) {
    const grpc = require('@grpc/grpc-js');
    clientOptions.sslCreds = grpc.credentials.createInsecure();
    clientOptions.grpc = grpc;
  } else if (opts.grpc) {
    const grpc = require('grpc');
    clientOptions.sslCreds = grpc.credentials.createInsecure();
    clientOptions.grpc = grpc;
  } else {
    throw new Error('Wrong options passed!');
  }
  const client = new showcase.v1beta1.EchoClient(clientOptions);
  runTest(client, {hasStreaming});
}

function runTest(client: showcase.v1beta1.EchoClient, opts: Options) {
  opts = opts || {};
  testEcho(client);
  if (opts.hasStreaming) {
    testExpand(client);
    testCollect(client);
    testChat(client);
  }
  testPagedExpand(client);
  testWait(client);
}

// Set of functions to tests all showcase methods
async function testEcho(client: showcase.v1beta1.EchoClient) {
  // TODO: cannot do showcase.EchoClient
  const request = {
    content: 'test',
  };
  const [response] = await client.echo(request);
  assert.deepStrictEqual(request.content, response.content);
}

async function testExpand(client: showcase.v1beta1.EchoClient) {
  const words = ['nobody', 'ever', 'reads', 'test', 'input'];
  const request = {
    content: words.join(' '),
  };
  const result = await new Promise((resolve: Function, reject: Function) => {
    const stream = client.expand(request);
    const result: string[] = [];
    stream.on('data', response => {
      result.push(response.content);
    });
    stream.on('end', () => {
      resolve(result);
    });
    stream.on('error', err => {
      reject(err);
    });
  });
  assert.deepStrictEqual(words, result);
}

async function testChat(client: showcase.v1beta1.EchoClient) {
  const words = [
    'nobody',
    'ever',
    'reads',
    'test',
    'input',
    'especially',
    'this',
    'one',
  ];
  const result = await new Promise((resolve: Function, reject: Function) => {
    const result: string[] = [];
    const stream = client.chat();
    stream.on('data', response => {
      result.push(response.content);
    });
    stream.on('end', () => {
      resolve(result);
    });
    stream.on('error', err => {
      reject(err);
    });
    for (const word of words) {
      stream.write({ content: word });
    }
    stream.end();
  });
  assert.deepStrictEqual(result, words);
}

async function testCollect(client: showcase.v1beta1.EchoClient) {
  const words = ['nobody', 'ever', 'reads', 'test', 'input'];
  const result = await new Promise((resolve: Function, reject: Function) => {
    const stream = client.collect((err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
    for (const word of words) {
      const request = { content: word };
      stream.write(request);
    }
    stream.end();
  });
  const expectedresponse = { content: words.join(' ') };
  assert.deepStrictEqual(result, expectedresponse);
}

async function testWait(client: showcase.v1beta1.EchoClient) {
  const request = {
    ttl: {
      seconds: 5,
      nanos: 0,
    },
    success: {
      content: 'done',
    },
  };
  const [operation, rawResponse] = await client.wait(request);
  assert(rawResponse!.name !== '');
  assert(rawResponse!.done === false);
  const [response] = await operation.promise();
  assert.deepStrictEqual(response.content, request.success.content);
}

async function testPagedExpand(client: showcase.v1beta1.EchoClient) {
  const words = ['nobody', 'ever', 'reads', 'test', 'input'];
  const request = {
    content: words.join(' '),
    pageSize: 2,
  };
  const [response] = await client.pagedExpand(request);
  const expectedResponse = response.map(r => r.content);
  assert.deepStrictEqual(expectedResponse, words);
}
