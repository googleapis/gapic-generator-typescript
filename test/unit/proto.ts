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

import * as moduleAlias from 'module-alias';
import * as path from 'path';
moduleAlias.addAlias(
  'gapic_generator_typescript',
  path.join(__dirname, '..', '..')
);
import * as assert from 'assert';
import {describe, it} from 'mocha';
import * as protos from 'gapic_generator_typescript/protos';
import {
  getHeaderRequestParams,
  MessagesMap,
} from 'gapic_generator_typescript/src/schema/proto';
import {Proto} from 'gapic_generator_typescript/src/schema/proto';
import {Options} from 'gapic_generator_typescript/src/schema/naming';
import {ResourceDatabase} from 'gapic_generator_typescript/src/schema/resource-database';
import {CommentsMap} from 'gapic_generator_typescript/src/schema/comments';

describe('src/schema/proto.ts', () => {
  describe('should get header parameters from http rule', () => {
    it('works with no parameter', () => {
      const httpRule: protos.google.api.IHttpRule = {
        post: '{=abc/*/d/*/ef/}',
      };
      assert.deepStrictEqual([], getHeaderRequestParams(httpRule));
    });

    it('works only one parameter', () => {
      const httpRule: protos.google.api.IHttpRule = {
        post: '{param1=abc/*/d/*/ef/}',
      };
      assert.deepStrictEqual([['param1']], getHeaderRequestParams(httpRule));
    });

    it('works with multiple parameter', () => {
      const httpRule: protos.google.api.IHttpRule = {
        post: '{param1.param2.param3=abc/*/d/*/ef/}',
      };
      assert.deepStrictEqual(
        [['param1', 'param2', 'param3']],
        getHeaderRequestParams(httpRule)
      );
    });

    it('works with additional bindings', () => {
      const httpRule: protos.google.api.IHttpRule = {
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
      const httpRule: protos.google.api.IHttpRule = {
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
      const fd = new protos.google.protobuf.FileDescriptorProto();
      fd.name = 'google/cloud/talent/v4beta1/service.proto';
      fd.package = 'google.cloud.talent.v4beta1';
      fd.service = [new protos.google.protobuf.ServiceDescriptorProto()];
      fd.service[0].name = 'service';
      fd.service[0].method = [
        new protos.google.protobuf.MethodDescriptorProto(),
      ];
      fd.service[0].method[0] = new protos.google.protobuf.MethodDescriptorProto();
      fd.service[0].method[0].name = 'SearchJobs';
      fd.service[0].method[1] = new protos.google.protobuf.MethodDescriptorProto();
      fd.service[0].method[1].name = 'SearchProfiles';
      fd.service[0].method[2] = new protos.google.protobuf.MethodDescriptorProto();
      fd.service[0].method[2].name = 'SearchJobsForAlert';
      fd.service[0].method[3] = new protos.google.protobuf.MethodDescriptorProto();
      fd.service[0].method[3].name = 'ListJobs';
      fd.service[0].method[3].outputType =
        '.google.cloud.talent.v4beta1.ListJobsOutput';
      fd.service[0].method[3].inputType =
        '.google.cloud.talent.v4beta1.ListJobsInput';

      fd.messageType = [new protos.google.protobuf.DescriptorProto()];
      fd.messageType[0] = new protos.google.protobuf.DescriptorProto();
      fd.messageType[1] = new protos.google.protobuf.DescriptorProto();

      fd.messageType[0].name = 'ListJobsOutput';
      fd.messageType[1].name = 'ListJobsInput';

      fd.messageType[0].field = [
        new protos.google.protobuf.FieldDescriptorProto(),
      ];
      fd.messageType[0].field[0] = new protos.google.protobuf.FieldDescriptorProto();
      fd.messageType[0].field[0].name = 'next_page_token';
      fd.messageType[0].field[0].label =
        protos.google.protobuf.FieldDescriptorProto.Label.LABEL_REPEATED;
      fd.messageType[1].field = [
        new protos.google.protobuf.FieldDescriptorProto(),
      ];
      fd.messageType[1].field[0] = new protos.google.protobuf.FieldDescriptorProto();
      fd.messageType[1].field[0].name = 'page_size';
      fd.messageType[1].field[1] = new protos.google.protobuf.FieldDescriptorProto();
      fd.messageType[1].field[1].name = 'page_token';
      const options: Options = {
        grpcServiceConfig: new protos.grpc.service_config.ServiceConfig(),
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
  describe('throw error for misconfigured LRO', () => {
    it('throw error if method returns Operation, but without operation_info option', () => {
      const fd = new protos.google.protobuf.FileDescriptorProto();
      fd.name = 'google/cloud/showcase/v1beta1/test.proto';
      fd.package = 'google.cloud.showcase.v1beta1';
      fd.service = [new protos.google.protobuf.ServiceDescriptorProto()];
      fd.service[0].name = 'service';
      fd.service[0].method = [
        new protos.google.protobuf.MethodDescriptorProto(),
      ];
      fd.service[0].method[0] = new protos.google.protobuf.MethodDescriptorProto();
      fd.service[0].method[0].name = 'Test';
      fd.service[0].method[0].outputType = '.google.longrunning.Operation';
      const options: Options = {
        grpcServiceConfig: new protos.grpc.service_config.ServiceConfig(),
      };
      const allMessages: MessagesMap = {};
      fd.messageType
        .filter(message => message.name)
        .forEach(message => {
          allMessages['.' + fd.package! + '.' + message.name!] = message;
        });
      const commentsMap = new CommentsMap([fd]);
      assert.throws(() => {
        new Proto({
          fd,
          packageName: 'google.cloud.showcase.v1beta1',
          allMessages,
          allResourceDatabase: new ResourceDatabase(),
          resourceDatabase: new ResourceDatabase(),
          options,
          commentsMap,
        });
      }, 'rpc "google.cloud.showcase.v1beta1.Test" returns google.longrunning.Operation but is missing option google.longrunning.operation_info');
    });
    it('throw error if method returns Operation, but without operation_info option', () => {
      const fd = new protos.google.protobuf.FileDescriptorProto();
      fd.name = 'google/cloud/showcase/v1beta1/test.proto';
      fd.package = 'google.cloud.showcase.v1beta1';
      fd.service = [new protos.google.protobuf.ServiceDescriptorProto()];
      fd.service[0].name = 'service';
      fd.service[0].method = [
        new protos.google.protobuf.MethodDescriptorProto(),
      ];
      fd.service[0].method[0] = new protos.google.protobuf.MethodDescriptorProto();
      fd.service[0].method[0].name = 'Test';
      fd.service[0].method[0].outputType = '.google.longrunning.Operation';
      const options: Options = {
        grpcServiceConfig: new protos.grpc.service_config.ServiceConfig(),
      };
      fd.service[0].method[0].options = new protos.google.protobuf.MethodOptions();
      fd.service[0].method[0].options['.google.longrunning.operationInfo'] = {};
      const allMessages: MessagesMap = {};
      fd.messageType
        .filter(message => message.name)
        .forEach(message => {
          allMessages['.' + fd.package! + '.' + message.name!] = message;
        });
      const commentsMap = new CommentsMap([fd]);
      assert.throws(() => {
        new Proto({
          fd,
          packageName: 'google.cloud.showcase.v1beta1',
          allMessages,
          allResourceDatabase: new ResourceDatabase(),
          resourceDatabase: new ResourceDatabase(),
          options,
          commentsMap,
        });
      }, /rpc "google.cloud.showcase.v1beta1.Test" has google.longrunning.operation_info but is missing option google.longrunning.operation_info.metadata_type/);
    });
  });
});
