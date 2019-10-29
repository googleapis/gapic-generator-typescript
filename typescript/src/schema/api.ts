import * as plugin from '../../../pbjs-genfiles/plugin';
import * as fs from 'fs';
import * as path from 'path';

import { Naming } from './naming';
import { Proto } from './proto';

const googleGaxLocation = path.dirname(require.resolve('google-gax'));
const gaxProtosLocation = path.join(googleGaxLocation, '..', '..', 'protos');

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
    packageName: string,
    grpcServiceConfig: plugin.grpc.service_config.ServiceConfig
  ) {
    this.naming = new Naming(
      fileDescriptors.filter(
        fd => fd.package && fd.package.startsWith(packageName)
      )
    );
    this.protos = fileDescriptors
      .filter(fd => fd.name)
      .filter(fd => !fs.existsSync(path.join(gaxProtosLocation, fd.name!)))
      .reduce(
        (map, fd) => {
          map[fd.name!] = new Proto(fd, packageName, grpcServiceConfig);
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
