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
    LIBRARY_DIR=$(realpath "{package_dir}")
    # Do some logic here to get the library in its final state
    COMBINE_LIBRARIES=$(realpath "{combine_libraries}")
    COMPILE_PROTOS=$(realpath "{compile_protos}")
    $COMBINE_LIBRARIES combine-library \
        --library-path $LIBRARY_DIR \
        --default-version "{default_version}" \
        --release-level "{release_level}"
    CWD=$(pwd)
    cd $LIBRARY_DIR
    echo "IN TEMPLATES EXCLUDES: "
    echo "{templates_excludes}"
    if [ -e "esm/src" ]; then $COMPILE_PROTOS "esm/src" --esm; else $COMPILE_PROTOS "src"; fi
    echo $(ls -a)
    # Here we are removing any handwritten templates we don't want
    # the generator to clobber over. However this *might* cause a library
    # to not be runnable. We'll need to reconsider this step once
    # we fully move to librarian.
    echo -e "{templates_excludes}" | while read template; do
        echo "rm -rf $template";
        rm -rf "$template";
    done
    cd $CWD
    # Rezip package
    tar cfz "{pkg}" -C "$LIBRARY_DIR/.." "{package_dir}"
    """.format(
        srcs = "\\n".join([f.path for f in srcs]),
        package_dir_path = paths.package_dir_path,
        package_dir = paths.package_dir,
        default_version = ctx.attr.default_version,
        templates_excludes = "\\n".join(ctx.attr.templates_excludes),
        pkg = ctx.outputs.pkg.path,
        compile_protos = ctx.executable.compile_protos.path,
        combine_libraries = ctx.executable.combine_libraries.path,
        release_level = ctx.attr.release_level,
    )

    ctx.actions.run_shell(
        inputs = srcs,
        command = script,
        outputs = [ctx.outputs.pkg],
        tools = [
            ctx.executable.compile_protos,
            ctx.executable.combine_libraries,
        ],    )

_typescript_gapic_combined_pkg = rule(
    attrs = {
        "deps": attr.label_list(allow_files = True, mandatory = True),
        "package_dir": attr.string(mandatory = True),
        "default_version": attr.string(mandatory = False),
        "templates_excludes": attr.string_list(mandatory = False),
        "release_level": attr.string(mandatory = False),
        "compile_protos": attr.label(
            executable = True,
            cfg = "exec",
            allow_files = True,
            default = Label("//:compile_protos_binary"),
        ),
        "combine_libraries": attr.label(
            executable = True,
            cfg = "exec",
            allow_files = True,
            default = Label("//:combine_libraries_binary"), 
        ),
    },
    outputs = {"pkg": "%{name}.tar.gz"},
    implementation = _typescript_gapic_combined_pkg_impl,
)

def typescript_gapic_combined_pkg(name, deps, default_version = None, templates_excludes = None, release_level = None, assembly_name = None):
    package_dir = name
    default_version = default_version
    templates_excludes = templates_excludes
    release_level = release_level
    if assembly_name:
        package_dir = "%s-%s" % (assembly_name, name)
    _typescript_gapic_combined_pkg(
        name = name,
        deps = deps,
        templates_excludes = templates_excludes,
        default_version = default_version,
        package_dir = package_dir,
        release_level = release_level
    )
