load("@bazel_tools//tools/build_defs/repo:utils.bzl", "maybe")
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

def gapic_generator_typescript_repositories():
  maybe(
    http_archive,
    name = "aspect_rules_js",
    sha256 = "feecaa739f361b3223e86f186bc0916c8e71a236512515c0c26d85806969a386",
    strip_prefix = "rules_js-1.32.4",
    url = "https://github.com/aspect-build/rules_js/archive/refs/tags/v1.32.4.tar.gz",
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
      sha256 = "7ba0b77a37016b1d888e125456a1dc21eb63c17f17676289918de0798aab2a3c",
      strip_prefix = "rules_proto-bb745f946a0b033dc50b7671bea10c9395e53e4d",
      urls = [
          "https://mirror.bazel.build/github.com/bazelbuild/rules_proto/archive/bb745f946a0b033dc50b7671bea10c9395e53e4d.tar.gz",
          "https://github.com/bazelbuild/rules_proto/archive/bb745f946a0b033dc50b7671bea10c9395e53e4d.tar.gz",
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
