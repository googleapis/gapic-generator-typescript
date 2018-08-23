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

import * as getStdin from 'get-stdin';
import * as protobuf from 'protobufjs';
import * as path from 'path';

export class Generator {
  constructor() {}

  async initializeFromStdin() {
    const root = new protobuf.Root();
    root.resolvePath = (origin, target) => {
      if (origin === '') {
        return target;
      }
      return path.join('proto', target);
    };
    await root.load(path.join('proto', 'google', 'protobuf', 'compiler', 'plugin.proto'));
    const CodeGeneratorRequestMessage = root.lookupType("google.protobuf.compiler.CodeGeneratorRequest");
    const CodeGeneratorResponseMessage = root.lookupType("google.protobuf.compiler.CodeGeneratorResponse");

    const inputBuffer = await getStdin.buffer();
    const request = CodeGeneratorRequestMessage.decode(inputBuffer);
    console.warn(request);

    let response = CodeGeneratorResponseMessage.create();
    const outputBuffer = CodeGeneratorResponseMessage.encode(response).finish();
    process.stdout.write(outputBuffer.toString());
  }
}
