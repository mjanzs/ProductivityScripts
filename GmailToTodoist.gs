/** prototype functions **/
String.prototype.supplant = function (o) {
    return this.replace(/{([^{}]*)}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

/** properties **/
var scriptProperties = PropertiesService.getScriptProperties();

/** constants **/
var TODOIST_API_KEY = scriptProperties.getProperty('todoist_token');
var TODOIST_API = {
    tasks: "https://beta.todoist.com/API/v8/tasks",
    projects: "https://beta.todoist.com/API/v8/projects"
}

var TODOIST_LABEL = "todoist";
var GMAIL_QUERY = "is:starred !label:{label}".supplant({label: TODOIST_LABEL});

/** methods **/
var replaceIllegalerChars = function (str) {
    return str.replaceAll('\n', ' ');
}

var buildGmailTodoistMessage = function (thread) {
    return "[@Mail {subject}]({link}) from {from}".supplant({
        subject: replaceIllegalerChars(thread.getFirstMessageSubject()),
        link: thread.getPermalink(),
        from: getFrom(thread)
    });
}

var getGmailThreads = function (query) {
    return GmailApp.search(query);
};

var gmailThreadToTodoist = function (thread) {
    Logger.log("Adding thread subject: '%s' to todoist", thread.getFirstMessageSubject());

    var data = {
        "content": buildGmailTodoistMessage(thread)
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
        Logger.log("Task was created successfully for the thread '%s'.", thread.getFirstMessageSubject());
        addLabel(thread, TODOIST_LABEL);
    } else {
        Logger.log("ERROR: There was an error creating tasks: %s", response.getContentText());
    }
}

var addLabel = function (thread, labelName) {
    var label = GmailApp.getUserLabelByName(labelName);
    thread.addLabel(label);
}

var getFrom = function (thread) {
    return thread.getMessages()[0].getFrom()
}

/** main **/
function runGmailToTodoist() {
    var threads = getGmailThreads(GMAIL_QUERY);
    threads.forEach(gmailThreadToTodoist);
}
