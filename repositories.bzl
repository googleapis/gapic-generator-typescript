load("@bazel_tools//tools/build_defs/repo:utils.bzl", "maybe")
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

def gapic_generator_typescript_repositories():
  maybe(
    http_archive,
    name = "aspect_rules_js",
    sha256 = "3e237129b3554373a80c681c4b47348f91c294ff32d4bc8f8297f40511a4eb6c",
    strip_prefix = "rules_js-1.25.4",
    url = "https://github.com/aspect-build/rules_js/archive/refs/tags/v1.25.4.tar.gz",
  )

  maybe(
    http_archive,
    name = "aspect_rules_ts",
    sha256 = "8eb25d1fdafc0836f5778d33fb8eaac37c64176481d67872b54b0a05de5be5c0",
    strip_prefix = "rules_ts-1.3.3",
    url = "https://github.com/aspect-build/rules_ts/archive/refs/tags/v1.3.3.tar.gz",
  )

  maybe(
      http_archive,
      name = "rules_proto",
      sha256 = "5d4cd6780634eb2ecafa091df8be8009d395f70a02f722e07e063883dd8af861",
      strip_prefix = "rules_proto-493169c1199dc21b9da860f7040a4502aa174676",
      urls = [
          "https://mirror.bazel.build/github.com/bazelbuild/rules_proto/archive/493169c1199dc21b9da860f7040a4502aa174676.tar.gz",
          "https://github.com/bazelbuild/rules_proto/archive/493169c1199dc21b9da860f7040a4502aa174676.tar.gz",
      ],
  )

  _rules_gapic_version = "0.9.0"
  maybe(
      http_archive,
      name = "rules_gapic",
      strip_prefix = "rules_gapic-%s" % _rules_gapic_version,
      urls = ["https://github.com/googleapis/rules_gapic/archive/v%s.tar.gz" % _rules_gapic_version],
  )

  maybe(
      http_archive,
      name = "com_google_protobuf",
      sha256 = "e2497a53c6d0283cd93767508b868b15836c1ede2190c2a9e202edc79ee36814",
      strip_prefix = "protobuf-3.23.0",
      urls = ["https://github.com/protocolbuffers/protobuf/archive/v3.23.0.tar.gz"],
  )

# This is the version of Node.js that would run the generator, it's unrelated to the versions supported by the generated libraries
NODE_VERSION = "18.12.1" # https://github.com/bazelbuild/rules_nodejs/blob/stable/nodejs/private/node_versions.bzl
