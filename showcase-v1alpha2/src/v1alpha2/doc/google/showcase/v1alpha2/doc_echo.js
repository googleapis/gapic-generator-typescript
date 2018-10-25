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

// Note: this file is purely for documentation. Any contents are not expected
// to be loaded as the JS file.

/**
 * The request message used for the Echo, Collect and Chat methods. If content
 * is set in this message then the request will succeed. If a status is
 *
 * @property {string} content
 *   The content to be echoed by the server.
 *
 * @property {Object} error
 *   The error to be thrown by the server.
 *
 *   This object should have the same structure as [Status]{@link google.rpc.Status}
 *
 * @typedef EchoRequest
 * @memberof google.showcase.v1alpha2
 * @see [google.showcase.v1alpha2.EchoRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/showcase/v1alpha2/echo.proto}
 */
const EchoRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response message for the Echo methods.
 *
 * @property {string} content
 *   The content specified in the request.
 *
 * @typedef EchoResponse
 * @memberof google.showcase.v1alpha2
 * @see [google.showcase.v1alpha2.EchoResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/showcase/v1alpha2/echo.proto}
 */
const EchoResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request message for the Expand method.
 *
 * @property {string} content
 *   The content that will be split into words and returned on the stream.
 *
 * @property {Object} error
 *   The error that is thrown after all words are sent on the stream.
 *
 *   This object should have the same structure as [Status]{@link google.rpc.Status}
 *
 * @typedef ExpandRequest
 * @memberof google.showcase.v1alpha2
 * @see [google.showcase.v1alpha2.ExpandRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/showcase/v1alpha2/echo.proto}
 */
const ExpandRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for Wait method.
 *
 * @property {Object} responseDelay
 *   The amount of time to wait before returning a response.
 *
 *   This object should have the same structure as [Duration]{@link google.protobuf.Duration}
 *
 * @property {Object} error
 *   The error that will be returned by the server. If this code is specified
 *   to be the OK rpc code, an empty response will be returned.
 *
 *   This object should have the same structure as [Status]{@link google.rpc.Status}
 *
 * @property {Object} success
 *   The response to be returned that will signify successful method call.
 *
 *   This object should have the same structure as [WaitResponse]{@link google.showcase.v1alpha2.WaitResponse}
 *
 * @typedef WaitRequest
 * @memberof google.showcase.v1alpha2
 * @see [google.showcase.v1alpha2.WaitRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/showcase/v1alpha2/echo.proto}
 */
const WaitRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response for Wait method.
 *
 * @property {string} content
 *   This content can contain anything, the server will not depend on a value
 *   here.
 *
 * @typedef WaitResponse
 * @memberof google.showcase.v1alpha2
 * @see [google.showcase.v1alpha2.WaitResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/showcase/v1alpha2/echo.proto}
 */
const WaitResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for the Pagination methods.
 *
 * @property {number} maxResponse
 *   The maximum number that will be returned in the response.
 *
 * @property {number} pageSize
 *   The amount of numbers to returned in the response.
 *
 * @property {string} pageToken
 *   The position of the page to be returned. This will be a stringified int
 *   that will signifiy where to start the page from. Anything other than
 *   a stringified integer within the range of 0 and the max_response will
 *   cause an error to be thrown. This value is a string as opposed to a int32
 *   to follow general google api practices.
 *
 * @typedef PaginationRequest
 * @memberof google.showcase.v1alpha2
 * @see [google.showcase.v1alpha2.PaginationRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/showcase/v1alpha2/echo.proto}
 */
const PaginationRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response for the Pagination method.
 *
 * @property {number[]} responses
 *   An increasing list of responses starting at the value specified by the
 *   page token. If the page token is empty, then this list will start at 0.
 *
 * @property {string} nextPageToken
 *   The next integer stringified.
 *
 * @typedef PaginationResponse
 * @memberof google.showcase.v1alpha2
 * @see [google.showcase.v1alpha2.PaginationResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/showcase/v1alpha2/echo.proto}
 */
const PaginationResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};