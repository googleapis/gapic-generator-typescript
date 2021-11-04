// Copyright 2020 Google LLC
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
import {describe, it} from 'mocha';
import {
  commonPrefix,
  duration,
  seconds,
  milliseconds,
  isDigit,
  checkIfArrayContainsOnlyOneNamedSegment,
  convertSegmentToRegex,
  convertTemplateToRegex,
  getNamedSegment,
} from '../../src/util';
import * as protos from '../../../protos';

describe('src/util.ts', () => {
  describe('CommonPrefix', () => {
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

  describe('Duration', () => {
    it('should support fractional seconds', () => {
      const input = '0.1s';
      const dur = duration(input);
      assert.strictEqual(Number(dur.seconds), 0);
      assert.strictEqual(Number(dur.nanos), 0.1 * 1e9);
    });

    it('should support fractional minutes', () => {
      const input = '0.5m';
      const dur = duration(input);
      assert.strictEqual(Number(dur.seconds), 30);
      assert.strictEqual(Number(dur.nanos), 0);
    });

    it('should build correct Duration object for seconds', () => {
      const input = '5s';
      const dur = duration(input);
      assert.strictEqual(Number(dur.seconds), 5);
      assert.strictEqual(Number(dur.nanos), 0);
    });

    it('should build correct Duration object for minutes', () => {
      const input = '10m';
      const dur = duration(input);
      assert.strictEqual(Number(dur.seconds), 10 * 60);
      assert.strictEqual(Number(dur.nanos), 0);
    });

    it('should build correct Duration object for hours', () => {
      const input = '2h';
      const dur = duration(input);
      assert.strictEqual(Number(dur.seconds), 2 * 60 * 60);
      assert.strictEqual(Number(dur.nanos), 0);
    });

    it('should build correct Duration object for days', () => {
      const input = '3d';
      const dur = duration(input);
      assert.strictEqual(Number(dur.seconds), 3 * 60 * 60 * 24);
      assert.strictEqual(Number(dur.nanos), 0);
    });

    it('should convert Duration to whole seconds', () => {
      const duration = protos.google.protobuf.Duration.fromObject({
        seconds: 10,
        nanos: 0,
      });
      const result = seconds(duration);
      assert.strictEqual(result, 10);
    });

    it('should convert Duration to fractional seconds', () => {
      const duration = protos.google.protobuf.Duration.fromObject({
        seconds: 5,
        nanos: 500000000,
      });
      const result = seconds(duration);
      assert.strictEqual(result, 5.5);
    });

    it('should convert Duration to whole milliseconds', () => {
      const duration = protos.google.protobuf.Duration.fromObject({
        seconds: 10,
        nanos: 0,
      });
      const result = milliseconds(duration);
      assert.strictEqual(result, 10000);
    });

    it('should convert Duration to fractional milliseconds', () => {
      const duration = protos.google.protobuf.Duration.fromObject({
        seconds: 5,
        nanos: 500000000,
      });
      const result = milliseconds(duration);
      assert.strictEqual(result, 5500);
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
      assert.deepStrictEqual(''.words(), []);
      assert.deepStrictEqual('test'.words(), ['test']);
      assert.deepStrictEqual('camelCaseString'.words(), [
        'camel',
        'case',
        'string',
      ]);
      assert.deepStrictEqual('PascalCaseString'.words(), [
        'pascal',
        'case',
        'string',
      ]);
      assert.deepStrictEqual('snake_case_string'.words(), [
        'snake',
        'case',
        'string',
      ]);
      assert.deepStrictEqual('kebab-case-string'.words(), [
        'kebab',
        'case',
        'string',
      ]);
      assert.deepStrictEqual('random/separators-string'.words(), [
        'random',
        'separators',
        'string',
      ]);
      assert.deepStrictEqual('mixedType-string.SomewhatWeird'.words(), [
        'mixed',
        'type',
        'string',
        'somewhat',
        'weird',
      ]);
      assert.deepStrictEqual('productName.v1p1beta1'.words(), [
        'product',
        'name',
        'v1p1beta1',
      ]);
    });

    it('should convert to camelCase', () => {
      assert.deepStrictEqual(''.toCamelCase(), '');
      assert.deepStrictEqual('test'.toCamelCase(), 'test');
      assert.deepStrictEqual(
        'camelCaseString'.toCamelCase(),
        'camelCaseString'
      );
      assert.deepStrictEqual(
        'PascalCaseString'.toCamelCase(),
        'pascalCaseString'
      );
      assert.deepStrictEqual(
        'snake_case_string'.toCamelCase(),
        'snakeCaseString'
      );
      assert.deepStrictEqual(
        'kebab-case-string'.toCamelCase(),
        'kebabCaseString'
      );
      assert.deepStrictEqual(
        'random/separators-string'.toCamelCase(),
        'randomSeparatorsString'
      );
      assert.deepStrictEqual(
        'mixedType-string.SomewhatWeird'.toCamelCase(),
        'mixedTypeStringSomewhatWeird'
      );
      assert.deepStrictEqual(
        'productName.v1p1beta1'.toCamelCase(),
        'productNameV1p1beta1'
      );
      assert.deepStrictEqual(
        'display_video_360_advertiser_link'.toCamelCase(),
        'displayVideo_360AdvertiserLink'
      );
    });

    it('should convert to PascalCase', () => {
      assert.deepStrictEqual(''.toPascalCase(), '');
      assert.deepStrictEqual('test'.toPascalCase(), 'Test');
      assert.deepStrictEqual(
        'camelCaseString'.toPascalCase(),
        'CamelCaseString'
      );
      assert.deepStrictEqual(
        'PascalCaseString'.toPascalCase(),
        'PascalCaseString'
      );
      assert.deepStrictEqual(
        'snake_case_string'.toPascalCase(),
        'SnakeCaseString'
      );
      assert.deepStrictEqual(
        'kebab-case-string'.toPascalCase(),
        'KebabCaseString'
      );
      assert.deepStrictEqual(
        'random/separators-string'.toPascalCase(),
        'RandomSeparatorsString'
      );
      assert.deepStrictEqual(
        'mixedType-string.SomewhatWeird'.toPascalCase(),
        'MixedTypeStringSomewhatWeird'
      );
      assert.deepStrictEqual(
        'productName.v1p1beta1'.toPascalCase(),
        'ProductNameV1p1beta1'
      );
    });

    it('should convert to kebab-case', () => {
      assert.deepStrictEqual(''.toKebabCase(), '');
      assert.deepStrictEqual('test'.toKebabCase(), 'test');
      assert.deepStrictEqual(
        'camelCaseString'.toKebabCase(),
        'camel-case-string'
      );
      assert.deepStrictEqual(
        'PascalCaseString'.toKebabCase(),
        'pascal-case-string'
      );
      assert.deepStrictEqual(
        'snake_case_string'.toKebabCase(),
        'snake-case-string'
      );
      assert.deepStrictEqual(
        'kebab-case-string'.toKebabCase(),
        'kebab-case-string'
      );
      assert.deepStrictEqual(
        'random/separators-string'.toKebabCase(),
        'random-separators-string'
      );
      assert.deepStrictEqual(
        'mixedType-string.SomewhatWeird'.toKebabCase(),
        'mixed-type-string-somewhat-weird'
      );
      assert.deepStrictEqual(
        'productName.v1p1beta1'.toKebabCase(),
        'product-name-v1p1beta1'
      );
    });

    it('should convert to snake_case', () => {
      assert.deepStrictEqual(''.toSnakeCase(), '');
      assert.deepStrictEqual('test'.toSnakeCase(), 'test');
      assert.deepStrictEqual(
        'camelCaseString'.toSnakeCase(),
        'camel_case_string'
      );
      assert.deepStrictEqual(
        'PascalCaseString'.toSnakeCase(),
        'pascal_case_string'
      );
      assert.deepStrictEqual(
        'snake_case_string'.toSnakeCase(),
        'snake_case_string'
      );
      assert.deepStrictEqual(
        'kebab-case-string'.toSnakeCase(),
        'kebab_case_string'
      );
      assert.deepStrictEqual(
        'random/separators-string'.toSnakeCase(),
        'random_separators_string'
      );
      assert.deepStrictEqual(
        'mixedType-string.SomewhatWeird'.toSnakeCase(),
        'mixed_type_string_somewhat_weird'
      );
      assert.deepStrictEqual(
        'productName.v1p1beta1'.toSnakeCase(),
        'product_name_v1p1beta1'
      );
    });

    it('should replace all search item with replacement', () => {
      assert.deepStrictEqual(''.replaceAll('', 'success'), '');
      assert.deepStrictEqual('Read me'.replaceAll('me', 'this'), 'Read this');
      assert.deepStrictEqual(
        'This is a Test'.replaceAll('T', 't'),
        'this is a test'
      );
      assert.deepStrictEqual(
        'location*/address*/room/*'.replaceAll('*/', '* /'),
        'location* /address* /room/*'
      );
    });
  });

  describe('array manipulation', () => {
    it('should convert array to camel case string using the joiner', () => {
      assert.deepStrictEqual([''].toCamelCaseString('!.'), '');
      assert.deepStrictEqual(['test'].toCamelCaseString('!.'), 'test');
      assert.deepStrictEqual(
        ['camelCaseString'].toCamelCaseString('!.'),
        'camelCaseString'
      );
      assert.deepStrictEqual(
        ['PascalCaseString'].toCamelCaseString('!.'),
        'pascalCaseString'
      );
      assert.deepStrictEqual(
        ['snake_case_string'].toCamelCaseString('!.'),
        'snakeCaseString'
      );
      assert.deepStrictEqual(
        ['kebab-case-string'].toCamelCaseString('!.'),
        'kebabCaseString'
      );
      assert.deepStrictEqual(
        ['random/separators-string'].toCamelCaseString('!.'),
        'randomSeparatorsString'
      );
      assert.deepStrictEqual(
        ['mixedType-string', 'SomewhatWeird'].toCamelCaseString('!.'),
        'mixedTypeString!.somewhatWeird'
      );
      assert.deepStrictEqual(
        ['productName', 'v1p1beta1'].toCamelCaseString('!.'),
        'productName!.v1p1beta1'
      );
      assert.deepStrictEqual(
        ['product_key', 'lower_name', 'v1p1beta1'].toCamelCaseString('!.'),
        'productKey!.lowerName!.v1p1beta1'
      );
      assert.deepStrictEqual(
        ['tableReference', 'project_id'].toCamelCaseString('!.'),
        'tableReference!.projectId'
      );
    });

    it('should convert array to snake case string using the joiner', () => {
      assert.deepStrictEqual([''].toSnakeCaseString('!.'), '');
      assert.deepStrictEqual(['test'].toSnakeCaseString('!.'), 'test');
      assert.deepStrictEqual(
        ['camelCaseString'].toSnakeCaseString('!.'),
        'camel_case_string'
      );
      assert.deepStrictEqual(
        ['PascalCaseString'].toSnakeCaseString('!.'),
        'pascal_case_string'
      );
      assert.deepStrictEqual(
        ['snake_case_string'].toSnakeCaseString('!.'),
        'snake_case_string'
      );
      assert.deepStrictEqual(
        ['kebab-case-string'].toSnakeCaseString('!.'),
        'kebab_case_string'
      );
      assert.deepStrictEqual(
        ['random/separators-string'].toSnakeCaseString('!.'),
        'random_separators_string'
      );
      assert.deepStrictEqual(
        ['mixedType-string', 'SomewhatWeird'].toSnakeCaseString('!.'),
        'mixed_type_string!.somewhat_weird'
      );
      assert.deepStrictEqual(
        ['productName', 'v1p1beta1'].toSnakeCaseString('!.'),
        'product_name!.v1p1beta1'
      );
      assert.deepStrictEqual(
        ['product_key', 'lower_name', 'v1p1beta1'].toSnakeCaseString('!.'),
        'product_key!.lower_name!.v1p1beta1'
      );
      assert.deepStrictEqual(
        ['tableReference', 'project_id'].toSnakeCaseString('!.'),
        'table_reference!.project_id'
      );
    });
  });

  describe('Detect number', () => {
    it('should return true if the string is number', () => {
      assert.deepStrictEqual(isDigit('123'), true);
    });
    it('should return false if the string is not number', () => {
      assert.deepStrictEqual(isDigit('abc345'), false);
      assert.deepStrictEqual(isDigit(''), false);
      assert.deepStrictEqual(isDigit('hello'), false);
      assert.deepStrictEqual(isDigit('NaN'), false);
      assert.deepStrictEqual(isDigit('0b110100'), false);
      assert.deepStrictEqual(isDigit('Infinity'), false);
      assert.deepStrictEqual(isDigit('-Infinity'), false);
    });
  });

  describe('Array check', () => {
    it('should get return true if an array of strings contains exactly one named segment', () => {
      assert.deepStrictEqual(
        checkIfArrayContainsOnlyOneNamedSegment(['database=projects', 'foo']),
        true
      );
      assert.deepStrictEqual(
        checkIfArrayContainsOnlyOneNamedSegment([
          'database',
          '123',
          'pho123=yummy234',
        ]),
        true
      );
      assert.deepStrictEqual(
        checkIfArrayContainsOnlyOneNamedSegment(['=projects', 'foo']),
        false
      );
      assert.deepStrictEqual(
        checkIfArrayContainsOnlyOneNamedSegment(['projects', 'foo=']),
        false
      );
      assert.deepStrictEqual(
        checkIfArrayContainsOnlyOneNamedSegment(['projects', 'foo=*']),
        true
      );
      assert.deepStrictEqual(
        checkIfArrayContainsOnlyOneNamedSegment([
          'database=projects',
          'foo=bar',
          'cat',
        ]),
        false
      );
      assert.deepStrictEqual(
        checkIfArrayContainsOnlyOneNamedSegment([
          'database=projects',
          'foo=*',
          'cat',
        ]),
        false
      );
      assert.deepStrictEqual(
        checkIfArrayContainsOnlyOneNamedSegment([
          'database=projects',
          'foo=**',
          'cat',
        ]),
        false
      );
      assert.deepStrictEqual(
        checkIfArrayContainsOnlyOneNamedSegment(['{database}', 'cat']),
        true
      );
    });
  });
  describe('Strings to regex', () => {
    it('should get convert a path template segment into regex', () => {
      assert.deepStrictEqual(convertSegmentToRegex('{foo}'), '(?<foo>[^/]+)');
      assert.deepStrictEqual(convertSegmentToRegex('{foo=*}'), '(?<foo>[^/]+)');
      assert.deepStrictEqual(
        convertSegmentToRegex('{foo=**}'),
        '(?<foo>(?:/.*)?)'
      );
      assert.deepStrictEqual(convertSegmentToRegex('{foo=bar}'), '(?<foo>bar)');
      assert.deepStrictEqual(convertSegmentToRegex('{foo=bar'), '(?<foo>bar)');
      assert.deepStrictEqual(convertSegmentToRegex('*'), '[^/]+');
      assert.deepStrictEqual(convertSegmentToRegex('*}'), '[^/]+');
      assert.deepStrictEqual(convertSegmentToRegex('**'), '(?:/.*)?');
      assert.deepStrictEqual(convertSegmentToRegex('foo'), 'foo');
    });
  });

  describe('Path template to regex', () => {
    it('should get convert a full path template into regex', () => {
      assert.deepStrictEqual(convertTemplateToRegex('{foo}'), '(?<foo>[^/]+)');
      assert.deepStrictEqual(
        convertTemplateToRegex('{foo=*}'),
        '(?<foo>[^/]+)'
      );
      assert.deepStrictEqual(
        convertTemplateToRegex('{foo=**}'),
        '(?<foo>(?:/.*)?)'
      );
      assert.deepStrictEqual(
        convertTemplateToRegex('{foo=bar}'),
        '(?<foo>bar)'
      );
      assert.deepStrictEqual(convertTemplateToRegex('{foo=bar'), '(?<foo>bar)');
      assert.deepStrictEqual(convertTemplateToRegex('*'), '[^/]+');
      assert.deepStrictEqual(convertTemplateToRegex('*}'), '[^/]+');
      assert.deepStrictEqual(convertTemplateToRegex('**'), '(?:/.*)?');
      assert.deepStrictEqual(
        convertTemplateToRegex(
          'test/{database=projects/*/databases/*}/documents/*/**'
        ),
        'test/(?<database>projects)/[^/]+/databases/[^/]+/documents/[^/]+(?:/.*)?'
      );
      assert.deepStrictEqual(
        convertTemplateToRegex(
          '{database=projects/*/databases/*}/documents/*/**'
        ),
        '(?<database>projects)/[^/]+/databases/[^/]+/documents/[^/]+(?:/.*)?'
      );
      assert.deepStrictEqual(
        convertTemplateToRegex(
          '{new_name_match=projects/*/instances/*/tables/*}'
        ),
        '(?<new_name_match>projects)/[^/]+/instances/[^/]+/tables/[^/]+'
      );
      assert.deepStrictEqual(
        convertTemplateToRegex('{routing_id=projects/*}/**'),
        '(?<routing_id>projects)/[^/]+(?:/.*)?'
      );
      assert.deepStrictEqual(
        convertTemplateToRegex('profiles/{routing_id=*}'),
        'profiles/(?<routing_id>[^/]+)'
      );
    });
  });

  describe('Path template matching', () => {
    it('should get the named segment information from a full path template', () => {
      assert.deepStrictEqual(
        getNamedSegment('{database=projects/*/databases/*}/documents/*/**'),
        [
          'database=projects/*/databases/*',
          'database',
          'projects/*/databases/*',
          '(?<database>projects/[^/]+/databases/[^/]+)',
        ]
      );
      assert.deepStrictEqual(
        getNamedSegment('test/{table=projects/*/databases/*}/documents/*/**'),
        [
          'table=projects/*/databases/*',
          'table',
          'projects/*/databases/*',
          '(?<table>projects/[^/]+/databases/[^/]+)',
        ]
      );
      assert.deepStrictEqual(getNamedSegment('{routing_id=**}'), [
        'routing_id=**',
        'routing_id',
        '**',
        '(?<routing_id>.*)',
      ]);
      assert.deepStrictEqual(getNamedSegment('{database}'), [
        'database',
        'database',
        '*',
        '[^/]+',
      ]);
      it('should return an empty array if the path template does not contain exactly one named segment', () => {
        assert.deepStrictEqual(getNamedSegment('test/database'), []);
        assert.deepStrictEqual(
          getNamedSegment(
            'test/{database=projects/*/databases/*}/documents/*/**/{hello=world}'
          ),
          []
        );
      });
    });
  });
});
