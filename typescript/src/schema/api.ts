import * as plugin from '../../../pbjs-genfiles/plugin';

import {Naming} from './naming';
import {Proto} from './proto';

export type ProtosMap = {
  [filename: string]: Proto
};

export class API {
  naming: Naming;
  protos: ProtosMap;
  // TODO: subpackages

  constructor(
      fileDescriptors: plugin.google.protobuf.IFileDescriptorProto[],
      packageName: string) {
    this.naming = new Naming(fileDescriptors.filter(
        fd => fd.package && fd.package.startsWith(packageName)));
    this.protos = fileDescriptors.filter(fd => fd.name).reduce((map, fd) => {
      map[fd.name!] = new Proto(fd, packageName);
      return map;
    }, {} as ProtosMap);
  }

  get services() {
    return Object.keys(this.protos)
        .map(filename => this.protos[filename])
        .filter(proto => proto.fileToGenerate)
        .reduce((retval, proto) => {
          retval.push(
              ...Object.keys(proto.services).map(name => proto.services[name]));
          return retval;
        }, [] as plugin.google.protobuf.IServiceDescriptorProto[]);
  }

  get filesToGenerate() {
    return Object.keys(this.protos)
        .filter(proto => this.protos[proto].fileToGenerate);
  }
}
