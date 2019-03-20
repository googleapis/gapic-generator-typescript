import * as plugin from '../../../pbjs-genfiles/plugin';
import {commonPrefix} from '../util';

export class Naming {
  name: string;
  namespace: string[];
  version: string;
  productName: string;
  protoPackage: string;

  constructor(fileDescriptors: plugin.google.protobuf.IFileDescriptorProto[]) {
    const protoPackages = fileDescriptors.map(fd => fd.package || '');
    const rootPackage = commonPrefix(protoPackages).replace(/\.$/, '');
    if (!rootPackage) {
      throw new Error('Protos provided have different proto packages.');
    }

    const pattern =
        /^((?:[a-z0-9_.]+?)\.)?([a-z0-9_]+)(?:\.(v[0-9]+(p[0-9]+)?((alpha|beta)[0-9]+)?[^.]*))?$/;
    const match = rootPackage.match(pattern);
    if (!match) {
      throw new Error(`Cannot parse package name ${rootPackage}.`);
    }
    const [, namespaces, name, version] = match;
    if (!namespaces) {
      throw new Error(`Cannot parse package name ${
          rootPackage}: namespace is not defined.`);
    }
    this.name = name.capitalize();
    this.productName = this.name;
    this.namespace = namespaces.replace(/\.$/, '').split('.');
    this.version = version || '';
    this.protoPackage = rootPackage;

    if (!this.version && protoPackages.length > 1) {
      throw new Error(
          'All protos must have the same proto package up to and including the version.');
    }

    // iterate all files and look for metadata, make sure the metadata is the
    // same across all files
    const explicitPkgs = new Set<string>();
    let metadataName: string | null | undefined;
    let metadataNamespace: string[] | null | undefined;
    let metadataVersion: string | null | undefined;
    for (const file of fileDescriptors) {
      if (file.options) {
        const pkg = file.options['.google.api.clientPackage'];
        if (pkg) {
          explicitPkgs.add(JSON.stringify(pkg));
          metadataName = pkg.title || pkg.productTitle;
          metadataNamespace = pkg.namespace;
          metadataVersion = pkg.version;
        }
      }
    }
    if (explicitPkgs.size > 1) {
      throw new Error(
          'If the google.api.client_package annotation is provided in more than one file, it must be consistent.');
    }

    this.productName =
        metadataName || this.productName || '';
    if (metadataNamespace && metadataNamespace.length > 0) {
      this.namespace = metadataNamespace;
    }
    this.version = metadataVersion || this.version;
  }
}