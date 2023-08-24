load("@bazel_tools//tools/build_defs/repo:utils.bzl", "maybe")
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

def gapic_generator_typescript_repositories():
  maybe(
    http_archive,
    name = "aspect_rules_js",
    sha256 = "7ab2fbe6d79fb3909ad2bf6dcacfae39adcb31c514efa239dd730b4f147c8097",
    strip_prefix = "rules_js-1.32.1",
    url = "https://github.com/aspect-build/rules_js/archive/refs/tags/v1.32.1.tar.gz",
  )

  maybe(
    http_archive,
    name = "aspect_rules_ts",
    sha256 = "4c3f34fff9f96ffc9c26635d8235a32a23a6797324486c7d23c1dfa477e8b451",
    strip_prefix = "rules_ts-1.4.5",
    url = "https://github.com/aspect-build/rules_ts/archive/refs/tags/v1.4.5.tar.gz",
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
      sha256 = "0930b1a6eb840a2295dfcb13bb5736d1292c3e0d61a90391181399327be7d8f1",
      strip_prefix = "protobuf-24.1",
      urls = ["https://github.com/protocolbuffers/protobuf/archive/v24.1.tar.gz"],
  )

# This is the version of Node.js that would run the generator, it's unrelated to the versions supported by the generated libraries
NODE_VERSION = "18.12.1" # https://github.com/bazelbuild/rules_nodejs/blob/stable/nodejs/private/node_versions.bzl
