load("@bazel_tools//tools/build_defs/repo:utils.bzl", "maybe")
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

def gapic_generator_typescript_repositories():
  maybe(
    http_archive,
    name = "aspect_rules_js",
    sha256 = "dcd1567d4a93a8634ec0b888b371a60b93c18d980f77dace02eb176531a71fcf",
    strip_prefix = "rules_js-1.26.0",
    url = "https://github.com/aspect-build/rules_js/archive/refs/tags/v1.26.0.tar.gz",
  )

  maybe(
    http_archive,
    name = "aspect_rules_ts",
    sha256 = "ace5b609603d9b5b875d56c9c07182357c4ee495030f40dcefb10d443ba8c208",
    strip_prefix = "rules_ts-1.4.0",
    url = "https://github.com/aspect-build/rules_ts/archive/refs/tags/v1.4.0.tar.gz",
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
      sha256 = "930c2c3b5ecc6c9c12615cf5ad93f1cd6e12d0aba862b572e076259970ac3a53",
      strip_prefix = "protobuf-3.21.12",
      urls = ["https://github.com/protocolbuffers/protobuf/archive/v3.21.12.tar.gz"],
  )

# This is the version of Node.js that would run the generator, it's unrelated to the versions supported by the generated libraries
NODE_VERSION = "18.12.1" # https://github.com/bazelbuild/rules_nodejs/blob/stable/nodejs/private/node_versions.bzl
