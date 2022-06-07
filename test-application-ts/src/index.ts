// Copyright 2020 Google LLC
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
import {describe, it} from 'mocha';

interface ClientOptions{
  [name: string]: {};
  servicePath: string;
  port: number;
}
interface Options {
  [name: string]: {};
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
  testPagedExpandAsync(client);
  testWait(client);
  testCheckWaitProgress(client);
}

// Set of functions to tests all showcase methods
function testEcho(client: showcase.v1beta1.EchoClient) {
  it('echo', async () => {
    const request = {
      content: 'test',
    };
    const [response] = await client.echo(request);
    assert.deepStrictEqual(request.content, response.content);
  });
}

function testExpand(client: showcase.v1beta1.EchoClient) {
  it('expand', async () => {
    const words = ['nobody', 'ever', 'reads', 'test', 'input'];
    const request = {
      content: words.join(' '),
    };
    const result = await new Promise((resolve, reject) => {
      const stream = client.expand(request);
      const result: string[] = [];
      stream.on('data', response => {
        result.push(response.content);
      });
      stream.on('end', () => {
        resolve(result);
      });
      stream.on('error', reject);
    });
    assert.deepStrictEqual(words, result);
  });
}

function testPagedExpand(client: showcase.v1beta1.EchoClient) {
  it('pagedExpandAsync', async () => {
    const words = ['nobody', 'ever', 'reads', 'test', 'input'];
    const request = {
      content: words.join(' '),
      pageSize: 2,
    };
    const [response] = await client.pagedExpand(request);
    const result = response.map(r => r.content);
    assert.deepStrictEqual(words, result);
  });
}

function testPagedExpandAsync(client: showcase.v1beta1.EchoClient) {
  it('pagedExpandAsync', async () => {
    const words = ['nobody', 'ever', 'reads', 'test', 'input'];
    const request = {
      content: words.join(' '),
      pageSize: 2,
    };
    const iterable = client.pagedExpandAsync(request);
    const result: string[] = [];
    for await (const resource of iterable) {
      result.push(resource.content!);
    }
    assert.deepStrictEqual(words, result);
  });
}

function testCollect(client: showcase.v1beta1.EchoClient) {
  it('collect', async () => {
    const words = ['nobody', 'ever', 'reads', 'test', 'input'];
    const result = await new Promise((resolve, reject) => {
      const stream = client.collect((err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
      for (const word of words) {
        const request = {content: word};
        stream.write(request);
      }
      stream.end();
    });
    const expectedResult = {content: words.join(' ')};
    assert.deepStrictEqual(result, expectedResult);
  });
}

function testChat(client: showcase.v1beta1.EchoClient) {
  it('chat', async () => {
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
    const result = await new Promise((resolve, reject) => {
      const result: string[] = [];
      const stream = client.chat();
      stream.on('data', response => {
        result.push(response.content);
      });
      stream.on('end', () => {
        resolve(result);
      });
      stream.on('error', reject);
      for (const word of words) {
        stream.write({content: word});
      }
      stream.end();
    });
    assert.deepStrictEqual(result, words);
  });
}

function testWait(client: showcase.v1beta1.EchoClient) {
  it('wait', async function() {
    this.timeout(10000);
    const request = {
      ttl: {
        seconds: 5,
        nanos: 0,
      },
      success: {
        content: 'done',
      },
    };
    const [operation] = await client.wait(request);
    const [response] = await operation.promise();
    assert.deepStrictEqual(response.content, request.success.content);
  });
}

function testCheckWaitProgress(client: showcase.v1beta1.EchoClient) {
  it('checkWaitProgress', async function() {
    this.timeout(10000);
    const request = {
      ttl: {
        seconds: 5,
        nanos: 0,
      },
      success: {
        content: 'done',
      },
    };
    const [operation] = await client.wait(request);
    const decodedOperation = await client.checkWaitProgress(operation.name!);
    assert.deepStrictEqual(decodedOperation.name, operation.name);
    assert(decodedOperation.metadata);
    assert(decodedOperation.result);
    const [response, metadata, rawOperation] = await decodedOperation.promise();
    assert.deepStrictEqual(response.content, request.success.content);
    assert(metadata);
    assert(rawOperation.done);
  });
}
