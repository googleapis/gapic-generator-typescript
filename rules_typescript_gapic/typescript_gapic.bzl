# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

load("@com_google_api_codegen//rules_gapic:gapic.bzl", "proto_custom_library", "unzipped_srcjar")

def typescript_gapic_library(
  name,
  src,
  deps,
  grpc_service_config = None,
  package_name = None,
  main_service = None,
  bundle_config = None,
  iam_service = None,
  extra_protoc_parameters = [],
  extra_protoc_file_parameters = {},
  **kwargs):
  # Note: if extra parameters contain any of the named parameters, the behavior is undefined
  # (up to the plugin implementation)

  plugin_args_dict = {}
  if package_name:
    plugin_args_dict["package-name"] = package_name
  if main_service:
    plugin_args_dict["main-service"] = main_service
  if iam_service:
    plugin_args_dict["iam-service"] = iam_service

  file_args = {} # note: keys are filenames, values are parameter name, aligned with the prior art
  if grpc_service_config:
    file_args[grpc_service_config] = "grpc-service-config"
  if bundle_config:
    file_args[bundle_config] = "bundle-config"

  plugin_args = extra_protoc_parameters
  for key, value in plugin_args_dict.items():
    plugin_args.append("{}={}".format(key, value))

  output_suffix = ".srcjar"

  proto_custom_library(
    name = name,
    deps = [src],
    plugin = Label("//:protoc_plugin"),
    plugin_args = plugin_args,
    plugin_file_args = file_args,
    output_type = "typescript-gapic",
    output_suffix = output_suffix,
  )
