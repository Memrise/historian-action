# historian-action

Fetches the commits between two provided versions for use in changelog and deployment notifications.

Three different output formats are supplied, plain text, Markdown and for Slack.


## Usage

```yaml
- uses: Memrise/historian-action@v1
  with:
    # GitHub API token. Only requires read-only access to the repository.
    #
    # Default: ${{ github.token }}
    token: ''

    # The commit SHA, tag or branch to use as the starting point when looking for commits.
    # The commit referenced here will not be included in the output.
    #
    # Default: The most recent tag, or the one before that if `until` points at the same commit
    since: ''

    # The commit SHA, tag or branch to use as the end point when looking for commits.
    # The commit referenced here will be included in the output.
    #
    # Default: 'HEAD'
    until: ''

    # Output the commits in chronological order.
    #
    # Default: true
    chronological: ''

    # Template for the message to be included before the list of changes to Slack.
    #
    # Supports Markdown and makes the following variables available:
    #
    # - since.full
    # - since.short
    # - until.full
    # - until.short
    #
    # Default: *Changes from {since.short} to {until.short}*
    slack template: ''
```


## Outputs

Three different outputs are set, `plain-text`, `markdown` and `slack` which contain the commits in different output formats.

The `slack` format is intended to work directly with the [`slackapi/slack-github-action`](https://github.com/slackapi/slack-github-action)'s `payload` input.
