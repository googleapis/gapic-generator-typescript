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
      sha256 = "93f343cfe1d70086e30811236ff1be291fbac862cd41cfe6fb41d7ac0600b6d3",
      strip_prefix = "rules_proto-07cdde807a02f7f4baa714f9f1e1c26f02148d51",
      urls = [
          "https://mirror.bazel.build/github.com/bazelbuild/rules_proto/archive/07cdde807a02f7f4baa714f9f1e1c26f02148d51.tar.gz",
          "https://github.com/bazelbuild/rules_proto/archive/07cdde807a02f7f4baa714f9f1e1c26f02148d51.tar.gz",
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
      sha256 = "af9236a5b5b0f641b20f5511c1e4527efa981ac91d7342c6b1033f4f03bc5d21",
      strip_prefix = "protobuf-25.4",
      urls = ["https://github.com/protocolbuffers/protobuf/archive/v25.4.tar.gz"],
  )

# This is the version of Node.js that would run the generator, it's unrelated to the versions supported by the generated libraries
NODE_VERSION = "18.12.1" # https://github.com/bazelbuild/rules_nodejs/blob/stable/nodejs/private/node_versions.bzl
