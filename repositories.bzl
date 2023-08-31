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
      sha256 = "36e4de702036d31b649f96519676509c4027dc10cc3c97f0335c199b305d45b7",
      strip_prefix = "rules_proto-8aa1e67c09bc8df20df33886909d44129cfb7e63",
      urls = [
          "https://mirror.bazel.build/github.com/bazelbuild/rules_proto/archive/8aa1e67c09bc8df20df33886909d44129cfb7e63.tar.gz",
          "https://github.com/bazelbuild/rules_proto/archive/8aa1e67c09bc8df20df33886909d44129cfb7e63.tar.gz",
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
      sha256 = "39b52572da90ad54c883a828cb2ca68e5ac918aa75d36c3e55c9c76b94f0a4f7",
      strip_prefix = "protobuf-24.2",
      urls = ["https://github.com/protocolbuffers/protobuf/archive/v24.2.tar.gz"],
  )

# This is the version of Node.js that would run the generator, it's unrelated to the versions supported by the generated libraries
NODE_VERSION = "18.12.1" # https://github.com/bazelbuild/rules_nodejs/blob/stable/nodejs/private/node_versions.bzl
