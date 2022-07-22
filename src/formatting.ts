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

import {Commit} from './interfaces'
import {context} from '@actions/github'
import {formatInTimeZone} from 'date-fns-tz'
import pupa from 'pupa'

function firstLine(input: string): string {
  return input.split('\n')[0]
}

function getPullRequestUrl(pull_id: string): string {
  return `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/pull/${pull_id}`
}

function formatMessage(input: string, slackLinks: boolean): string {
  return firstLine(input).replace(/#(\d+)/, (match, p1) => {
    if (slackLinks) return `<${getPullRequestUrl(p1)}|#${p1}>`
    return `[#${p1}](${getPullRequestUrl(p1)})`
  })
}

function getAuthor(commit: Commit): string {
  if (commit.commit.author && commit.commit.author.name) {
    return commit.commit.author.name
  }
  return 'Unknown'
}

function getShortRef(ref: string): string {
  if (ref.match(/[\da-fA-F]{40}/)) {
    return ref.substring(0, 10)
  }
  return ref
}

export function getPlainTextFormat(commits: Commit[]): string {
  const lines = []

  for (const commit of commits) {
    lines.push(`${getShortRef(commit.sha)}: ${firstLine(commit.commit.message)} (${getAuthor(commit)})`)
  }

  return lines.join('\n')
}

export function getMarkdownFormat(commits: Commit[]): string {
  const lines = []

  for (const commit of commits) {
    lines.push(
      `[\`${getShortRef(commit.sha)}\`](${commit.html_url}) ${formatMessage(commit.commit.message, false)} (${getAuthor(
        commit
      )})`
    )
  }

  return lines.join('\n')
}

export function getSlackFormat(commits: Commit[], since: string, until: string, slackTemplate: string): string {
  const lines = []

  for (const commit of commits) {
    lines.push(
      `<${commit.html_url}|\`${getShortRef(commit.sha)}\`> ${formatMessage(commit.commit.message, true)} (${getAuthor(
        commit
      )})`
    )

    // Slack imposes a 3000 character limit, check if we are near it
    if (lines.join('\n').length > 2900) {
      // We are, so remove the last commit added and stop adding any more
      lines.pop()
      break
    }
  }

  // Check if commits were truncated
  const truncatedCommits = commits.length - lines.length
  if (truncatedCommits) {
    lines.push(
      `\n${truncatedCommits} were skipped due to message length limits. See the full list of changes via the link below.`
    )
  }

  const now = new Date()

  const result = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: pupa(slackTemplate, {
            date: formatInTimeZone(now, 'UTC', 'YYYY-MM-DD'),
            since: {
              full: since,
              short: getShortRef(since)
            },
            time: formatInTimeZone(now, 'UTC', 'HH:mm:ss'),
            timeNoSeconds: formatInTimeZone(now, 'UTC', 'HH:mm'),
            until: {
              full: until,
              short: getShortRef(until)
            }
          })
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: lines.join('\n')
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/compare/${since}...${until}|See the changes on GitHub>`
          }
        ]
      }
    ]
  }

  return JSON.stringify(result)
}
