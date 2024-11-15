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

async function resolveHead(octokit: InstanceType<typeof GitHub>): Promise<string> {
  const {data} = await octokit.rest.repos.getCommit({
    owner: context.repo.owner,
    repo: context.repo.repo,
    ref: 'HEAD'
  })

  return data.sha
}

async function getPreviousTag(octokit: InstanceType<typeof GitHub>, notThis: string): Promise<string> {
  /*
   * This assumes undocumented behaviour from GitHub's API,
   * where the tags are returned in reverse chronological order.
   *
   * notThis refers to a commit or tag that we don't want returned.
   */

  try {
    const {data} = await octokit.rest.repos.listTags({
      owner: context.repo.owner,
      repo: context.repo.repo
    })

    for (const tag of data) {
      // Make sure notThis isn't a tag that matches
      if (tag.name === notThis) continue
      // Make sure notThis isn't a commit that matches (also handles shortened commit SHAs)
      if (tag.commit.sha.startsWith(notThis)) continue

      return tag.name
    }

    return ''
  } catch (_) {
    return ''
  }
}

async function run(): Promise<void> {
  const octokit = getOctokit(core.getInput('token', {required: true}))

  // Resolve HEAD to a commit if that was passed as input
  let until = core.getInput('until', {required: true})
  if (until === 'HEAD') {
    until = await resolveHead(octokit)
  }

  const since = core.getInput('since') || (await getPreviousTag(octokit, until))

  if (!since) {
    core.setFailed("`since` was not set and a reasonable default couldn't be established")
    return
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

  if (!core.getBooleanInput('chronological')) {
    commits.reverse()
  }

  core.setOutput('plain-text', formatting.getPlainTextFormat(commits))
  core.setOutput('markdown', formatting.getMarkdownFormat(commits))
  core.setOutput(
    'slack',
    formatting.getSlackFormat(commits, since, until, core.getInput('slack template'), core.getInput('slack channel'))
  )
}

run()
