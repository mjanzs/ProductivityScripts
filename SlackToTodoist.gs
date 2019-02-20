var scriptProperties = PropertiesService.getScriptProperties();

var TODOIST_API_KEY = scriptProperties.getProperty('todoist_token');
var TODOIST_API = {
    tasks: "https://beta.todoist.com/API/v8/tasks",
    projects: "https://beta.todoist.com/API/v8/projects"
};

var SLACK_API_KEY = scriptProperties.getProperty('slack_token');
var SLACK_API = {
    stars: "https://slack.com/api/stars.list",
    userInfo: "https://slack.com/api/users.info",
    removeStar: "https://slack.com/api/stars.remove"
};
var slackApi = {
    getStaredItems: function () {
        var url = SLACK_API.stars + '?'
            + 'token=' + SLACK_API_KEY;

        var options = {
            'method': 'get'
        };

        var response = UrlFetchApp.fetch(url, options);

        var data = JSON.parse(response);
        if (response && response.getResponseCode() == 200 && data.ok) {
            Logger.log("Starred messages was obtained successfully: '%s'.", data.ok);
            return data.items;
        } else {
            Logger.log("ERROR: There was an error getting stared messages: %s", response.getContentText());
        }
    },
    getStarredMessages: function () {
        return slackApi.getStaredItems().filter(function (item) {
            return item.type == "message";
        });
    },
    unstarMessage: function (channelId, messageTimestamp) {
        Logger.log("Unstar: channel '%s', ts '%s'.", channelId, messageTimestamp);

        var url = SLACK_API.removeStar
            + '?token=' + SLACK_API_KEY
            + '&channel=' + channelId
            + '&timestamp=' + messageTimestamp;

        var options = {
            'method': 'post'
        };

        var response = UrlFetchApp.fetch(url, options);

        var data = JSON.parse(response);
        if (response && response.getResponseCode() == 200 && data.ok) {
            Logger.log("Unstar successfully: '%s'.", data.ok);
        } else {
            Logger.log("ERROR: There was an error unstarring message: %s", response.getContentText());
        }
    },
    getUserInfo: function (userId) {
        var url = SLACK_API.userInfo
            + '?token=' + SLACK_API_KEY
            + '&user=' + userId;

        var options = {
            'method': 'get'
        };

        var response = UrlFetchApp.fetch(url, options);

        var data = JSON.parse(response);
        if (response && response.getResponseCode() == 200 && data.ok) {
            Logger.log("User detail was obtained successfully: '%s'.", response.ok);
            return data.user;
        } else {
            Logger.log("ERROR: There was an error getting user detail: %s", response.getContentText());
        }
    },
    getUserName: function (userId) {
        return slackApi.getUserInfo(userId).real_name;
    }
};

var abbr = function (str) {
    if (str.length > 25) {
        return str.substring(0, 25) + '...';
    } else {
        return str;
    }
};

var messageToTodoist = function (item) {
    Logger.log("Adding message to todoist '%s'", item);

    createTodoistTask(item, function () {
        slackApi.unstarMessage(item.channel, item.message.ts);
    });
};

var createTodoistTask = function (item, successCallback) {
    var message = item.message;
  Logger.log("Creating task for meesage '%s'.", message);
    var data = {
      "content": "@Slack [" + (message.text ? abbr(message.text) : "link") + "](" + message.permalink + ") message from " + (message.user ? slackApi.getUserName(message.user) : message.username)
    };

    var options = {
        'method': 'post',
        'contentType': 'application/json',
        'headers': {
            "Authorization": "Bearer " + TODOIST_API_KEY
        },
        'payload': JSON.stringify(data)
    };

    var response = UrlFetchApp.fetch(TODOIST_API.tasks, options);

    if (response && response.getResponseCode() == 200) {
        Logger.log("Task was created successfully for the message.");
        successCallback();
    } else {
        Logger.log("ERROR: There was an error creating tasks: %s", response.getContentText());
    }
};


function runSlackToTodoist() {
    slackApi.getStarredMessages().forEach(messageToTodoist);
}