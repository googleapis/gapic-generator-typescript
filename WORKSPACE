workspace(
    # How this workspace would be referenced with absolute labels from another workspace
    name = "gapic_generator_typescript",
)
 
load("//:repositories.bzl", "gapic_generator_typescript_repositories", "NODE_VERSION")
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

load("@rules_nodejs//nodejs:repositories.bzl", "nodejs_register_toolchains")
nodejs_register_toolchains(
    name = "nodejs",
    node_version = NODE_VERSION,
)

load("@aspect_rules_js//npm:npm_import.bzl", "npm_translate_lock", "pnpm_repository")
npm_translate_lock(
    name = "npm",
    pnpm_lock = "//:pnpm-lock.yaml",
    update_pnpm_lock = True,
    data = ["//:package.json"],
)
# To regenerate the lock file, run:
# bazel run -- @pnpm//:pnpm --dir $PWD install --lockfile-only
# More information: https://github.com/aspect-build/rules_js/blob/main/docs/faq.md#can-i-use-bazel-managed-pnpm

load("@npm//:repositories.bzl", "npm_repositories")
npm_repositories()
pnpm_repository(name = "pnpm")
