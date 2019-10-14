import * as assert from 'assert';
import * as showcase from 'showcase';

import * as grpc from '@grpc/grpc-js'; // to create credentials for local Showcase server

main().catch(err => {
  console.error('Error:', err);
});

async function main() {
  const clientOptions = {
    sslCreds: grpc.credentials.createInsecure(),
    grpc,
    servicePath: 'localhost',
    port: 7469,
  };

  const client = new showcase.EchoClient(clientOptions);
  await testEcho(client);
  await testExpand(client);
  await testChat(client);
  await testCollect(client);
  await testWait(client);
  await testPagedExpand(client);
  console.log('it works! ');
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
