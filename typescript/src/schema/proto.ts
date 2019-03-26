import * as plugin from '../../../pbjs-genfiles/plugin';

export type ServicesMap = {
  [name: string]: plugin.google.protobuf.IServiceDescriptorProto
};
export type MessagesMap = {
  [name: string]: plugin.google.protobuf.IDescriptorProto
};
export type EnumsMap = {
  [name: string]: plugin.google.protobuf.IEnumDescriptorProto
};

export class Proto {
  filePB2: plugin.google.protobuf.IFileDescriptorProto;
  services: ServicesMap = {};
  messages: MessagesMap = {};
  enums: EnumsMap = {};
  fileToGenerate: boolean;
  // TODO: need to store metadata? address?

  constructor(
      fd: plugin.google.protobuf.IFileDescriptorProto, packageName: string) {
    this.filePB2 = fd;
    if (fd.service) {
      this.services = fd.service.reduce((map, service) => {
        if (service.name) {
          map[service.name] = service;
        }
        return map;
      }, {} as ServicesMap);
    }

    if (fd.messageType) {
      this.messages = fd.messageType.reduce((map, message) => {
        if (message.name) {
          map[message.name] = message;
        }
        return map;
      }, {} as MessagesMap);
    }

    if (fd.enumType) {
      this.enums = fd.enumType.reduce((map, enum_) => {
        if (enum_.name) {
          map[enum_.name] = enum_;
        }
        return map;
      }, {} as EnumsMap);
    }
    this.fileToGenerate =
        fd.package ? fd.package.startsWith(packageName) : false;
  }
}

// TODO for Proto class: just load messages, services, enums, etc. as is,
// without creating wrapper classes. Extra functionality can be added by
// changing prototypes.
