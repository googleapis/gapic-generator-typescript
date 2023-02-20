load("@bazel_tools//tools/build_defs/repo:utils.bzl", "maybe")
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

def gapic_generator_typescript_repositories():
  maybe(
    http_archive,
    name = "aspect_rules_js",
    sha256 = "9fadde0ae6e0101755b8aedabf7d80b166491a8de297c60f6a5179cd0d0fea58",
    strip_prefix = "rules_js-1.20.0",
    url = "https://github.com/aspect-build/rules_js/archive/refs/tags/v1.20.0.tar.gz",
  )

  maybe(
    http_archive,
    name = "aspect_rules_ts",
    sha256 = "db77d904284d21121ae63dbaaadfd8c75ff6d21ad229f92038b415c1ad5019cc",
    strip_prefix = "rules_ts-1.3.0",
    url = "https://github.com/aspect-build/rules_ts/archive/refs/tags/v1.3.0.tar.gz",
  )

  maybe(
      http_archive,
      name = "rules_proto",
      sha256 = "9eba2da1a7ed60c300ca19640801bcb591c6e332424199e7b23ebca7baf93c87",
      strip_prefix = "rules_proto-33aba33e1bec7e75487676c792e5690937933ab7",
      urls = [
          "https://mirror.bazel.build/github.com/bazelbuild/rules_proto/archive/33aba33e1bec7e75487676c792e5690937933ab7.tar.gz",
          "https://github.com/bazelbuild/rules_proto/archive/33aba33e1bec7e75487676c792e5690937933ab7.tar.gz",
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
