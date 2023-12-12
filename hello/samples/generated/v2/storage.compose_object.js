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

function main(destination) {
  // [START storage_v2_generated_Storage_ComposeObject_async]
  /**
   * This snippet has been automatically generated and should be regarded as a code template only.
   * It will require modifications to work.
   * It may require correct/in-range values for request initialization.
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. Properties of the resulting object.
   */
  // const destination = {}
  /**
   *  The list of source objects that will be concatenated into a single object.
   */
  // const sourceObjects = [1,2,3,4]
  /**
   *  Apply a predefined set of access controls to the destination object.
   *  Valid values are "authenticatedRead", "bucketOwnerFullControl",
   *  "bucketOwnerRead", "private", "projectPrivate", or "publicRead".
   */
  // const destinationPredefinedAcl = 'abc123'
  /**
   *  Makes the operation conditional on whether the object's current generation
   *  matches the given value. Setting to 0 makes the operation succeed only if
   *  there are no live versions of the object.
   */
  // const ifGenerationMatch = 1234
  /**
   *  Makes the operation conditional on whether the object's current
   *  metageneration matches the given value.
   */
  // const ifMetagenerationMatch = 1234
  /**
   *  Resource name of the Cloud KMS key, of the form
   *  `projects/my-project/locations/my-location/keyRings/my-kr/cryptoKeys/my-key`,
   *  that will be used to encrypt the object. Overrides the object
   *  metadata's `kms_key_name` value, if any.
   */
  // const kmsKey = 'abc123'
  /**
   *  A set of parameters common to Storage API requests concerning an object.
   */
  // const commonObjectRequestParams = {}
  /**
   *  The checksums of the complete object. This will be validated against the
   *  combined checksums of the component objects.
   */
  // const objectChecksums = {}

  // Imports the Storage library
  const {StorageClient} = require('storage').v2;

  // Instantiates a client
  const storageClient = new StorageClient();

  async function callComposeObject() {
    // Construct request
    const request = {
      destination,
    };

    // Run request
    const response = await storageClient.composeObject(request);
    console.log(response);
  }

  callComposeObject();
  // [END storage_v2_generated_Storage_ComposeObject_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
