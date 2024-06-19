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
    sha256 = "4c3f34fff9f96ffc9c26635d8235a32a23a6797324486c7d23c1dfa477e8b451",
    strip_prefix = "rules_ts-1.4.5",
    url = "https://github.com/aspect-build/rules_ts/archive/refs/tags/v1.4.5.tar.gz",
  )

  maybe(
      http_archive,
      name = "rules_proto",
      sha256 = "745865caf6635f45b07797b0e72759962e169150178f8c972524e99cafd29ef0",
      strip_prefix = "rules_proto-ea9558d6efc5b4639e10f55de101dede1e91a6f6",
      urls = [
          "https://mirror.bazel.build/github.com/bazelbuild/rules_proto/archive/ea9558d6efc5b4639e10f55de101dede1e91a6f6.tar.gz",
          "https://github.com/bazelbuild/rules_proto/archive/ea9558d6efc5b4639e10f55de101dede1e91a6f6.tar.gz",
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
      sha256 = "616bb3536ac1fff3fb1a141450fa28b875e985712170ea7f1bfe5e5fc41e2cd8",
      strip_prefix = "protobuf-24.4",
      urls = ["https://github.com/protocolbuffers/protobuf/archive/v24.4.tar.gz"],
  )

# This is the version of Node.js that would run the generator, it's unrelated to the versions supported by the generated libraries
NODE_VERSION = "18.12.1" # https://github.com/bazelbuild/rules_nodejs/blob/stable/nodejs/private/node_versions.bzl
