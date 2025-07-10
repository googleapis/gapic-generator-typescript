load("@rules_gapic//:gapic_pkg.bzl", "construct_package_dir_paths")

def _typescript_gapic_combined_pkg_impl(ctx):
    srcs = []

    for dep in ctx.attr.deps:
        srcs.extend(dep.files.to_list())

    paths = construct_package_dir_paths(ctx.attr.package_dir, ctx.outputs.pkg, ctx.label.name)

    script = """
    mkdir "{package_dir}"
    echo -e "{srcs}" | while read src; do
        tar -xf "$src" -C "{package_dir}"
    done
    echo $(realpath "{package_dir}")
    # Do some logic here to get the library in its final state
    # Rezip package
    tar cfz "{pkg}" -C "$(realpath "{package_dir}")/.." "{package_dir}"
    """.format(
        srcs = "\\n".join([f.path for f in srcs]),
        package_dir_path = paths.package_dir_path,
        package_dir = paths.package_dir,
        pkg = ctx.outputs.pkg.path,
    )

    ctx.actions.run_shell(
        inputs = srcs,
        command = script,
        outputs = [ctx.outputs.pkg],
    )

_typescript_gapic_combined_pkg = rule(
    attrs = {
        "deps": attr.label_list(allow_files = True, mandatory = True),
        "package_dir": attr.string(mandatory = True),
    },
    outputs = {"pkg": "%{name}.tar.gz"},
    implementation = _typescript_gapic_combined_pkg_impl,
)

def typescript_gapic_combined_pkg(name, deps, assembly_name = None):
    package_dir = name
    if assembly_name:
        package_dir = "%s-%s" % (assembly_name, name)
    _typescript_gapic_combined_pkg(
        name = name,
        deps = deps,
        package_dir = package_dir,
    )
