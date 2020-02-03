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
import { getHeaderRequestParams } from '../../src/schema/proto';

describe('schema/proto.ts', () => {
  describe('should get header parameters from http rule', () => {
    it('works with no parameter', () => {
      const httpRule: plugin.google.api.IHttpRule = {
        post: '{=abc/*/d/*/ef/}',
      };
      assert.deepStrictEqual([], getHeaderRequestParams(httpRule));
    });

    it('works only one parameter', () => {
      const httpRule: plugin.google.api.IHttpRule = {
        post: '{param1=abc/*/d/*/ef/}',
      };
      assert.deepStrictEqual([['param1']], getHeaderRequestParams(httpRule));
    });

    it('works with multiple parameter', () => {
      const httpRule: plugin.google.api.IHttpRule = {
        post: '{param1.param2.param3=abc/*/d/*/ef/}',
      };
      assert.deepStrictEqual(
        [['param1', 'param2', 'param3']],
        getHeaderRequestParams(httpRule)
      );
    });

    it('works with additional bindings', () => {
      const httpRule: plugin.google.api.IHttpRule = {
        post: '{param1.param2.param3=abc/*/d/*/ef/}',
        additionalBindings: [
          {
            post: '{foo1.foo2=foos/*}',
          },
          {
            post: 'no_parameters_here',
          },
          {
            post: '{bar1.bar2.bar3=bars/*}',
          },
        ],
      };
      assert.deepStrictEqual(
        [
          ['param1', 'param2', 'param3'],
          ['foo1', 'foo2'],
          ['bar1', 'bar2', 'bar3'],
        ],
        getHeaderRequestParams(httpRule)
      );
    });

    it('dedups parameters', () => {
      const httpRule: plugin.google.api.IHttpRule = {
        post: '{param1.param2.param3=abc/*/d/*/ef/}',
        additionalBindings: [
          {
            post: '{foo1.foo2=foos/*}',
          },
          {
            post: '{param1.param2.param3=abc/*/d/*/ef/}',
          },
          {
            post: '{param1.param2.param3=abc/*/d/*/ef/}',
          },
        ],
      };
      assert.deepStrictEqual(
        [
          ['param1', 'param2', 'param3'],
          ['foo1', 'foo2'],
        ],
        getHeaderRequestParams(httpRule)
      );
    });
  });
});
