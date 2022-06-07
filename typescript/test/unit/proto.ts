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
import * as protos from '../../../protos';
import {
  convertFieldToCamelCase,
  DynamicRoutingParameters,
  getDynamicHeaderRequestParams,
  getHeaderRequestParams,
  getSingleRoutingHeaderParam,
  MessagesMap,
} from '../../src/schema/proto';
import {Proto} from '../../src/schema/proto';
import {Options} from '../../src/schema/naming';
import {ResourceDatabase} from '../../src/schema/resource-database';
import {CommentsMap} from '../../src/schema/comments';

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

    it('works with multiple variables', () => {
      const httpRule: protos.google.api.IHttpRule = {
        get: 'v1/param1/{foo}/param2/{bar}/',
        additionalBindings: [
          {
            get: 'v1/param1/{foo}',
          },
        ],
      };
      assert.deepStrictEqual(
        [['foo'], ['bar']],
        getHeaderRequestParams(httpRule)
      );
    });
  });

  describe('should get all the dynamic routing header parameters from routing parameters rule', () => {
    it('returns array with an empty rule if an annotation is malformed', () => {
      const routingParameters: protos.google.api.IRoutingParameter[] = [
        {
          field: 'name',
          pathTemplate: 'test/database',
        },
      ];
      const expectedRoutingParameters: DynamicRoutingParameters[][] = [
        [
          {
            fieldRetrieve: [],
            fieldSend: '',
            messageRegex: '',
            namedSegment: '',
          },
        ],
      ];
      assert.deepStrictEqual(
        expectedRoutingParameters,
        getDynamicHeaderRequestParams(routingParameters)
      );
    });
    it('works with a couple rules with the same parameter', () => {
      const routingParameters: protos.google.api.IRoutingParameter[] = [
        {
          field: 'name',
          pathTemplate: '{routing_id=projects/*}/**}',
        },
        {
          field: 'database',
          pathTemplate: '{routing_id=**}',
        },
        {
          field: 'database',
          pathTemplate: '{routing_id=projects/*/databases/*}/documents/*/**',
        },
      ];
      const expectedRoutingParameters: DynamicRoutingParameters[][] = [
        [
          {
            fieldRetrieve: ['name'],
            fieldSend: 'routing_id',
            messageRegex: '(?<routing_id>projects)/[^/]+(?:/.*)?',
            namedSegment: '(?<routing_id>projects/[^/]+)',
          },
          {
            fieldRetrieve: ['database'],
            fieldSend: 'routing_id',
            messageRegex: '(?<routing_id>(?:/.*)?)',
            namedSegment: '(?<routing_id>.*)',
          },
          {
            fieldRetrieve: ['database'],
            fieldSend: 'routing_id',
            messageRegex:
              '(?<routing_id>projects)/[^/]+/databases/[^/]+/documents/[^/]+(?:/.*)?',
            namedSegment: '(?<routing_id>projects/[^/]+/databases/[^/]+)',
          },
        ],
      ];
      assert.deepStrictEqual(
        expectedRoutingParameters,
        getDynamicHeaderRequestParams(routingParameters)
      );
    });
    it('works with a couple rules with different parameters', () => {
      const routingParameters: protos.google.api.IRoutingParameter[] = [
        {
          field: 'name',
          pathTemplate: '{routing_id=projects/*}/**}',
        },
        {
          field: 'app_profile_id',
          pathTemplate: '{profile_id=projects/*}/**',
        },
      ];
      const expectedRoutingParameters: DynamicRoutingParameters[][] = [
        [
          {
            fieldRetrieve: ['name'],
            fieldSend: 'routing_id',
            messageRegex: '(?<routing_id>projects)/[^/]+(?:/.*)?',
            namedSegment: '(?<routing_id>projects/[^/]+)',
          },
        ],
        [
          {
            fieldRetrieve: ['appProfileId'],
            fieldSend: 'profile_id',
            messageRegex: '(?<profile_id>projects)/[^/]+(?:/.*)?',
            namedSegment: '(?<profile_id>projects/[^/]+)',
          },
        ],
      ];
      assert.deepStrictEqual(
        expectedRoutingParameters,
        getDynamicHeaderRequestParams(routingParameters)
      );
    });
    it('works with a several rules with different parameters', () => {
      const routingParameters: protos.google.api.IRoutingParameter[] = [
        {
          field: 'name',
          pathTemplate: '{routing_id=projects/*}/**}',
        },
        {
          field: 'name',
          pathTemplate:
            'test/{routing_id=projects/*/databases/*}/documents/*/**',
        },
        {
          field: 'app_profile_id',
          pathTemplate: '{profile_id=projects/*}/**',
        },
      ];
      const expectedRoutingParameters: DynamicRoutingParameters[][] = [
        [
          {
            fieldRetrieve: ['name'],
            fieldSend: 'routing_id',
            messageRegex: '(?<routing_id>projects)/[^/]+(?:/.*)?',
            namedSegment: '(?<routing_id>projects/[^/]+)',
          },
          {
            fieldRetrieve: ['name'],
            fieldSend: 'routing_id',
            messageRegex:
              'test/(?<routing_id>projects)/[^/]+/databases/[^/]+/documents/[^/]+(?:/.*)?',
            namedSegment: '(?<routing_id>projects/[^/]+/databases/[^/]+)',
          },
        ],
        [
          {
            fieldRetrieve: ['appProfileId'],
            fieldSend: 'profile_id',
            messageRegex: '(?<profile_id>projects)/[^/]+(?:/.*)?',
            namedSegment: '(?<profile_id>projects/[^/]+)',
          },
        ],
      ];
      assert.deepStrictEqual(
        expectedRoutingParameters,
        getDynamicHeaderRequestParams(routingParameters)
      );
    });
  });

  describe('should return a string set to camelCase', () => {
    it('should return this to camelCase', () => {
      assert.deepStrictEqual(convertFieldToCamelCase('name.name2.name3'), [
        'name',
        'name2',
        'name3',
      ]);
      assert.deepStrictEqual(convertFieldToCamelCase(''), []);
      assert.deepStrictEqual(convertFieldToCamelCase('parent_id'), [
        'parentId',
      ]);
      assert.deepStrictEqual(convertFieldToCamelCase('app_profile_id'), [
        'appProfileId',
      ]);
      assert.deepStrictEqual(
        convertFieldToCamelCase('name.parent_id.another_parent_id'),
        ['name', 'parentId', 'anotherParentId']
      );
    });
  });

  describe('should get return an array from a single routing parameters rule', () => {
    it('should return an empty DynamicRoutingParameters interface if the annotation is malformed', () => {
      const routingRule: protos.google.api.IRoutingParameter = {
        field: 'name',
        pathTemplate: 'test/database',
      };
      const expectedRoutingParameters: DynamicRoutingParameters = {
        fieldRetrieve: [],
        fieldSend: '',
        messageRegex: '',
        namedSegment: '',
      };
      assert.deepStrictEqual(
        expectedRoutingParameters,
        getSingleRoutingHeaderParam(routingRule)
      );
    });
    it('works with no parameters', () => {
      const routingRule: protos.google.api.IRoutingParameter = {};
      const expectedRoutingParameters: DynamicRoutingParameters = {
        fieldRetrieve: [],
        fieldSend: '',
        messageRegex: '',
        namedSegment: '',
      };
      assert.deepStrictEqual(
        expectedRoutingParameters,
        getSingleRoutingHeaderParam(routingRule)
      );
    });
    it('works with no path template', () => {
      const routingRule: protos.google.api.IRoutingParameter = {
        field: 'name',
      };
      const expectedRoutingParameters: DynamicRoutingParameters = {
        fieldRetrieve: ['name'],
        fieldSend: 'name',
        messageRegex: '[^/]+',
        namedSegment: '[^/]+',
      };
      assert.deepStrictEqual(
        expectedRoutingParameters,
        getSingleRoutingHeaderParam(routingRule)
      );
    });
    it('works with a basic path template', () => {
      const routingRule: protos.google.api.IRoutingParameter = {
        field: 'app_profile_id.parent_id',
        pathTemplate: '{routing_id=**}',
      };
      const expectedRoutingParameters: DynamicRoutingParameters = {
        fieldRetrieve: ['appProfileId', 'parentId'],
        fieldSend: 'routing_id',
        messageRegex: '(?<routing_id>(?:/.*)?)',
        namedSegment: '(?<routing_id>.*)',
      };
      assert.deepStrictEqual(
        expectedRoutingParameters,
        getSingleRoutingHeaderParam(routingRule)
      );
    });
    it('works with a standard path template', () => {
      const routingRule: protos.google.api.IRoutingParameter = {
        field: 'app_profile_id',
        pathTemplate: '{routing_id=projects/*}/**',
      };
      const expectedRoutingParameters: DynamicRoutingParameters = {
        fieldRetrieve: ['appProfileId'],
        fieldSend: 'routing_id',
        messageRegex: '(?<routing_id>projects)/[^/]+(?:/.*)?',
        namedSegment: '(?<routing_id>projects/[^/]+)',
      };
      assert.deepStrictEqual(
        expectedRoutingParameters,
        getSingleRoutingHeaderParam(routingRule)
      );
    });
  });

  describe('AugmentService', () => {
    it('should pass proto file name to the service', () => {
      const fd = new protos.google.protobuf.FileDescriptorProto();
      fd.name = 'google/cloud/showcase/v1beta1/test.proto';
      fd.package = 'google.cloud.showcase.v1beta1';
      fd.service = [new protos.google.protobuf.ServiceDescriptorProto()];
      fd.service[0].name = 'TestService';
      fd.service[0].method = [
        new protos.google.protobuf.MethodDescriptorProto(),
      ];
      fd.service[0].method[0] = new protos.google.protobuf.MethodDescriptorProto();
      fd.service[0].method[0].name = 'Test';
      fd.service[0].method[0].outputType =
        '.google.cloud.showcase.v1beta1.TestOutput';
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
        packageName: 'google.cloud.showcase.v1beta1',
        allMessages,
        allResourceDatabase: new ResourceDatabase(),
        resourceDatabase: new ResourceDatabase(),
        options,
        commentsMap,
      });
      assert.strictEqual(proto.services[fd.service[0].name].protoFile, fd.name);
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
    it("should allow generate a proto has no service and its package name differ from service's", () => {
      const fd = new protos.google.protobuf.FileDescriptorProto();
      fd.name = 'google/cloud/showcase/v1beta1/test.proto';
      fd.package = 'google.cloud.showcase.v1beta1.errors';
      const allMessages: MessagesMap = {};
      fd.messageType
        .filter(message => message.name)
        .forEach(message => {
          allMessages['.' + fd.package! + '.' + message.name!] = message;
        });
      const options: Options = {
        grpcServiceConfig: new protos.grpc.service_config.ServiceConfig(),
      };
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
      assert.deepStrictEqual(proto.fileToGenerate, true);
    });
    it("should not allow generate a service proto with package name differ from the param's pakage name", () => {
      const fd = new protos.google.protobuf.FileDescriptorProto();
      fd.name = 'google/cloud/showcase/v1beta1/test.proto';
      fd.package = 'google.cloud.showcase.v1beta1.TestService';
      fd.service = [new protos.google.protobuf.ServiceDescriptorProto()];
      fd.service[0].name = 'service';
      fd.service[0].method = [
        new protos.google.protobuf.MethodDescriptorProto(),
      ];
      fd.service[0].method[0] = new protos.google.protobuf.MethodDescriptorProto();
      fd.service[0].method[0].name = 'Test';
      fd.service[0].method[0].outputType =
        '.google.cloud.showcase.v1beta1.TestOutput';
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
        packageName: 'google.cloud.showcase.v1beta1.MainService',
        allMessages,
        allResourceDatabase: new ResourceDatabase(),
        resourceDatabase: new ResourceDatabase(),
        options,
        commentsMap,
      });
      assert.deepStrictEqual(proto.fileToGenerate, false);
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

  describe('should add diregapic option for Proto class', () => {
    it('should be false when diregapic is not set', () => {
      const fd = new protos.google.protobuf.FileDescriptorProto();
      const proto = new Proto({
        fd,
        packageName: 'google.cloud.example.v1beta1',
        allMessages: {},
        allResourceDatabase: new ResourceDatabase(),
        resourceDatabase: new ResourceDatabase(),
        options: {
          grpcServiceConfig: new protos.grpc.service_config.ServiceConfig(),
        },
        commentsMap: new CommentsMap([fd]),
      });
      assert.strictEqual(proto.diregapic, undefined);
    });
    it('should be true when diregapic is set', () => {
      const fd = new protos.google.protobuf.FileDescriptorProto();
      const proto = new Proto({
        fd,
        packageName: 'google.cloud.example.v1beta1',
        allMessages: {},
        allResourceDatabase: new ResourceDatabase(),
        resourceDatabase: new ResourceDatabase(),
        options: {
          grpcServiceConfig: new protos.grpc.service_config.ServiceConfig(),
          diregapic: true,
        },
        commentsMap: new CommentsMap([fd]),
      });
      assert.strictEqual(proto.diregapic, true);
    });
  });

  describe('should support pagination for non-gRPC APIs, diregapic mode', () => {
    it('should be page field if diregapic mode and use "max_results" as field name', () => {
      const fd = new protos.google.protobuf.FileDescriptorProto();
      fd.name = 'google/cloud/showcase/v1beta1/test.proto';
      fd.package = 'google.cloud.showcase.v1beta1';
      fd.service = [new protos.google.protobuf.ServiceDescriptorProto()];
      fd.service[0].name = 'service';
      fd.service[0].method = [
        new protos.google.protobuf.MethodDescriptorProto(),
      ];
      fd.service[0].method[0] = new protos.google.protobuf.MethodDescriptorProto();
      fd.service[0].method[0].name = 'List';
      fd.service[0].method[0].outputType =
        '.google.cloud.showcase.v1beta1.AddressList';
      fd.service[0].method[0].inputType =
        '.google.cloud.showcase.v1beta1.ListAddressesRequest';

      fd.messageType = [new protos.google.protobuf.DescriptorProto()];
      fd.messageType[0] = new protos.google.protobuf.DescriptorProto();
      fd.messageType[1] = new protos.google.protobuf.DescriptorProto();

      fd.messageType[0].name = 'AddressList';
      fd.messageType[1].name = 'ListAddressesRequest';

      fd.messageType[0].field = [
        new protos.google.protobuf.FieldDescriptorProto(),
      ];
      fd.messageType[0].field[0] = new protos.google.protobuf.FieldDescriptorProto();
      fd.messageType[0].field[0].name = 'next_page_token';
      fd.messageType[0].field[0].label =
        protos.google.protobuf.FieldDescriptorProto.Label.LABEL_REPEATED;
      fd.messageType[0].field[0].type =
        protos.google.protobuf.FieldDescriptorProto.Type.TYPE_MESSAGE;
      fd.messageType[0].field[0].typeName =
        '.google.cloud.showcase.v1beta1.Address';
      fd.messageType[1].field = [
        new protos.google.protobuf.FieldDescriptorProto(),
      ];
      fd.messageType[1].field[0] = new protos.google.protobuf.FieldDescriptorProto();
      fd.messageType[1].field[0].name = 'max_results';
      fd.messageType[1].field[1] = new protos.google.protobuf.FieldDescriptorProto();
      fd.messageType[1].field[1].name = 'page_token';
      const options: Options = {
        grpcServiceConfig: new protos.grpc.service_config.ServiceConfig(),
        diregapic: true,
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
        packageName: 'google.cloud.showcase.v1beta1',
        allMessages,
        allResourceDatabase: new ResourceDatabase(),
        resourceDatabase: new ResourceDatabase(),
        options,
        commentsMap,
      });
      assert.deepStrictEqual(
        proto.services['service'].method[0].pagingFieldName,
        'next_page_token'
      );
      assert.deepStrictEqual(proto.services['service'].paging[0].name, 'List');
      assert.deepStrictEqual(
        proto.services['service'].paging[0].inputType,
        '.google.cloud.showcase.v1beta1.ListAddressesRequest'
      );
      assert.deepStrictEqual(
        proto.services['service'].paging[0].outputType,
        '.google.cloud.showcase.v1beta1.AddressList'
      );
      assert.deepStrictEqual(
        proto.services['service'].paging[0].pagingResponseType,
        '.google.cloud.showcase.v1beta1.Address'
      );
    });
    it('should not be page field if api is not google discovery api but use "max_result"', () => {
      const fd = new protos.google.protobuf.FileDescriptorProto();
      fd.name = 'google/cloud/showcase/v1beta1/test.proto';
      fd.package = 'google.cloud.showcase.v1beta1';
      fd.service = [new protos.google.protobuf.ServiceDescriptorProto()];
      fd.service[0].name = 'service';
      fd.service[0].method = [
        new protos.google.protobuf.MethodDescriptorProto(),
      ];
      fd.service[0].method[0] = new protos.google.protobuf.MethodDescriptorProto();
      fd.service[0].method[0].name = 'List';
      fd.service[0].method[0].outputType =
        '.google.cloud.showcase.v1beta1.AddressList';
      fd.service[0].method[0].inputType =
        '.google.cloud.showcase.v1beta1.ListAddressesRequest';

      fd.messageType = [new protos.google.protobuf.DescriptorProto()];
      fd.messageType[0] = new protos.google.protobuf.DescriptorProto();
      fd.messageType[1] = new protos.google.protobuf.DescriptorProto();

      fd.messageType[0].name = 'AddressList';
      fd.messageType[1].name = 'ListAddressesRequest';

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
      fd.messageType[1].field[0].name = 'max_results';
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
        packageName: 'google.cloud.showcase.v1beta1',
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
      assert.deepStrictEqual(proto.services['service'].paging.length, 0);
    });
  });
});
