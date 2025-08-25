load("@bazel_tools//tools/build_defs/repo:utils.bzl", "maybe")
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

def gapic_generator_typescript_repositories():
  maybe(
    http_archive,
    name = "aspect_rules_js",
    sha256 = "ad4f0a0e9a6bd57111653ecdd180fc9f7a80f5a75f45714a1576ce2a28c176c5",
    strip_prefix = "rules_js-2.5.0",
    url = "https://github.com/aspect-build/rules_js/archive/refs/tags/v2.5.0.tar.gz",
  )

  maybe(
    http_archive,
    name = "aspect_rules_ts",
    sha256 = "8bbac753f4b61adbfc1d9878b87b9cd0f64c9e8e6d8fafc8a1bbfa9625bab162",
    strip_prefix = "rules_ts-3.2.1",
    url = "https://github.com/aspect-build/rules_ts/archive/refs/tags/v3.2.1.tar.gz",
  )

  maybe(
      http_archive,
      name = "rules_proto",
      sha256 = "f5ae0e582238fcd4ea3d0146a3f5f3db9517f8fe24491eab3c105ace53aad1bb",
      strip_prefix = "rules_proto-f9b0b880d1e10e18daeeb168cef9d0f8316fdcb5",
      urls = [
          "https://mirror.bazel.build/github.com/bazelbuild/rules_proto/archive/f9b0b880d1e10e18daeeb168cef9d0f8316fdcb5.tar.gz",
          "https://github.com/bazelbuild/rules_proto/archive/f9b0b880d1e10e18daeeb168cef9d0f8316fdcb5.tar.gz",
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
      sha256 = "79cc6d09d02706c5a73e900ea842b5b3dae160f371b6654774947fe781851423",
      strip_prefix = "protobuf-27.5",
      urls = ["https://github.com/protocolbuffers/protobuf/archive/v27.5.tar.gz"],
  )

# This is the version of Node.js that would run the generator, it's unrelated to the versions supported by the generated libraries
NODE_VERSION = "18.12.1" # https://github.com/bazelbuild/rules_nodejs/blob/stable/nodejs/private/node_versions.bzl
