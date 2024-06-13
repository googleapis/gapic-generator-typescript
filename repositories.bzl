load("@bazel_tools//tools/build_defs/repo:utils.bzl", "maybe")
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

def gapic_generator_typescript_repositories():
  maybe(
    http_archive,
    name = "aspect_rules_js",
    sha256 = "fc6887091ee3243661fb532fd3244230b6e193c22566a038c9fd748ca68fb880",
    strip_prefix = "rules_js-1.42.3",
    url = "https://github.com/aspect-build/rules_js/archive/refs/tags/v1.42.3.tar.gz",
  )

  maybe(
    http_archive,
    name = "aspect_rules_ts",
    sha256 = "cfc8e8cd2a78edb3eff112d782357daa1e8402294715e10b0ef563855273dc85",
    strip_prefix = "rules_ts-2.0.0",
    url = "https://github.com/aspect-build/rules_ts/archive/refs/tags/v2.0.0.tar.gz",
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
      sha256 = "07d69502e58248927b58c7d7e7424135272ba5b2852a753ab6b67e62d2d29355",
      strip_prefix = "protobuf-24.3",
      urls = ["https://github.com/protocolbuffers/protobuf/archive/v24.3.tar.gz"],
  )

# This is the version of Node.js that would run the generator, it's unrelated to the versions supported by the generated libraries
NODE_VERSION = "18.12.1" # https://github.com/bazelbuild/rules_nodejs/blob/stable/nodejs/private/node_versions.bzl
