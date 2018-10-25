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

const gapicConfig = require('./echo_client_config');
const gax = require('google-gax');
const merge = require('lodash.merge');
const path = require('path');

const VERSION = require('../../package.json').version;

/**
 * This service is used showcase the four main types of rpcs - unary, server
 * side streaming, client side streaming, and bidirectional streaming. This
 * service also exposes methods that explicitly implement server delay, and
 * paginated calls.
 *
 * @class
 * @memberof v1alpha2
 */
class EchoClient {
  /**
   * Construct an instance of EchoClient.
   *
   * @param {object} [options] - The configuration object. See the subsequent
   *   parameters for more details.
   * @param {object} [options.credentials] - Credentials object.
   * @param {string} [options.credentials.client_email]
   * @param {string} [options.credentials.private_key]
   * @param {string} [options.email] - Account email address. Required when
   *     using a .pem or .p12 keyFilename.
   * @param {string} [options.keyFilename] - Full path to the a .json, .pem, or
   *     .p12 key downloaded from the Google Developers Console. If you provide
   *     a path to a JSON file, the projectId option below is not necessary.
   *     NOTE: .pem and .p12 require you to specify options.email as well.
   * @param {number} [options.port] - The port on which to connect to
   *     the remote host.
   * @param {string} [options.projectId] - The project ID from the Google
   *     Developer's Console, e.g. 'grape-spaceship-123'. We will also check
   *     the environment variable GCLOUD_PROJECT for your project ID. If your
   *     app is running in an environment which supports
   *     {@link https://developers.google.com/identity/protocols/application-default-credentials Application Default Credentials},
   *     your project ID will be detected automatically.
   * @param {function} [options.promise] - Custom promise module to use instead
   *     of native Promises.
   * @param {string} [options.servicePath] - The domain name of the
   *     API remote host.
   */
  constructor(opts) {
    this._descriptors = {};

    // Ensure that options include the service address and port.
    opts = Object.assign(
      {
        clientConfig: {},
        port: this.constructor.port,
        servicePath: this.constructor.servicePath,
      },
      opts
    );

    // Create a `gaxGrpc` object, with any grpc-specific options
    // sent to the client.
    opts.scopes = this.constructor.scopes;
    const gaxGrpc = new gax.GrpcClient(opts);

    // Save the auth object to the client, for use by other methods.
    this.auth = gaxGrpc.auth;

    // Determine the client header string.
    const clientHeader = [
      `gl-node/${process.version}`,
      `grpc/${gaxGrpc.grpcVersion}`,
      `gax/${gax.version}`,
      `gapic/${VERSION}`,
    ];
    if (opts.libName && opts.libVersion) {
      clientHeader.push(`${opts.libName}/${opts.libVersion}`);
    }

    // Load the applicable protos.
    const protos = merge(
      {},
      gaxGrpc.loadProto(
        path.join(__dirname, '..', '..', 'protos'),
        'google/showcase/v1alpha2/echo.proto'
      )
    );

    // Some of the methods on this service return "paged" results,
    // (e.g. 50 results at a time, with tokens to get subsequent
    // pages). Denote the keys used for pagination and results.
    this._descriptors.page = {
      pagination: new gax.PageDescriptor(
        'pageToken',
        'nextPageToken',
        'responses'
      ),
    };

    // Some of the methods on this service provide streaming responses.
    // Provide descriptors for these.
    this._descriptors.stream = {
      expand: new gax.StreamDescriptor(gax.StreamType.SERVER_STREAMING),
      collect: new gax.StreamDescriptor(gax.StreamType.CLIENT_STREAMING),
      chat: new gax.StreamDescriptor(gax.StreamType.BIDI_STREAMING),
    };

    // Put together the default options sent with requests.
    const defaults = gaxGrpc.constructSettings(
      'google.showcase.v1alpha2.Echo',
      gapicConfig,
      opts.clientConfig,
      {'x-goog-api-client': clientHeader.join(' ')}
    );

    // Set up a dictionary of "inner API calls"; the core implementation
    // of calling the API is handled in `google-gax`, with this code
    // merely providing the destination and request information.
    this._innerApiCalls = {};

    // Put together the "service stub" for
    // google.showcase.v1alpha2.Echo.
    const echoStub = gaxGrpc.createStub(
      protos.google.showcase.v1alpha2.Echo,
      opts
    );

    // Iterate over each of the methods that the service provides
    // and create an API call method for each.
    const echoStubMethods = [
      'echo',
      'expand',
      'collect',
      'chat',
      'wait',
      'pagination',
    ];
    for (const methodName of echoStubMethods) {
      this._innerApiCalls[methodName] = gax.createApiCall(
        echoStub.then(
          stub =>
            function() {
              const args = Array.prototype.slice.call(arguments, 0);
              return stub[methodName].apply(stub, args);
            }
        ),
        defaults[methodName],
        this._descriptors.page[methodName] || this._descriptors.stream[methodName]
      );
    }
  }

  /**
   * The DNS address for this API service.
   */
  static get servicePath() {
    return 'localhost';
  }

  /**
   * The port for this API service.
   */
  static get port() {
    return 7469;
  }

  /**
   * The scopes needed to make gRPC calls for every method defined
   * in this service.
   */
  static get scopes() {
    return [
      'https://www.googleapis.com/auth/cloud-platform',
    ];
  }

  /**
   * Return the project ID used by this class.
   * @param {function(Error, string)} callback - the callback to
   *   be called with the current project Id.
   */
  getProjectId(callback) {
    return this.auth.getProjectId(callback);
  }

  // -------------------
  // -- Service calls --
  // -------------------

  /**
   * This method simply echos the request. This method is showcases unary rpcs.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} [request.content]
   *   The content to be echoed by the server.
   * @param {Object} [request.error]
   *   The error to be thrown by the server.
   *
   *   This object should have the same structure as [Status]{@link google.rpc.Status}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [EchoResponse]{@link google.showcase.v1alpha2.EchoResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [EchoResponse]{@link google.showcase.v1alpha2.EchoResponse}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const showcase = require('showcase.v1alpha2');
   *
   * const client = new showcase.v1alpha2.EchoClient({
   *   // optional auth parameters.
   * });
   *
   *
   * client.echo({})
   *   .then(responses => {
   *     const response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  echo(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.echo(request, options, callback);
  }

  /**
   * This method split the given content into words and will pass each word back
   * through the stream. This method showcases server-side streaming rpcs.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} [request.content]
   *   The content that will be split into words and returned on the stream.
   * @param {Object} [request.error]
   *   The error that is thrown after all words are sent on the stream.
   *
   *   This object should have the same structure as [Status]{@link google.rpc.Status}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @returns {Stream}
   *   An object stream which emits [EchoResponse]{@link google.showcase.v1alpha2.EchoResponse} on 'data' event.
   *
   * @example
   *
   * const showcase = require('showcase.v1alpha2');
   *
   * const client = new showcase.v1alpha2.EchoClient({
   *   // optional auth parameters.
   * });
   *
   *
   * client.expand({}).on('data', response => {
   *   // doThingsWith(response)
   * });
   */
  expand(request, options) {
    options = options || {};

    return this._innerApiCalls.expand(request, options);
  }

  /**
   * This method will collect the words given to it. When the stream is closed
   * by the client, this method will return the a concatenation of the strings
   * passed to it. This method showcases client-side streaming rpcs.
   *
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [EchoResponse]{@link google.showcase.v1alpha2.EchoResponse}.
   * @returns {Stream} - A writable stream which accepts objects representing
   *   [EchoRequest]{@link google.showcase.v1alpha2.EchoRequest} for write() method.
   *
   * @example
   *
   * const showcase = require('showcase.v1alpha2');
   *
   * const client = new showcase.v1alpha2.EchoClient({
   *   // optional auth parameters.
   * });
   *
   * const stream = client.collect((err, response) => {
   *   if (err) {
   *     console.error(err);
   *     return;
   *   }
   *   // doThingsWith(response)
   * });
   * const request = {};
   * // Write request objects.
   * stream.write(request);
   */
  collect(options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.collect(null, options, callback);
  }

  /**
   * This method, upon receiving a request on the stream, the same content will
   * be passed  back on the stream. This method showcases bidirectional
   * streaming rpcs.
   *
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @returns {Stream}
   *   An object stream which is both readable and writable. It accepts objects
   *   representing [EchoRequest]{@link google.showcase.v1alpha2.EchoRequest} for write() method, and
   *   will emit objects representing [EchoResponse]{@link google.showcase.v1alpha2.EchoResponse} on 'data' event asynchronously.
   *
   * @example
   *
   * const showcase = require('showcase.v1alpha2');
   *
   * const client = new showcase.v1alpha2.EchoClient({
   *   // optional auth parameters.
   * });
   *
   * const stream = client.chat().on('data', response => {
   *   // doThingsWith(response)
   * });
   * const request = {};
   * // Write request objects.
   * stream.write(request);
   */
  chat(options) {
    options = options || {};

    return this._innerApiCalls.chat(options);
  }

  /**
   * This method will wait the requested amount of and then return.
   * This method showcases how a client handles a request timing out.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {Object} request.responseDelay
   *   The amount of time to wait before returning a response.
   *
   *   This object should have the same structure as [Duration]{@link google.protobuf.Duration}
   * @param {Object} [request.error]
   *   The error that will be returned by the server. If this code is specified
   *   to be the OK rpc code, an empty response will be returned.
   *
   *   This object should have the same structure as [Status]{@link google.rpc.Status}
   * @param {Object} [request.success]
   *   The response to be returned that will signify successful method call.
   *
   *   This object should have the same structure as [WaitResponse]{@link google.showcase.v1alpha2.WaitResponse}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [WaitResponse]{@link google.showcase.v1alpha2.WaitResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [WaitResponse]{@link google.showcase.v1alpha2.WaitResponse}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const showcase = require('showcase.v1alpha2');
   *
   * const client = new showcase.v1alpha2.EchoClient({
   *   // optional auth parameters.
   * });
   *
   * const responseDelay = {};
   * client.wait({responseDelay: responseDelay})
   *   .then(responses => {
   *     const response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  wait(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.wait(request, options, callback);
  }

  /**
   * This method returns a page containing numbers specified in the request.
   * If the last number in the page is below the specified maximum, then the
   * response will include a page token indicating the next page.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {number} request.maxResponse
   *   The maximum number that will be returned in the response.
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Array, ?Object, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is Array of number.
   *
   *   When autoPaginate: false is specified through options, it contains the result
   *   in a single response. If the response indicates the next page exists, the third
   *   parameter is set to be used for the next request object. The fourth parameter keeps
   *   the raw response object of an object representing [PaginationResponse]{@link google.showcase.v1alpha2.PaginationResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is Array of number.
   *
   *   When autoPaginate: false is specified through options, the array has three elements.
   *   The first element is Array of number in a single response.
   *   The second element is the next request object if the response
   *   indicates the next page exists, or null. The third element is
   *   an object representing [PaginationResponse]{@link google.showcase.v1alpha2.PaginationResponse}.
   *
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const showcase = require('showcase.v1alpha2');
   *
   * const client = new showcase.v1alpha2.EchoClient({
   *   // optional auth parameters.
   * });
   *
   * // Iterate over all elements.
   * const maxResponse = 0;
   *
   * client.pagination({maxResponse: maxResponse})
   *   .then(responses => {
   *     const resources = responses[0];
   *     for (let i = 0; i < resources.length; i += 1) {
   *       // doThingsWith(resources[i])
   *     }
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   *
   * // Or obtain the paged response.
   * const maxResponse = 0;
   *
   *
   * const options = {autoPaginate: false};
   * const callback = responses => {
   *   // The actual resources in a response.
   *   const resources = responses[0];
   *   // The next request if the response shows that there are more responses.
   *   const nextRequest = responses[1];
   *   // The actual response object, if necessary.
   *   // const rawResponse = responses[2];
   *   for (let i = 0; i < resources.length; i += 1) {
   *     // doThingsWith(resources[i]);
   *   }
   *   if (nextRequest) {
   *     // Fetch the next page.
   *     return client.pagination(nextRequest, options).then(callback);
   *   }
   * }
   * client.pagination({maxResponse: maxResponse}, options)
   *   .then(callback)
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  pagination(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.pagination(request, options, callback);
  }

  /**
   * Equivalent to {@link pagination}, but returns a NodeJS Stream object.
   *
   * This fetches the paged responses for {@link pagination} continuously
   * and invokes the callback registered for 'data' event for each element in the
   * responses.
   *
   * The returned object has 'end' method when no more elements are required.
   *
   * autoPaginate option will be ignored.
   *
   * @see {@link https://nodejs.org/api/stream.html}
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {number} request.maxResponse
   *   The maximum number that will be returned in the response.
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @returns {Stream}
   *   An object stream which emits a number on 'data' event.
   *
   * @example
   *
   * const showcase = require('showcase.v1alpha2');
   *
   * const client = new showcase.v1alpha2.EchoClient({
   *   // optional auth parameters.
   * });
   *
   * const maxResponse = 0;
   * client.paginationStream({maxResponse: maxResponse})
   *   .on('data', element => {
   *     // doThingsWith(element)
   *   }).on('error', err => {
   *     console.log(err);
   *   });
   */
  paginationStream(request, options) {
    options = options || {};

    return this._descriptors.page.pagination.createStream(
      this._innerApiCalls.pagination,
      request,
      options
    );
  };
}


module.exports = EchoClient;
