load("@bazel_tools//tools/build_defs/repo:utils.bzl", "maybe")
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

def gapic_generator_typescript_repositories():
  maybe(
    http_archive,
    name = "aspect_rules_js",
    sha256 = "9f51475dd2f99abb015939b1cf57ab5f15ef36ca6d2a67104450893fd0aa5c8b",
    strip_prefix = "rules_js-1.16.0",
    url = "https://github.com/aspect-build/rules_js/archive/refs/tags/v1.16.0.tar.gz",
  )

  maybe(
    http_archive,
    name = "aspect_rules_ts",
# TODO(alexander-fenster): point to the official release when the paths problem is fixed
# https://github.com/aspect-build/rules_ts/pull/304
#    sha256 = "acb20a4e41295d07441fa940c8da9fd02f8637391fd74a14300586a3ee244d59",
#    strip_prefix = "rules_ts-1.2.0",
#    url = "https://github.com/aspect-build/rules_ts/archive/refs/tags/v1.2.0.tar.gz",
    strip_prefix = "rules_ts-f6413a356a814c9ed3f7cc7e1ca7a915b4104683",
    url = "https://github.com/alexander-fenster/rules_ts/archive/f6413a356a814c9ed3f7cc7e1ca7a915b4104683.tar.gz",
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

# This is the version of Node.js that would run the generator, it's unrelated to the versions supported by the generated libraries
NODE_VERSION = "18.12.1" # https://github.com/bazelbuild/rules_nodejs/blob/stable/nodejs/private/node_versions.bzl
