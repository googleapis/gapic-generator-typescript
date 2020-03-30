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

import * as plugin from '../../../pbjs-genfiles/plugin';
import {commonPrefix} from '../util';
import {API} from './api';
import {BundleConfig} from 'src/bundle';

export interface Options {
  grpcServiceConfig: plugin.grpc.service_config.ServiceConfig;
  bundleConfigs?: BundleConfig[];
  publishName?: string;
  mainServiceName?: string;
  iamService?: boolean;
}

export class Naming {
  name: string;
  namespace: string[];
  version: string;
  productName: string;
  protoPackage: string;

  constructor(
    fileDescriptors: plugin.google.protobuf.IFileDescriptorProto[],
    options?: Options
  ) {
    let rootPackage = '';
    const mainServiceName = options ? options.mainServiceName : '';
    const protoPackages = fileDescriptors
      .filter(fd => fd.service && fd.service.length > 0)
      .filter(fd => !API.isIgnoredService(fd))
      .map(fd => fd.package || '');
    const prefix = commonPrefix(protoPackages);
    // common prefix must either end with `.`, or be equal to at least one of
    // the packages' prefix
    const invalidPrefix =
      !prefix.endsWith('.') && !protoPackages.some(pkg => pkg === prefix);
    if (invalidPrefix && mainServiceName) {
      rootPackage = this.checkServiceInPackage(protoPackages, mainServiceName);
    }
    if (invalidPrefix && !mainServiceName) {
      throw new Error('Protos provided have different proto packages.');
    }
    if (!invalidPrefix) {
      rootPackage = prefix.replace(/\.$/, '');
    }
    const segments = rootPackage.split('.');
    if (!segments || segments.length < 2) {
      throw new Error(`Cannot parse package name ${rootPackage}.`);
    }
    const version = segments[segments.length - 1];
    // version should follow the pattern of 'v1' or 'v1alpha1'
    const versionPattern = /^((v[0-9]+(p[0-9]+)?((alpha|beta)[0-9]+)?[^.]*))?$/;
    if (!version.match(versionPattern)) {
      throw new Error(
        `Cannot parse package name ${rootPackage}: version does not match ${versionPattern}.`
      );
    }
    const name = segments[segments.length - 2];
    const namespaces = segments.slice(0, -2).join('.');
    this.name = name.capitalize();
    this.productName = this.name;
    this.namespace = namespaces.replace(/\.$/, '').split('.');
    this.version = version || '';
    this.protoPackage = rootPackage;

    if (!this.version && protoPackages.length > 1) {
      throw new Error(
        'All protos must have the same proto package up to and including the version.'
      );
    }
  }

  private checkServiceInPackage(
    protoPackages: string[],
    mainServiceName: string
  ) {
    for (const packageName of protoPackages) {
      if (packageName.indexOf(mainServiceName.toLowerCase()) !== -1) {
        return packageName;
      }
    }
    return '';
  }
}
