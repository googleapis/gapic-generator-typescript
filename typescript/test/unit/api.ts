import { API } from '../../src/schema/api';
import * as plugin from '../../../pbjs-genfiles/plugin';
import * as assert from 'assert';

describe('schema/api.ts', () => {
  it('should construct an API object and return list of protos', () => {
    const fd = new plugin.google.protobuf.FileDescriptorProto();
    fd.name = 'google/cloud/test/v1/test.proto';
    fd.package = 'google.cloud.test.v1';
    fd.service = [new plugin.google.protobuf.ServiceDescriptorProto()];
    const api = new API(
      [fd],
      'google.cloud.test.v1',
      new plugin.grpc.service_config.ServiceConfig()
    );
    assert.deepStrictEqual(api.filesToGenerate, [
      'google/cloud/test/v1/test.proto',
    ]);
  });

  it('should not return common protos in the list of protos', () => {
    const fd1 = new plugin.google.protobuf.FileDescriptorProto();
    fd1.name = 'google/cloud/test/v1/test.proto';
    fd1.package = 'google.cloud.test.v1';
    fd1.service = [new plugin.google.protobuf.ServiceDescriptorProto()];
    const fd2 = new plugin.google.protobuf.FileDescriptorProto();
    fd2.name = 'google/longrunning/operation.proto';
    fd2.package = 'google.longrunning';
    fd2.service = [new plugin.google.protobuf.ServiceDescriptorProto()];
    const api = new API(
      [fd1, fd2],
      'google.cloud.test.v1',
      new plugin.grpc.service_config.ServiceConfig()
    );
    assert.deepStrictEqual(api.filesToGenerate, [
      'google/cloud/test/v1/test.proto',
    ]);
  });
});
