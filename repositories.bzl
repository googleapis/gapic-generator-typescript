load("@bazel_tools//tools/build_defs/repo:utils.bzl", "maybe")
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

def gapic_generator_typescript_repositories():
  maybe(
    http_archive,
    name = "build_bazel_rules_nodejs",
    sha256 = "c911b5bd8aee8b0498cc387cacdb5f917098ce477fb4182db07b0ef8a9e045c0",
    urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/4.7.1/rules_nodejs-4.7.1.tar.gz"],
  )

  maybe(
      http_archive,
      name = "rules_proto",
      sha256 = "169e2974b08bece094ced3a28f3bf1d911aa5e23f5c024c36b1aad6e31567d47",
      strip_prefix = "rules_proto-97bbeab9d2ba716ffdcaa5e6155b746e2c4a6857",
      urls = [
          "https://mirror.bazel.build/github.com/bazelbuild/rules_proto/archive/97bbeab9d2ba716ffdcaa5e6155b746e2c4a6857.tar.gz",
          "https://github.com/bazelbuild/rules_proto/archive/97bbeab9d2ba716ffdcaa5e6155b746e2c4a6857.tar.gz",
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
      sha256 = "d7d204a59fd0d2d2387bd362c2155289d5060f32122c4d1d922041b61191d522",
      strip_prefix = "protobuf-3.21.5",
      urls = ["https://github.com/protocolbuffers/protobuf/archive/v3.21.5.tar.gz"],
  )
