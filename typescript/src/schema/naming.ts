import * as plugin from '../../../pbjs-genfiles/plugin';
import { commonPrefix } from '../util';

export class Naming {
  name: string;
  namespace: string[];
  version: string;
  productName: string;
  protoPackage: string;

  constructor(fileDescriptors: plugin.google.protobuf.IFileDescriptorProto[]) {
    const protoPackages = fileDescriptors
      .filter(fd => fd.service && fd.service.length > 0)
      // LRO is an exception: it's a service but we don't generate any code for it
      .filter(fd => fd.package !== 'google.longrunning')
      .map(fd => fd.package || '');
    const prefix = commonPrefix(protoPackages);
    // common prefix must either end with `.`, or be equal to at least one of
    // the packages' prefix
    if (!prefix.endsWith('.') && !protoPackages.some(pkg => pkg === prefix)) {
      throw new Error('Protos provided have different proto packages.');
    }
    const rootPackage = prefix.replace(/\.$/, '');

    // Define the regular expression to match a version component
    // (e.g. "v1", "v1beta4", etc.).
    const pattern = /^((?:[a-z0-9_.]+?)\.)?([a-z0-9_]+)(?:\.(v[0-9]+(p[0-9]+)?((alpha|beta)[0-9]+)?[^.]*))?$/;
    const match = rootPackage.match(pattern);
    if (!match) {
      throw new Error(`Cannot parse package name ${rootPackage}.`);
    }
    const [, namespaces, name, version] = match;
    if (!namespaces) {
      throw new Error(
        `Cannot parse package name ${rootPackage}: namespace is not defined.`
      );
    }
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
}
