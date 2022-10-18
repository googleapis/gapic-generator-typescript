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
      sha256 = "f0827d1bbb4abd97f5ce73baed0bd774a86c6103aff2104caf70ba3b2218ec0a",
      strip_prefix = "rules_proto-ea52a32ecd862c5317572cadecaa525c52124f9d",
      urls = [
          "https://mirror.bazel.build/github.com/bazelbuild/rules_proto/archive/ea52a32ecd862c5317572cadecaa525c52124f9d.tar.gz",
          "https://github.com/bazelbuild/rules_proto/archive/ea52a32ecd862c5317572cadecaa525c52124f9d.tar.gz",
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
      sha256 = "543395bc2ae58e72f7be674221db08b8f14e3bd7e3a19158f76105b3b61570a0",
      strip_prefix = "protobuf-3.21.8",
      urls = ["https://github.com/protocolbuffers/protobuf/archive/v3.21.8.tar.gz"],
  )
