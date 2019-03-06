/** prototype functions **/
String.prototype.supplant = function (o) {
    return this.replace(/{([^{}]*)}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};
String.prototype.replaceUserNames = function (o) {
    return this.replace(/<@([^>]*)>/g,
        function (a, b) {
            var r = slackApi.getUserName(b);
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

/** script properties **/
var scriptProperties = PropertiesService.getScriptProperties();

/** constants **/
var TODOIST_API_KEY = scriptProperties.getProperty('todoist_token');
var TODOIST_API = {
    tasks: "https://beta.todoist.com/API/v8/tasks",
    projects: "https://beta.todoist.com/API/v8/projects"
}

var SLACK_API_KEY = scriptProperties.getProperty('slack_token');
var SLACK_API = {
    stars: "https://slack.com/api/stars.list",
    userInfo: "https://slack.com/api/users.info",
    removeStar: "https://slack.com/api/stars.remove"
}

var TEXT_MAX_LENGTH = 100;

/** slack api **/
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
            Logger.log("items: '%s'.", data.items);

            return data.items;
        } else {
            Logger.log("ERROR: There was an error getting stared messages: %s", response.getContentText());
        }
    },
    getStarredMessages: function () {
        return slackApi.getStaredItems().filter(function (item) {
            return item.type == "message" || item.type == "file";
        }).map(function (item) {
            if (item.type == "message") {
                return {
                    text: item.message.text,
                    permalink: item.message.permalink,
                    user: item.message.user,
                    username: item.message.username,
                    unstar: function () {
                        slackApi.unstarMessage(item.channel, item.message.ts)
                    }
                };
            } else if (item.type == "file") {
                return {
                    text: item.file.title,
                    permalink: item.file.permalink,
                    user: item.file.user,
                    username: item.file.username,
                    unstar: function () {
                        slackApi.unstarFile(item.file.id)
                    }
                };
            }
        }).filter(function (item) { return !!item });
    },
    unstarFile: function (fileId) {
        Logger.log("Unstar: fileId '%s'", fileId);

        var url = SLACK_API.removeStar
            + '?token=' + SLACK_API_KEY
            + '&file=' + fileId;

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
}

/** functions **/
var replaceIllegalerChars = function (str) {
    return str.replaceAll('\n', ' ');
}

var formatText = function (str) {
    if (!str) {
        return "";
    } else {
        str = str.replaceUserNames();
        if (str.length > TEXT_MAX_LENGTH) {
            return replaceIllegalerChars(str.substring(0, TEXT_MAX_LENGTH)) + '...';
        } else {
            return replaceIllegalerChars(str);
        }
    }
}

var messageToTodoist = function (item) {
    Logger.log("Adding message to todoist '%s'", item);

    createTodoistTask(item, item.unstar);
}

var buildSlackTodoistMessage = function (message) {
    return "[@Slack {text}]({link}) from {from}".supplant({
        text: formatText(message.text),
        link: message.permalink,
        from: message.user ? slackApi.getUserName(message.user) : message.username
    });
}

var createTodoistTask = function (message, successCallback) {
    Logger.log("Creating task for meesage '%s'.", message);
    var data = {
        "content": buildSlackTodoistMessage(message)
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
}


function runSlackToTodoist() {
    slackApi.getStarredMessages().forEach(messageToTodoist);
}