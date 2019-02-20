# ProductivityScripts

## Todoist

**Installation:**

1. create project [https://www.google.com/script/start/](https://www.google.com/script/start/)
1. create and copy scripts
1. get todoist access token
    * login into Todoist web
    * ho to Todoist settings under config menu
    * select Account tab
    * copy the API token value
1. add todoist token to Google Scripts project
    * go to Google Scripts console and open project
    * select File tab
    * go to project settings
    * add 'todoist_token' with the toke to 'Script properties'
1. setup time-based trigger (event 5 mins for example)

### GmailToTodoist.gs

**script workflow:**
1. search stared emails without 'todoist' label
1. create todoist task
1. add 'todoist' label

### SlackToTodoist.gs

**Installation:**

1. get workspace api token [https://api.slack.com/custom-integrations/legacy-tokens](https://api.slack.com/custom-integrations/legacy-tokens)
1. add slack token to Google Scripts project
   * go to Google Scripts console and open project
   * select File tab
   * go to project settings
   * add 'slack_token' with the toke to 'Script properties'
1. setup time-based trigger (event 5 mins for example)

**script workflow:**
1. search stared messages
1. create todoist task
1. unstar messages