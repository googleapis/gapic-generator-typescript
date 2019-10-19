import * as plugin from '../../../pbjs-genfiles/plugin';

import { Naming } from './naming';
import { Proto } from './proto';
import { fstat } from 'fs-extra';

export interface ProtosMap {
  [filename: string]: Proto;
}

export class API {
  naming: Naming;
  protos: ProtosMap;
  hostName?: string;
  port?: string;
  // oauth_scopes: plugin.google.protobuf.IServiceOptions.prototype[".google.api.oauthScopes"];
  // TODO: subpackages

  constructor(
    fileDescriptors: plugin.google.protobuf.IFileDescriptorProto[],
    packageName: string
  ) {
    this.naming = new Naming(
      fileDescriptors.filter(
        fd => fd.package && fd.package.startsWith(packageName)
      )
    );
    this.protos = fileDescriptors
      .filter(fd => fd.name)
      .reduce(
        (map, fd) => {
          map[fd.name!] = new Proto(fd, packageName);
          return map;
        },
        {} as ProtosMap
      );
    fileDescriptors.forEach(fd => {
      if (fd.service) {
        fd.service.forEach(service => {
          if (service.options) {
            const serviceOption = service.options;
            if (serviceOption['.google.api.defaultHost']) {
              const defaultHost = serviceOption['.google.api.defaultHost'];
              const arr = defaultHost.split(':');
              this.hostName = arr[0] || 'localhost';
              this.port = arr.length > 1 ? arr[1] : '443';
            }
          }
        });
      }
    });
  }

  get services() {
    return Object.keys(this.protos)
      .map(filename => this.protos[filename])
      .filter(proto => proto.fileToGenerate)
      .reduce(
        (retval, proto) => {
          retval.push(
            ...Object.keys(proto.services).map(name => proto.services[name])
          );
          return retval;
        },
        [] as plugin.google.protobuf.IServiceDescriptorProto[]
      );
  }

  get filesToGenerate() {
    return Object.keys(this.protos).filter(
      proto => this.protos[proto].fileToGenerate
    );
  }

  get protoFilesToGenerateJSON() {
    return JSON.stringify(
      this.filesToGenerate.map(file => {
        return `../../protos/${file}`;
      }),
      null,
      '  '
    );
  }
}
