// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

function main() {
  // [START secretmanager_update_secret_sample]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. [Secret][google.cloud.secretmanager.v1.Secret] with updated field values.
   */
  // const secret =''
  /**
   *  Required. Specifies the fields to be updated.
   */
  // const updateMask =''

  // Imports the Secretmanager library
  const {SecretManagerServiceClient} = require('secretmanager');

  // Instantiates a client
  const secretmanagerClient = new SecretManagerServiceClient();

  async function updateSecret() {
    // Construct request
    const request = {
      secret,
      updateMask,
    };

    // Run request
    const response = await secretmanagerClient.updateSecret(request);
    console.log(`Response: ${response}`);
  }

  updateSecret();
  // [END secretmanager_update_secret_sample]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
