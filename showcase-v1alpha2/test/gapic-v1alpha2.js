// Copyright 2018 Google LLC
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

'use strict';

const assert = require('assert');
const through2 = require('through2');

const showcaseModule = require('../src');

const FAKE_STATUS_CODE = 1;
const error = new Error();
error.code = FAKE_STATUS_CODE;

describe('EchoClient', () => {
  describe('echo', () => {
    it('invokes echo without error', done => {
      const client = new showcaseModule.v1alpha2.EchoClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const request = {};

      // Mock response
      const content = 'content951530617';
      const expectedResponse = {
        content: content,
      };

      // Mock Grpc layer
      client._innerApiCalls.echo = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.echo(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes echo with error', done => {
      const client = new showcaseModule.v1alpha2.EchoClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const request = {};

      // Mock Grpc layer
      client._innerApiCalls.echo = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.echo(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('expand', () => {
    it('invokes expand without error', done => {
      const client = new showcaseModule.v1alpha2.EchoClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const request = {};

      // Mock response
      const content = 'content951530617';
      const expectedResponse = {
        content: content,
      };

      // Mock Grpc layer
      client._innerApiCalls.expand = mockServerStreamingGrpcMethod(request, expectedResponse);

      const stream = client.expand(request);
      stream.on('data', response => {
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
      stream.on('error', err => {
        done(err);
      });

      stream.write();
    });

    it('invokes expand with error', done => {
      const client = new showcaseModule.v1alpha2.EchoClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const request = {};

      // Mock Grpc layer
      client._innerApiCalls.expand = mockServerStreamingGrpcMethod(request, null, error);

      const stream = client.expand(request);
      stream.on('data', () => {
        assert.fail();
      });
      stream.on('error', err => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        done();
      });

      stream.write();
    });
  });

  describe('chat', () => {
    it('invokes chat without error', done => {
      const client = new showcaseModule.v1alpha2.EchoClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const request = {};

      // Mock response
      const content = 'content951530617';
      const expectedResponse = {
        content: content,
      };

      // Mock Grpc layer
      client._innerApiCalls.chat = mockBidiStreamingGrpcMethod(request, expectedResponse);

      const stream = client.chat().on('data', response => {
        assert.deepStrictEqual(response, expectedResponse);
        done();
      }).on('error', err => {
        done(err);
      });

      stream.write(request);
    });

    it('invokes chat with error', done => {
      const client = new showcaseModule.v1alpha2.EchoClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const request = {};

      // Mock Grpc layer
      client._innerApiCalls.chat = mockBidiStreamingGrpcMethod(request, null, error);

      const stream = client.chat().on('data', () => {
        assert.fail();
      }).on('error', err => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        done();
      });

      stream.write(request);
    });
  });

  describe('wait', () => {
    it('invokes wait without error', done => {
      const client = new showcaseModule.v1alpha2.EchoClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const responseDelay = {};
      const request = {
        responseDelay: responseDelay,
      };

      // Mock response
      const content = 'content951530617';
      const expectedResponse = {
        content: content,
      };

      // Mock Grpc layer
      client._innerApiCalls.wait = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.wait(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes wait with error', done => {
      const client = new showcaseModule.v1alpha2.EchoClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const responseDelay = {};
      const request = {
        responseDelay: responseDelay,
      };

      // Mock Grpc layer
      client._innerApiCalls.wait = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.wait(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('pagination', () => {
    it('invokes pagination without error', done => {
      const client = new showcaseModule.v1alpha2.EchoClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const maxResponse = 617902268;
      const request = {
        maxResponse: maxResponse,
      };

      // Mock response
      const nextPageToken = '';
      const responsesElement = 640301041;
      const responses = [responsesElement];
      const expectedResponse = {
        nextPageToken: nextPageToken,
        responses: responses,
      };

      // Mock Grpc layer
      client._innerApiCalls.pagination = (actualRequest, options, callback) => {
        assert.deepStrictEqual(actualRequest, request);
        callback(null, expectedResponse.responses);
      };

      client.pagination(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse.responses);
        done();
      });
    });

    it('invokes pagination with error', done => {
      const client = new showcaseModule.v1alpha2.EchoClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const maxResponse = 617902268;
      const request = {
        maxResponse: maxResponse,
      };

      // Mock Grpc layer
      client._innerApiCalls.pagination = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.pagination(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

});

function mockSimpleGrpcMethod(expectedRequest, response, error) {
  return function(actualRequest, options, callback) {
    assert.deepStrictEqual(actualRequest, expectedRequest);
    if (error) {
      callback(error);
    } else if (response) {
      callback(null, response);
    } else {
      callback(null);
    }
  };
}

function mockServerStreamingGrpcMethod(expectedRequest, response, error) {
  return actualRequest => {
    assert.deepStrictEqual(actualRequest, expectedRequest);
    const mockStream = through2.obj((chunk, enc, callback) => {
      if (error) {
        callback(error);
      }
      else {
        callback(null, response);
      }
    });
    return mockStream;
  };
}

function mockBidiStreamingGrpcMethod(expectedRequest, response, error) {
  return () => {
    const mockStream = through2.obj((chunk, enc, callback) => {
      assert.deepStrictEqual(chunk, expectedRequest);
      if (error) {
        callback(error);
      }
      else {
        callback(null, response);
      }
    });
    return mockStream;
  }
}
