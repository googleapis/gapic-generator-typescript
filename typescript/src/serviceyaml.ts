// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export interface ServiceYaml {
  title: string;
  apis: string[];
  // TODO (alicejli): Dynamic routing headers will eventually be part of the ServiceYaml
  // Refactor reading the annotation from the proto to the serviceYaml file once that is implemented.
}
