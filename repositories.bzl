load("@bazel_tools//tools/build_defs/repo:utils.bzl", "maybe")
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

def gapic_generator_typescript_repositories():
  maybe(
      http_archive,
      name = "build_bazel_rules_nodejs",
      sha256 = "84abf7ac4234a70924628baa9a73a5a5cbad944c4358cf9abdb4aab29c9a5b77",
      urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/1.7.0/rules_nodejs-1.7.0.tar.gz"],
  )

  maybe(
      http_archive,
      name = "rules_proto",
      sha256 = "602e7161d9195e50246177e7c55b2f39950a9cf7366f74ed5f22fd45750cd208",
      strip_prefix = "rules_proto-97d8af4dc474595af3900dd85cb3a29ad28cc313",
      urls = [
          "https://mirror.bazel.build/github.com/bazelbuild/rules_proto/archive/97d8af4dc474595af3900dd85cb3a29ad28cc313.tar.gz",
          "https://github.com/bazelbuild/rules_proto/archive/97d8af4dc474595af3900dd85cb3a29ad28cc313.tar.gz",
      ],
  )

  maybe(
      http_archive,
      name = "com_google_protobuf",
      sha256 = "71030a04aedf9f612d2991c1c552317038c3c5a2b578ac4745267a45e7037c29",
      strip_prefix = "protobuf-3.12.3",
      urls = ["https://github.com/protocolbuffers/protobuf/archive/v3.12.3.tar.gz"],
  )
