load("@bazel_tools//tools/build_defs/repo:utils.bzl", "maybe")
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

def gapic_generator_typescript_repositories():
  maybe(
    http_archive,
    name = "aspect_rules_js",
    sha256 = "0b69e0967f8eb61de60801d6c8654843076bf7ef7512894a692a47f86e84a5c2",
    strip_prefix = "rules_js-1.27.1",
    url = "https://github.com/aspect-build/rules_js/archive/refs/tags/v1.27.1.tar.gz",
  )

  maybe(
    http_archive,
    name = "aspect_rules_ts",
    sha256 = "40ab6d3d9cc3259da54fe2f162588aba92244af0f151fbc905dcc8e7b8744296",
    strip_prefix = "rules_ts-1.4.2",
    url = "https://github.com/aspect-build/rules_ts/archive/refs/tags/v1.4.2.tar.gz",
  )

  maybe(
      http_archive,
      name = "rules_proto",
      sha256 = "5d4cd6780634eb2ecafa091df8be8009d395f70a02f722e07e063883dd8af861",
      strip_prefix = "rules_proto-493169c1199dc21b9da860f7040a4502aa174676",
      urls = [
          "https://mirror.bazel.build/github.com/bazelbuild/rules_proto/archive/493169c1199dc21b9da860f7040a4502aa174676.tar.gz",
          "https://github.com/bazelbuild/rules_proto/archive/493169c1199dc21b9da860f7040a4502aa174676.tar.gz",
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
      sha256 = "a700a49470d301f1190a487a923b5095bf60f08f4ae4cac9f5f7c36883d17971",
      strip_prefix = "protobuf-23.4",
      urls = ["https://github.com/protocolbuffers/protobuf/archive/v23.4.tar.gz"],
  )

# This is the version of Node.js that would run the generator, it's unrelated to the versions supported by the generated libraries
NODE_VERSION = "18.12.1" # https://github.com/bazelbuild/rules_nodejs/blob/stable/nodejs/private/node_versions.bzl
