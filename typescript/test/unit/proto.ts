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
import * as plugin from '../../../pbjs-genfiles/plugin';
import {getHeaderRequestParams, MessagesMap} from '../../src/schema/proto';
import {Proto} from '../../src/schema/proto';
import {Options} from '../../src/schema/naming';

import {ResourceDatabase} from '../../src/schema/resource-database';
import {CommentsMap} from '../../src/schema/comments';

describe('src/schema/proto.ts', () => {
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

  describe('special work around for talent API', () => {
    it('The pagingFieldName should be undefined for SearchJobs & SearchProfiles rpc', () => {
      const fd = new plugin.google.protobuf.FileDescriptorProto();
      fd.name = 'google/cloud/talent/v4beta1/service.proto';
      fd.package = 'google.cloud.talent.v4beta1';
      fd.service = [new plugin.google.protobuf.ServiceDescriptorProto()];
      fd.service[0].name = 'service';
      fd.service[0].method = [
        new plugin.google.protobuf.MethodDescriptorProto(),
      ];
      fd.service[0].method[0] = new plugin.google.protobuf.MethodDescriptorProto();
      fd.service[0].method[0].name = 'SearchJobs';
      fd.service[0].method[1] = new plugin.google.protobuf.MethodDescriptorProto();
      fd.service[0].method[1].name = 'SearchProfiles';
      fd.service[0].method[2] = new plugin.google.protobuf.MethodDescriptorProto();
      fd.service[0].method[2].name = 'SearchJobsForAlert';
      fd.service[0].method[3] = new plugin.google.protobuf.MethodDescriptorProto();
      fd.service[0].method[3].name = 'ListJobs';
      fd.service[0].method[3].outputType =
        '.google.cloud.talent.v4beta1.ListJobsOutput';
      fd.service[0].method[3].inputType =
        '.google.cloud.talent.v4beta1.ListJobsInput';

      fd.messageType = [new plugin.google.protobuf.DescriptorProto()];
      fd.messageType[0] = new plugin.google.protobuf.DescriptorProto();
      fd.messageType[1] = new plugin.google.protobuf.DescriptorProto();

      fd.messageType[0].name = 'ListJobsOutput';
      fd.messageType[1].name = 'ListJobsInput';

      fd.messageType[0].field = [
        new plugin.google.protobuf.FieldDescriptorProto(),
      ];
      fd.messageType[0].field[0] = new plugin.google.protobuf.FieldDescriptorProto();
      fd.messageType[0].field[0].name = 'next_page_token';
      fd.messageType[0].field[0].label =
        plugin.google.protobuf.FieldDescriptorProto.Label.LABEL_REPEATED;
      fd.messageType[1].field = [
        new plugin.google.protobuf.FieldDescriptorProto(),
      ];
      fd.messageType[1].field[0] = new plugin.google.protobuf.FieldDescriptorProto();
      fd.messageType[1].field[0].name = 'page_size';
      fd.messageType[1].field[1] = new plugin.google.protobuf.FieldDescriptorProto();
      fd.messageType[1].field[1].name = 'page_token';
      const options: Options = {
        grpcServiceConfig: new plugin.grpc.service_config.ServiceConfig(),
      };
      const allMessages: MessagesMap = {};
      fd.messageType
        .filter(message => message.name)
        .forEach(message => {
          allMessages['.' + fd.package! + '.' + message.name!] = message;
        });
      const commentsMap = new CommentsMap([fd]);
      const proto = new Proto({
        fd,
        packageName: 'google.cloud.talent.v4beta1',
        allMessages,
        allResourceDatabase: new ResourceDatabase(),
        resourceDatabase: new ResourceDatabase(),
        options,
        commentsMap,
      });
      assert.deepStrictEqual(
        proto.services['service'].method[0].pagingFieldName,
        undefined
      );
      assert.deepStrictEqual(
        proto.services['service'].method[1].pagingFieldName,
        undefined
      );
      assert.deepStrictEqual(
        proto.services['service'].method[2].pagingFieldName,
        undefined
      );
      assert.deepStrictEqual(
        proto.services['service'].method[3].pagingFieldName,
        'next_page_token'
      );
    });
  });
});
