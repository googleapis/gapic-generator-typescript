import * as plugin from '../../../pbjs-genfiles/plugin';

import { Naming } from './naming';
import { Proto, MessagesMap, ResourceDescriptor, ResourceMap } from './proto';
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
    packageName: string,
    grpcServiceConfig: plugin.grpc.service_config.ServiceConfig
  ) {
    this.naming = new Naming(
      fileDescriptors.filter(
        fd => fd.package && fd.package.startsWith(packageName)
      )
    );
    // construct resource map
    const resourceMap = getResourceMap(fileDescriptors);
    // parse resource map to Proto constructor
    this.protos = fileDescriptors
      .filter(fd => fd.name)
      .reduce(
        (map, fd) => {
          map[fd.name!] = new Proto(
            fd,
            packageName,
            grpcServiceConfig,
            resourceMap
          );
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

function getResourceMap(
  fd: plugin.google.protobuf.IFileDescriptorProto[]
): ResourceMap {
  const resourceMap: ResourceMap = {};
  for (const fileDescriptor of fd) {
    const messages = fileDescriptor
      .messageType!.filter(message => message.name)
      .reduce(
        (map, message) => {
          map['.' + fileDescriptor.package! + '.' + message.name!] = message;
          return map;
        },
        {} as MessagesMap
      );
    for (const property of Object.keys(messages)) {
      const m = messages[property];
      if (m && m.options) {
        const option = m.options;
        if (option && option['.google.api.resource']) {
          const opt = option['.google.api.resource'];
          const oneResource = option[
            '.google.api.resource'
          ] as ResourceDescriptor;
          if (opt.type) {
            const arr = opt.type.match(/\/([^.]+)$/);
            if (arr) {
              oneResource.name = arr[arr.length - 1];
            }
          }
          const pattern = opt.pattern;
          if (pattern && pattern[0]) {
            const params = pattern[0].match(/{[a-zA-Z]+}/g) || [];
            for (let i = 0; i < params.length; i++) {
              params[i] = params[i].replace('{', '').replace('}', '');
            }
            oneResource.params = params;
          }
          resourceMap[opt.type!] = oneResource;
        }
      }
    }
  }
  return resourceMap;
}
