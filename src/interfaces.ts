/*
 * Copyright 2022 Memrise Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Copied from @octokit/openapi-types 11.2.0 and simplfied to match what's needed here
 */
export interface Commit {
  url: string
  sha: string
  node_id: string
  html_url: string
  comments_url: string
  commit: {
    url: string
    author: {
      name?: string
      email?: string
      date?: string
    } | null
    committer: {
      name?: string
      email?: string
      date?: string
    } | null
    message: string
    comment_count: number
    tree: {
      sha: string
      url: string
    }
  }
  parents: {
    sha: string
    url: string
    html_url?: string
  }[]
  stats?: {
    additions?: number
    deletions?: number
    total?: number
  }
  files?: {
    filename?: string
    additions?: number
    deletions?: number
    changes?: number
    status?: string
    raw_url?: string
    blob_url?: string
    patch?: string
    sha?: string
    contents_url?: string
    previous_filename?: string
  }[]
}
