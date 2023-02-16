load("@bazel_tools//tools/build_defs/repo:utils.bzl", "maybe")
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

def gapic_generator_typescript_repositories():
  maybe(
    http_archive,
    name = "aspect_rules_js",
    sha256 = "3ad6684d744ebbc6592d404cc3aa81d0da634eccb3499f6fd198ae122fa28489",
    strip_prefix = "rules_js-1.19.0",
    url = "https://github.com/aspect-build/rules_js/archive/refs/tags/v1.19.0.tar.gz",
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
      sha256 = "cf9c2f12262ccaccf56f5baf0580a656a09bea6d7cb6b6418b03d30fabe6c4e9",
      strip_prefix = "protobuf-4.22.0",
      urls = ["https://github.com/protocolbuffers/protobuf/archive/v4.22.0.tar.gz"],
  )

# This is the version of Node.js that would run the generator, it's unrelated to the versions supported by the generated libraries
NODE_VERSION = "18.12.1" # https://github.com/bazelbuild/rules_nodejs/blob/stable/nodejs/private/node_versions.bzl
