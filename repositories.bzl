load("@bazel_tools//tools/build_defs/repo:utils.bzl", "maybe")
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

def gapic_generator_typescript_repositories():
  maybe(
    http_archive,
    name = "aspect_rules_js",
    sha256 = "1aa0ab76d1f9520bb8993e2d84f82da2a9c87da1e6e8d121dbb4c857a292c2cd",
    strip_prefix = "rules_js-1.20.1",
    url = "https://github.com/aspect-build/rules_js/archive/refs/tags/v1.20.1.tar.gz",
  )

  maybe(
    http_archive,
    name = "aspect_rules_ts",
    sha256 = "02480b6a1cd12516edf364e678412e9da10445fe3f1070c014ac75e922c969ea",
    strip_prefix = "rules_ts-1.3.1",
    url = "https://github.com/aspect-build/rules_ts/archive/refs/tags/v1.3.1.tar.gz",
  )

  maybe(
      http_archive,
      name = "rules_proto",
      sha256 = "1357c68ef1c3644cafad6ae1822d99c06b94ef2cd8e01c783968703f61373d18",
      strip_prefix = "rules_proto-71c4fc69900946093ac5c82d81efd19fa522d060",
      urls = [
          "https://mirror.bazel.build/github.com/bazelbuild/rules_proto/archive/71c4fc69900946093ac5c82d81efd19fa522d060.tar.gz",
          "https://github.com/bazelbuild/rules_proto/archive/71c4fc69900946093ac5c82d81efd19fa522d060.tar.gz",
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
