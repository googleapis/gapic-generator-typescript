// Copyright 2023 Google LLC
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
//
// ** This file is automatically generated by gapic-generator-typescript. **
// ** https://github.com/googleapis/gapic-generator-typescript **
// ** All changes to this file may be overwritten. **



'use strict';

function main() {
  // [START localhost_v1beta1_generated_Compliance_RepeatDataBodyPatch_async]
  /**
   * This snippet has been automatically generated and should be regarded as a code template only.
   * It will require modifications to work.
   * It may require correct/in-range values for request initialization.
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   */
  // const name = 'abc123'
  /**
   */
  // const info = {}
  /**
   *  If true, the server will verify that the received request matches
   *  the request with the same name in the compliance test suite.
   */
  // const serverVerify = true
  /**
   *  The URI template this request is expected to be bound to server-side.
   */
  // const intendedBindingUri = 'abc123'
  /**
   *  Some top level fields, to test that these are encoded correctly
   *  in query params.
   */
  // const fInt32 = 1234
  /**
   */
  // const fInt64 = 1234
  /**
   */
  // const fDouble = 1234
  /**
   */
  // const pInt32 = 1234
  /**
   */
  // const pInt64 = 1234
  /**
   */
  // const pDouble = 1234

  // Imports the Showcase library
  const {ComplianceClient} = require('showcase').v1beta1;

  // Instantiates a client
  const showcaseClient = new ComplianceClient();

  async function callRepeatDataBodyPatch() {
    // Construct request
    const request = {
    };

    // Run request
    const response = await showcaseClient.repeatDataBodyPatch(request);
    console.log(response);
  }

  callRepeatDataBodyPatch();
  // [END localhost_v1beta1_generated_Compliance_RepeatDataBodyPatch_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
