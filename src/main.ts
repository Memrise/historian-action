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

import * as core from '@actions/core'
import * as formatting from './formatting'
import {context, getOctokit} from '@actions/github'
import {GitHub} from '@actions/github/lib/utils'

async function getMostRecentRelease(octokit: InstanceType<typeof GitHub>): Promise<string> {
  const {
    data: {tag_name}
  } = await octokit.rest.repos.getLatestRelease({
    owner: context.repo.owner,
    repo: context.repo.repo
  })

  return tag_name
}

async function run(): Promise<void> {
  const octokit = getOctokit(core.getInput('token', {required: true}))

  const since = core.getInput('since') || (await getMostRecentRelease(octokit))
  const until = core.getInput('until', {required: true})

  const {
    data: {commits}
  } = await octokit.rest.repos.compareCommitsWithBasehead({
    owner: context.repo.owner,
    repo: context.repo.repo,
    basehead: `${since}...${until}`
  })

  if (!core.getBooleanInput('chronological')) {
    commits.reverse()
  }

  core.setOutput('plain-text', formatting.getPlainTextFormat(commits))
  core.setOutput('markdown', formatting.getMarkdownFormat(commits))
  core.setOutput('slack', formatting.getSlackFormat(commits, since, until))
}

run()
