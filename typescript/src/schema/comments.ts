import * as plugin from '../../../pbjs-genfiles/plugin';
export interface Comments {
  [name: string]: string;
}

export class CommentsMap {
  comments: Comments = {};

  constructor(fd: plugin.google.protobuf.IFileDescriptorProto) {
    const commentsMap: Comments = {};
    if (fd && fd.sourceCodeInfo && fd.sourceCodeInfo.location) {
      const locations = fd.sourceCodeInfo.location;
      locations.forEach(location => {
        if (location.leadingComments !== null) {
          // p is an array with format [f1, i1, f2, i2, ...]
          // - f1 refers to the protobuf field tag
          // - if field refer to by f1 is a slice, i1 refers to an element in that slice
          // - f2 and i2 works recursively.
          // So, [6, x] refers to the xth service defined in the file,
          // since the field tag of Service is 6.
          // [6, x, 2, y] refers to the yth method in that service,
          // since the field tag of Method is 2.
          const p = location.path!;
          if (p.length === 2 && p[0] === 6) {
            if (fd.service && fd.service[p[1]] && fd.service[p[1]].name) {
              commentsMap[fd.service[p[1]].name! + 'Service'] =
                location.leadingComments || '';
            }
          } else if (p.length === 4 && p[2] === 2) {
            if (
              fd.service &&
              fd.service[p[1]] &&
              fd.service[p[1]].method &&
              fd.service[p[1]].method![p[3]] &&
              fd.service[p[1]].method![p[3]].name
            ) {
              const name = fd.service[p[1]].method![p[3]].name!;
              if (!commentsMap[name]) {
                commentsMap[name] = location.leadingComments || '';
              }
            }
          }
        }
      });
      this.comments = commentsMap;
    }
  }
  getCommentsMap() {
    return this.comments;
  }
  getServiceComment(serviceName: string) {
    return this.comments[serviceName + 'Service'].trim();
  }
  getMethodComments(methodName: string): string {
    return this.comments[methodName].trim();
  }
}
