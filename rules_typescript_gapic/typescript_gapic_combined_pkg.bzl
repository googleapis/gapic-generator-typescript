load("@rules_gapic//:gapic_pkg.bzl", "construct_package_dir_paths")

def _typescript_gapic_combined_pkg_impl(ctx):
    srcs = []

    for dep in ctx.attr.deps:
        srcs.extend(dep.files.to_list())

    paths = construct_package_dir_paths(ctx.attr.package_dir, ctx.outputs.pkg, ctx.label.name)

    # 1. Check if templates_excludes is NOT None and NOT empty.
    # The Starlark attr.string_list defaults to [], which is falsy in Starlark.
    if ctx.attr.templates_excludes:
        # 2. If it's valid, join the list with newlines.
        templates_excludes_var = "\\n".join(ctx.attr.templates_excludes)
    else:
        # 3. If it's empty or None, use an empty string.
        templates_excludes_var = ""

    script = """
    mkdir "{package_dir}"
    echo -e "{srcs}" | while read src; do
        tar -xf "$src" -C "{package_dir}"
    done
    LIBRARY_DIR=$(realpath "{package_dir}")
    # Do some logic here to get the library in its final state
    PROCESS_LIBRARIES=$(realpath "{combine_libraries}")
    COMPILE_PROTOS=$(realpath "{compile_protos}")
    CWD=$(pwd)
    cd $LIBRARY_DIR
    ESM_FLAG=""
    IS_ESM=false
    # Check if any nested path contains esm/src
    FOUND_ESM_SRC=$(find . -type d -path '*/esm/src' -print -quit 2>/dev/null)
    if [ -n "$FOUND_ESM_SRC" ]; then
        ESM_FLAG="--isEsm=true"
        IS_ESM=true      
    fi
    echo "Library is ESM: $IS_ESM"
    cd $CWD
    $PROCESS_LIBRARIES combine-library --source-path $LIBRARY_DIR --default-version "{default_version}" $ESM_FLAG
    # If we ever want to change the replacement string
    # in the README to add in the samples table and/or
    # releaseLevel, make sure to change the search string in this command
    # as well
    $PROCESS_LIBRARIES generate-readme --initial-generation true --source-path $LIBRARY_DIR --release-level "{release_level}" --replacement-string-samples '[//]: # "samples"' --replacement-string-release-level '[//]: # "releaseLevel"'
    if [ $IS_ESM ]; then $COMPILE_PROTOS "esm/src" --esm; else $COMPILE_PROTOS "src"; fi   
    # Here we are removing any handwritten templates we don't want
    # the generator to clobber over. However this *might* cause a library
    # to not be runnable. We'll need to reconsider this step once
    # we fully move to librarian.
    echo "EXCLUDING THE FOLLOWING TEMPLATES:"
    echo "{templates_excludes}"
    if [ -n "{templates_excludes}" ]; then
        echo -e "{templates_excludes}" | while read template; do
            # Added an extra check for empty lines in case of trailing newline
            if [ -n "$template" ]; then
                echo "rm -rf $LIBRARY_DIR/$template";
                rm -rf "$LIBRARY_DIR"/"$template";
            fi
        done
    fi
    # Rezip package
    tar cfz "{pkg}" -C "$LIBRARY_DIR/.." "{package_dir}"
    """.format(
        srcs = "\\n".join([f.path for f in srcs]),
        package_dir_path = paths.package_dir_path,
        package_dir = paths.package_dir,
        default_version = ctx.attr.default_version,
        templates_excludes = templates_excludes_var,
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
