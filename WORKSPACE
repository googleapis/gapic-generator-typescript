workspace(
    # How this workspace would be referenced with absolute labels from another workspace
    name = "gapic_generator_typescript",
)
 
load("//:repositories.bzl", "gapic_generator_typescript_repositories")
gapic_generator_typescript_repositories()

load("@com_google_protobuf//:protobuf_deps.bzl", "protobuf_deps")
protobuf_deps()

load("@rules_proto//proto:repositories.bzl", "rules_proto_dependencies", "rules_proto_toolchains")
rules_proto_dependencies()
rules_proto_toolchains()

load("@aspect_rules_js//js:repositories.bzl", "rules_js_dependencies")
rules_js_dependencies()

load("@aspect_rules_ts//ts:repositories.bzl", "rules_ts_dependencies")
rules_ts_dependencies(
    ts_version_from = "//:package.json",
)

# Fetch and register node, if you haven't already
load("@rules_nodejs//nodejs:repositories.bzl", "nodejs_register_toolchains")
nodejs_register_toolchains(
    name = "nodejs",
    # This is the version of Node.js that would run the generator, it's unrelated to the versions supported by the generated libraries
    node_version = "18.12.1", # https://github.com/bazelbuild/rules_nodejs/blob/stable/nodejs/private/node_versions.bzl 
)

load("@aspect_rules_js//npm:npm_import.bzl", "npm_translate_lock", "pnpm_repository")
npm_translate_lock(
    name = "npm",
    pnpm_lock = "//:pnpm-lock.yaml",
    update_pnpm_lock = True,
    data = ["@//:package.json"],
)

load("@npm//:repositories.bzl", "npm_repositories")
npm_repositories()

pnpm_repository(name = "pnpm")
# To regenerate the lock file, run:
# bazel run -- @pnpm//:pnpm --dir $PWD install --lockfile-only
# More information: https://github.com/aspect-build/rules_js/blob/main/docs/faq.md#can-i-use-bazel-managed-pnpm
