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
  try {
    const {
      data: {tag_name}
    } = await octokit.rest.repos.getLatestRelease({
      owner: context.repo.owner,
      repo: context.repo.repo
    })

    return tag_name
  } catch (e) {
    return ''
  }
}

async function getMostRecentTag(octokit: InstanceType<typeof GitHub>): Promise<string> {
  /*
   * This assumes undocumented behaviour from GitHub's API,
   * where the first tag returned is the most recently created one.
   */

  try {
    const {data} = await octokit.rest.repos.listTags({
      owner: context.repo.owner,
      repo: context.repo.repo,
      per_page: 1
    })

    return data[0].name
  } catch (e) {
    return ''
  }
}

async function run(): Promise<void> {
  const octokit = getOctokit(core.getInput('token', {required: true}))

  const since = core.getInput('since') || (await getMostRecentRelease(octokit)) || (await getMostRecentTag(octokit))
  let until = core.getInput('until', {required: true})
  const slackTemplate = core.getInput('slack template')

  if (!since) {
    core.setFailed("`since` was not set and a reasonable default couldn't be established")
  }

  const {
    data: {commits}
  } = await octokit.rest.repos.compareCommitsWithBasehead({
    owner: context.repo.owner,
    repo: context.repo.repo,
    basehead: `${since}...${until}`
  })

  if (commits.length === 0) {
    core.info(`No commits were found between ${since} and ${until}. Outputs will be empty.`)

    core.setOutput('plain-text', '')
    core.setOutput('markdown', '')
    core.setOutput('slack', '')

    return
  }

  if (until === 'HEAD') {
    // If `until` was 'HEAD' we change it to be the SHA of the most recent commit
    // so the links to GitHub become stable
    until = commits.slice(-1)[0].sha
  }

  if (!core.getBooleanInput('chronological')) {
    commits.reverse()
  }

  core.setOutput('plain-text', formatting.getPlainTextFormat(commits))
  core.setOutput('markdown', formatting.getMarkdownFormat(commits))
  core.setOutput('slack', formatting.getSlackFormat(commits, since, until, slackTemplate))
}

run()
