// Copyright 2019 Google LLC
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

import * as assert from 'assert';
import { describe, it } from 'mocha';
import * as plugin from '../../../pbjs-genfiles/plugin';
import { getHeaderParams } from '../../src/schema/proto';

describe('schema/proto.ts', () => {
  it('should get header parameters from http rule', () => {
    it('works with no parameter ', () => {
      const httpRule: plugin.google.api.IHttpRule = {};
      httpRule.post = '{=abc/*/d/*/ef/}';
      assert.strictEqual([], getHeaderParams(httpRule));
    });
    it('works only one parameter ', () => {
      const httpRule: plugin.google.api.IHttpRule = {};
      httpRule.post = '{param1=abc/*/d/*/ef/}';
      assert.strictEqual(['param1'], getHeaderParams(httpRule));
    });
    it('works with multiple parameter ', () => {
      const httpRule: plugin.google.api.IHttpRule = {};
      httpRule.post = '{param1.param2.param3=abc/*/d/*/ef/}';
      assert.strictEqual(
        ['param1', 'param2', 'param3'],
        getHeaderParams(httpRule)
      );
    });
  });
});
