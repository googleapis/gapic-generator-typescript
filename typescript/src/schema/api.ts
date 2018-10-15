import * as plugin from '../../../pbjs-genfiles/plugin';

import {Naming} from './naming';
import {Proto} from './proto';

export type ProtosMap = {
  [filename: string]: Proto
};

export class API {
  naming: Naming;
  protos: ProtosMap;

  constructor(
      fileDescriptors: plugin.google.protobuf.IFileDescriptorProto[],
      packageName: string) {
    this.naming = new Naming(fileDescriptors.filter(
        fd => fd.package && fd.package.startsWith(packageName)));
    this.protos = fileDescriptors.reduce((map, fd) => {
      if (fd.name) {
        map[fd.name] = new Proto(fd, packageName);
      }
      return map;
    }, {} as ProtosMap);
  }
}
