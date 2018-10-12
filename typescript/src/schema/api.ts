import * as plugin from '../../../pbjs-genfiles/plugin';

import {Naming} from './naming';
import {Proto} from './proto';

export class API {
  naming: Naming;
  protos: {[filename: string]: Proto};

  constructor(
      fileDescriptors: plugin.google.protobuf.IFileDescriptorProto[],
      packageName: string) {
    this.naming = new Naming(fileDescriptors.filter(
        fd => fd.package && fd.package.startsWith(packageName)));
    this.protos = {};
  }
}
