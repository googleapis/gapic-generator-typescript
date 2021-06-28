load("@bazel_tools//tools/build_defs/repo:utils.bzl", "maybe")
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

def gapic_generator_typescript_repositories():
  maybe(
      http_archive,
      name = "build_bazel_rules_nodejs",
      sha256 = "a160d9ac88f2aebda2aa995de3fa3171300c076f06ad1d7c2e1385728b8442fa",
      urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/3.4.1/rules_nodejs-3.4.1.tar.gz"],
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

  _rules_gapic_version = "0.5.4"
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
