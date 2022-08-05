load("@bazel_tools//tools/build_defs/repo:utils.bzl", "maybe")
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

def gapic_generator_typescript_repositories():
  maybe(
    http_archive,
    name = "build_bazel_rules_nodejs",
    sha256 = "d63ecec7192394f5cc4ad95a115f8a6c9de55c60d56c1f08da79c306355e4654",
    urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/4.6.1/rules_nodejs-4.6.1.tar.gz"],
  )

  maybe(
      http_archive,
      name = "rules_proto",
      sha256 = "d31d04a8bb1912fbc122bcc7eea49964c9b75c6e091ac3f9deea2bb6a8025a4a",
      strip_prefix = "rules_proto-dcf9e47b0df2218ca33e02a1a51803ab3134f42d",
      urls = [
          "https://mirror.bazel.build/github.com/bazelbuild/rules_proto/archive/dcf9e47b0df2218ca33e02a1a51803ab3134f42d.tar.gz",
          "https://github.com/bazelbuild/rules_proto/archive/dcf9e47b0df2218ca33e02a1a51803ab3134f42d.tar.gz",
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
      sha256 = "07f8a02afc14a657f727ed89a8ec5627b9ecc47116d60acaabaa1da233bd2e8f",
      strip_prefix = "protobuf-3.15.4",
      urls = ["https://github.com/protocolbuffers/protobuf/archive/v3.15.4.tar.gz"],
  )
