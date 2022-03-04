// Copyright 2020 Google LLC
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

import {API} from '../../src/schema/api';
import * as protos from '../../../protos';
import * as assert from 'assert';
import {afterEach, describe, it} from 'mocha';
import * as sinon from 'sinon';
import * as proto from '../../src/schema/proto';

describe('src/schema/api.ts', () => {
  it('should construct an API object and return list of protos', () => {
    const fd = new protos.google.protobuf.FileDescriptorProto();
    fd.name = 'google/cloud/test/v1/test.proto';
    fd.package = 'google.cloud.test.v1';
    fd.service = [new protos.google.protobuf.ServiceDescriptorProto()];
    fd.service[0].name = 'ZService';
    fd.service[0].options = {
      '.google.api.defaultHost': 'hostname.example.com:443',
    };
    const api = new API([fd], 'google.cloud.test.v1', {
      grpcServiceConfig: new protos.grpc.service_config.ServiceConfig(),
    });
    assert.deepStrictEqual(api.filesToGenerate, [
      'google/cloud/test/v1/test.proto',
    ]);
  });

  it('throw error if an api does not have default host', () => {
    const fd = new protos.google.protobuf.FileDescriptorProto();
    fd.name = 'google/cloud/test/v1/test.proto';
    fd.package = 'google.cloud.test.v1';
    fd.service = [new protos.google.protobuf.ServiceDescriptorProto()];
    fd.service[0].name = 'ZService';
    assert.throws(() => {
      new API([fd], 'google.cloud.test.v1', {
        grpcServiceConfig: new protos.grpc.service_config.ServiceConfig(),
      });
    }, /service "google.cloud.test.v1.ZService" is missing option google.api.default_host/);
  });

  it('should not return common protos in the list of protos', () => {
    const fd1 = new protos.google.protobuf.FileDescriptorProto();
    fd1.name = 'google/cloud/test/v1/test.proto';
    fd1.package = 'google.cloud.test.v1';
    fd1.service = [new protos.google.protobuf.ServiceDescriptorProto()];
    fd1.service[0].name = 'ZService';
    fd1.service[0].options = {
      '.google.api.defaultHost': 'hostname.example.com:443',
    };
    const fd2 = new protos.google.protobuf.FileDescriptorProto();
    fd2.name = 'google/longrunning/operation.proto';
    fd2.package = 'google.longrunning';
    fd2.service = [new protos.google.protobuf.ServiceDescriptorProto()];
    const fd3 = new protos.google.protobuf.FileDescriptorProto();
    fd3.name = 'google/iam/v1/iam_policy.proto';
    fd3.package = 'google.iam.v1';
    fd3.service = [new protos.google.protobuf.ServiceDescriptorProto()];
    const api = new API([fd1, fd2, fd3], 'google.cloud.test.v1', {
      grpcServiceConfig: new protos.grpc.service_config.ServiceConfig(),
    });
    assert.deepStrictEqual(api.filesToGenerate, [
      'google/cloud/test/v1/test.proto',
    ]);
  });

  it('should be able to generate google.iam.v1 alone', () => {
    const fd = new protos.google.protobuf.FileDescriptorProto();
    fd.name = 'google/iam/v1/iam_policy.proto';
    fd.package = 'google.iam.v1';
    fd.service = [new protos.google.protobuf.ServiceDescriptorProto()];
    fd.service[0].name = 'IAMPolicy';
    fd.service[0].options = {
      '.google.api.defaultHost': 'iam.googleapis.com',
    };
    const api = new API([fd], 'google.iam.v1', {
      grpcServiceConfig: new protos.grpc.service_config.ServiceConfig(),
    });
    assert.deepStrictEqual(api.filesToGenerate, [
      'google/iam/v1/iam_policy.proto',
    ]);
  });

  it('should not return common protos in the proto list', () => {
    const fd1 = new protos.google.protobuf.FileDescriptorProto();
    fd1.name = 'google/cloud/test/v1/test.proto';
    fd1.package = 'google.cloud.test.v1';
    fd1.service = [new protos.google.protobuf.ServiceDescriptorProto()];
    fd1.service[0].name = 'ZService';
    fd1.service[0].options = {
      '.google.api.defaultHost': 'hostname.example.com:443',
    };
    const fd2 = new protos.google.protobuf.FileDescriptorProto();
    fd2.name = 'google/api/annotations.proto';
    fd2.package = 'google.api';
    const fd3 = new protos.google.protobuf.FileDescriptorProto();
    fd3.name = 'google/orgpolicy/v1/orgpolicy.proto';
    fd3.package = 'google.orgpolicy.v1';
    const fd4 = new protos.google.protobuf.FileDescriptorProto();
    fd4.name = 'google/cloud/common_resources.proto';
    fd4.package = 'google.cloud';
    const fd5 = new protos.google.protobuf.FileDescriptorProto();
    fd5.name = 'google/api/servicemanagement/v1/servicemanager.proto';
    fd5.package = 'google.api.servicemanager.v1';
    const fd6 = new protos.google.protobuf.FileDescriptorProto();
    fd6.name = 'google/rpc/context/attribute_context.proto';
    fd6.package = 'google.rpc.context';
    const api = new API([fd1, fd2, fd3, fd4, fd5, fd6], 'google', {
      grpcServiceConfig: new protos.grpc.service_config.ServiceConfig(),
    });
    assert.deepStrictEqual(api.filesToGenerate, [
      'google/cloud/test/v1/test.proto',
      'google/orgpolicy/v1/orgpolicy.proto',
      'google/api/servicemanagement/v1/servicemanager.proto',
    ]);
  });

  it('should include the protos has no service and different package name', () => {
    const fd1 = new protos.google.protobuf.FileDescriptorProto();
    fd1.name = 'google/cloud/example/v1/test.proto';
    fd1.package = 'google.cloud.example.v1';

    fd1.service = [new protos.google.protobuf.ServiceDescriptorProto()];
    fd1.service[0].name = 'Service';
    fd1.service[0].options = {
      '.google.api.defaultHost': 'hostname.example.com:443',
    };
    const fd2 = new protos.google.protobuf.FileDescriptorProto();
    fd2.name = 'google/cloud/example/v1/error.proto';
    fd2.package = 'google.cloud.example.v1.errors';
    const api = new API([fd1, fd2], 'google.cloud.example.v1', {
      grpcServiceConfig: new protos.grpc.service_config.ServiceConfig(),
    });
    assert.deepStrictEqual(JSON.parse(api.protoFilesToGenerateJSON), [
      '../../protos/google/cloud/example/v1/error.proto',
      '../../protos/google/cloud/example/v1/test.proto',
    ]);
  });

  it('should return lexicographically first service name as mainServiceName', () => {
    const fd1 = new protos.google.protobuf.FileDescriptorProto();
    fd1.name = 'google/cloud/test/v1/test.proto';
    fd1.package = 'google.cloud.test.v1';
    fd1.service = [new protos.google.protobuf.ServiceDescriptorProto()];
    fd1.service[0].name = 'ZService';
    fd1.service[0].options = {
      '.google.api.defaultHost': 'hostname.example.com:443',
    };
    const fd2 = new protos.google.protobuf.FileDescriptorProto();
    fd2.name = 'google/cloud/example/v1/example.proto';
    fd2.package = 'google.cloud.example.v1';
    fd2.service = [new protos.google.protobuf.ServiceDescriptorProto()];
    fd2.service[0].name = 'AService';
    fd2.service[0].options = {
      '.google.api.defaultHost': 'hostname.example.com:443',
    };
    const api = new API([fd1, fd2], 'google.cloud.test.v1', {
      grpcServiceConfig: new protos.grpc.service_config.ServiceConfig(),
    });
    assert.deepStrictEqual(api.mainServiceName, 'AService');
  });

  it('should return correct mainServiceName for API without namespace', () => {
    const fd1 = new protos.google.protobuf.FileDescriptorProto();
    fd1.name = 'service/v1/test.proto';
    fd1.package = 'service.v1';
    fd1.service = [new protos.google.protobuf.ServiceDescriptorProto()];
    fd1.service[0].name = 'Service';
    fd1.service[0].options = {
      '.google.api.defaultHost': 'hostname.example.com:443',
    };
    const api = new API([fd1], 'service.v1', {
      grpcServiceConfig: new protos.grpc.service_config.ServiceConfig(),
    });
    assert.deepStrictEqual(api.mainServiceName, 'Service');
  });

  it('should return main service name specificed as an option', () => {
    const fd1 = new protos.google.protobuf.FileDescriptorProto();
    fd1.name = 'google/cloud/test/v1/test.proto';
    fd1.package = 'google.cloud.test.v1';
    fd1.service = [new protos.google.protobuf.ServiceDescriptorProto()];
    fd1.service[0].name = 'ZService';
    fd1.service[0].options = {
      '.google.api.defaultHost': 'hostname.example.com:443',
    };
    const fd2 = new protos.google.protobuf.FileDescriptorProto();
    fd2.name = 'google/cloud/example/v1/example.proto';
    fd2.package = 'google.cloud.example.v1';
    fd2.service = [new protos.google.protobuf.ServiceDescriptorProto()];
    fd2.service[0].name = 'AService';
    fd2.service[0].options = {
      '.google.api.defaultHost': 'hostname.example.com:443',
    };
    const api = new API([fd1, fd2], 'google.cloud.test.v1', {
      grpcServiceConfig: new protos.grpc.service_config.ServiceConfig(),
      mainServiceName: 'OverriddenName',
    });
    assert.deepStrictEqual(api.mainServiceName, 'OverriddenName');
  });

  it('should return list of protos in lexicographical order', () => {
    const fd1 = new protos.google.protobuf.FileDescriptorProto();
    fd1.name = 'google/cloud/example/v1/test.proto';
    fd1.package = 'google.cloud.example.v1';

    fd1.service = [new protos.google.protobuf.ServiceDescriptorProto()];
    fd1.service[0].name = 'Service';
    fd1.service[0].options = {
      '.google.api.defaultHost': 'hostname.example.com:443',
    };
    const fd2 = new protos.google.protobuf.FileDescriptorProto();
    fd2.name = 'google/cloud/example/v1/example.proto';
    fd2.package = 'google.cloud.example.v1';
    fd2.service = [];
    const api = new API([fd1, fd2], 'google.cloud.example.v1', {
      grpcServiceConfig: new protos.grpc.service_config.ServiceConfig(),
    });
    assert.deepStrictEqual(JSON.parse(api.protoFilesToGenerateJSON), [
      '../../protos/google/cloud/example/v1/example.proto',
      '../../protos/google/cloud/example/v1/test.proto',
    ]);
  });

  it('should throw error when the service name is not found', () => {
    const fd = new protos.google.protobuf.FileDescriptorProto();
    fd.name = 'google/cloud/test/v1/test.proto';
    fd.package = 'google.cloud.test.v1';
    fd.service = [new protos.google.protobuf.ServiceDescriptorProto()];
    assert.throws(() => {
      const api = new API([fd], 'google.cloud.test.v1', {
        grpcServiceConfig: new protos.grpc.service_config.ServiceConfig(),
      });
      assert(api);
    });
  });

  describe('Calling Proto constructor', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('should pass all messages to Proto constructor', () => {
      const fd1 = new protos.google.protobuf.FileDescriptorProto();
      fd1.name = 'google/cloud/example/v1/test.proto';
      fd1.package = 'google.cloud.example.v1';

      fd1.service = [new protos.google.protobuf.ServiceDescriptorProto()];
      fd1.service[0].name = 'Service';
      fd1.service[0].options = {
        '.google.api.defaultHost': 'hostname.example.com:443',
      };
      fd1.messageType = [new protos.google.protobuf.MethodDescriptorProto()];
      fd1.messageType[0].name = 'MessageA';

      const fd2 = new protos.google.protobuf.FileDescriptorProto();
      fd2.name = 'google/cloud/example/v1/example.proto';
      fd2.package = 'google.cloud.example.v1';
      fd2.messageType = [new protos.google.protobuf.MethodDescriptorProto()];
      fd2.messageType[0].name = 'MessageB';

      const spy = sinon.spy(proto, 'Proto');

      new API([fd1, fd2], 'google.cloud.example.v1', {
        grpcServiceConfig: new protos.grpc.service_config.ServiceConfig(),
      });

      assert(spy.calledWithNew());
      assert.strictEqual(spy.callCount, 2); // one Proto object created for each fd
      const firstCallMessages = spy.getCall(0).args[0].allMessages;
      const secondCallMessages = spy.getCall(1).args[0].allMessages;
      assert('.google.cloud.example.v1.MessageA' in firstCallMessages);
      assert('.google.cloud.example.v1.MessageB' in firstCallMessages);
      assert('.google.cloud.example.v1.MessageA' in secondCallMessages);
      assert('.google.cloud.example.v1.MessageB' in secondCallMessages);
    });
  });
});
