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

import * as assert from 'assert';
import {commonPrefix} from '../src/util';

describe('Test', () => {
  it('should pass', async () => {});
});

describe('util.ts', () => {
  describe('commonPrefix', () => {
    it('should return correct result', () => {
      assert.strictEqual(commonPrefix(['abc', 'abcd', 'ab']), 'ab');
      assert.strictEqual(commonPrefix(['abcd', 'abc', 'ab']), 'ab');
      assert.strictEqual(commonPrefix(['ab', 'abcd', 'abc']), 'ab');
      assert.strictEqual(commonPrefix(['abc', '']), '');
      assert.strictEqual(commonPrefix(['', 'abc']), '');
      assert.strictEqual(commonPrefix(['a']), 'a');
      assert.strictEqual(commonPrefix(['abc']), 'abc');
      assert.strictEqual(commonPrefix(['', '']), '');
      assert.strictEqual(commonPrefix(['']), '');
      assert.strictEqual(commonPrefix([]), '');
    });
  });

  describe('String manipulation', () => {
    it('should capitalize', () => {
      assert.strictEqual(''.capitalize(), '');
      assert.strictEqual('a'.capitalize(), 'A');
      assert.strictEqual('ab'.capitalize(), 'Ab');
      assert.strictEqual('abc'.capitalize(), 'Abc');
      assert.strictEqual('abcd efgh'.capitalize(), 'Abcd efgh');
    });

    it('should split string into words', () => {
      assert.deepEqual(''.words(), []);
      assert.deepEqual('test'.words(), ['test']);
      assert.deepEqual('camelCaseString'.words(), ['camel', 'case', 'string']);
      assert.deepEqual(
          'PascalCaseString'.words(), ['pascal', 'case', 'string']);
      assert.deepEqual(
          'snake_case_string'.words(), ['snake', 'case', 'string']);
      assert.deepEqual(
          'kebab-case-string'.words(), ['kebab', 'case', 'string']);
      assert.deepEqual(
          'random/separators-string'.words(),
          ['random', 'separators', 'string']);
      assert.deepEqual(
          'mixedType-string.SomewhatWeird'.words(),
          ['mixed', 'type', 'string', 'somewhat', 'weird']);
      assert.deepEqual(
          'productName.v1p1beta1'.words(), ['product', 'name', 'v1p1beta1']);
    });

    it('should convert to camelCase', () => {
      assert.deepEqual(''.toCamelCase(), '');
      assert.deepEqual('test'.toCamelCase(), 'test');
      assert.deepEqual('camelCaseString'.toCamelCase(), 'camelCaseString');
      assert.deepEqual('PascalCaseString'.toCamelCase(), 'pascalCaseString');
      assert.deepEqual('snake_case_string'.toCamelCase(), 'snakeCaseString');
      assert.deepEqual('kebab-case-string'.toCamelCase(), 'kebabCaseString');
      assert.deepEqual(
          'random/separators-string'.toCamelCase(), 'randomSeparatorsString');
      assert.deepEqual(
          'mixedType-string.SomewhatWeird'.toCamelCase(),
          'mixedTypeStringSomewhatWeird');
      assert.deepEqual(
          'productName.v1p1beta1'.toCamelCase(), 'productNameV1p1beta1');
    });

    it('should convert to PascalCase', () => {
      assert.deepEqual(''.toPascalCase(), '');
      assert.deepEqual('test'.toPascalCase(), 'Test');
      assert.deepEqual('camelCaseString'.toPascalCase(), 'CamelCaseString');
      assert.deepEqual('PascalCaseString'.toPascalCase(), 'PascalCaseString');
      assert.deepEqual('snake_case_string'.toPascalCase(), 'SnakeCaseString');
      assert.deepEqual('kebab-case-string'.toPascalCase(), 'KebabCaseString');
      assert.deepEqual(
          'random/separators-string'.toPascalCase(), 'RandomSeparatorsString');
      assert.deepEqual(
          'mixedType-string.SomewhatWeird'.toPascalCase(),
          'MixedTypeStringSomewhatWeird');
      assert.deepEqual(
          'productName.v1p1beta1'.toPascalCase(), 'ProductNameV1p1beta1');
    });

    it('should convert to kebab-case', () => {
      assert.deepEqual(''.toKebabCase(), '');
      assert.deepEqual('test'.toKebabCase(), 'test');
      assert.deepEqual('camelCaseString'.toKebabCase(), 'camel-case-string');
      assert.deepEqual('PascalCaseString'.toKebabCase(), 'pascal-case-string');
      assert.deepEqual('snake_case_string'.toKebabCase(), 'snake-case-string');
      assert.deepEqual('kebab-case-string'.toKebabCase(), 'kebab-case-string');
      assert.deepEqual(
          'random/separators-string'.toKebabCase(), 'random-separators-string');
      assert.deepEqual(
          'mixedType-string.SomewhatWeird'.toKebabCase(),
          'mixed-type-string-somewhat-weird');
      assert.deepEqual(
          'productName.v1p1beta1'.toKebabCase(), 'product-name-v1p1beta1');
    });

    it('should convert to snake_case', () => {
      assert.deepEqual(''.toSnakeCase(), '');
      assert.deepEqual('test'.toSnakeCase(), 'test');
      assert.deepEqual('camelCaseString'.toSnakeCase(), 'camel_case_string');
      assert.deepEqual('PascalCaseString'.toSnakeCase(), 'pascal_case_string');
      assert.deepEqual('snake_case_string'.toSnakeCase(), 'snake_case_string');
      assert.deepEqual('kebab-case-string'.toSnakeCase(), 'kebab_case_string');
      assert.deepEqual(
          'random/separators-string'.toSnakeCase(), 'random_separators_string');
      assert.deepEqual(
          'mixedType-string.SomewhatWeird'.toSnakeCase(),
          'mixed_type_string_somewhat_weird');
      assert.deepEqual(
          'productName.v1p1beta1'.toSnakeCase(), 'product_name_v1p1beta1');
    });
  });
});
