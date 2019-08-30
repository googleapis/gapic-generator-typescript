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

import * as plugin from '../../pbjs-genfiles/plugin';
import {Naming} from '../src/schema/naming';

describe('schema/naming.ts', () => {
  it('parses name correctly', () => {
    const descriptor1 = new plugin.google.protobuf.FileDescriptorProto();
    const descriptor2 = new plugin.google.protobuf.FileDescriptorProto();
    descriptor1.package = 'google.namespace.service.v1beta1';
    descriptor2.package = 'google.namespace.service.v1beta1';
    const naming = new Naming([descriptor1, descriptor2]);
    assert.strictEqual(naming.name, 'Service');
    assert.strictEqual(naming.productName, 'Service');
    assert.deepEqual(naming.namespace, ['google', 'namespace']);
    assert.strictEqual(naming.version, 'v1beta1');
    assert.strictEqual(naming.protoPackage, 'google.namespace.service.v1beta1');
  });

  it('fails on bad package name 1', () => {
    const descriptor = new plugin.google.protobuf.FileDescriptorProto();
    descriptor.package = 'nonamespace';
    assert.throws(() => {
      const naming = new Naming([descriptor]);
    });
  });

  it('fails on bad package name 2', () => {
    const descriptor = new plugin.google.protobuf.FileDescriptorProto();
    descriptor.package = '---';
    assert.throws(() => {
      const naming = new Naming([descriptor]);
    });
  });

  it('fails on no package name', () => {
    const descriptor = new plugin.google.protobuf.FileDescriptorProto();
    descriptor.package = '';
    assert.throws(() => {
      const naming = new Naming([descriptor]);
    });
  });

  it('fails if no common package', () => {
    const descriptor1 = new plugin.google.protobuf.FileDescriptorProto();
    const descriptor2 = new plugin.google.protobuf.FileDescriptorProto();
    descriptor1.package = 'namespace1.service.v1beta1';
    descriptor2.package = 'namespace2.service.v1beta1';
    assert.throws(() => {
      const naming = new Naming([descriptor1, descriptor2]);
    });
  });

  it('fails if different versions', () => {
    const descriptor1 = new plugin.google.protobuf.FileDescriptorProto();
    const descriptor2 = new plugin.google.protobuf.FileDescriptorProto();
    descriptor1.package = 'namespace.service.v1beta1';
    descriptor2.package = 'namespace.service.v1beta2';
    assert.throws(() => {
      const naming = new Naming([descriptor1, descriptor2]);
    });
  });

  it('fails if not all packages have versions', () => {
    const descriptor1 = new plugin.google.protobuf.FileDescriptorProto();
    const descriptor2 = new plugin.google.protobuf.FileDescriptorProto();
    descriptor1.package = 'namespace.service.v1beta1';
    descriptor2.package = 'namespace.service';
    assert.throws(() => {
      const naming = new Naming([descriptor1, descriptor2]);
    });
  });
});