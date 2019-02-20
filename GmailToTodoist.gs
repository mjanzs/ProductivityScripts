var scriptProperties = PropertiesService.getScriptProperties();

var TODOIST_API_KEY = scriptProperties.getProperty('todoist_token');
var TODOIST_API = {
    tasks: "https://beta.todoist.com/API/v8/tasks",
    projects: "https://beta.todoist.com/API/v8/projects"
};

var TODOIST_LABEL = "todoist";
var PAGE_SIZE = 50;
var GMAIL_QUERY = "is:starred !label:todoist";


var getGmailThreads = function (query) {
    var threads = [];
    var start = 0;
    do {
        var max = start + PAGE_SIZE;
        GmailApp.search(query, start, max).forEach(function (thread) {
            threads.push(thread);
        });
        start += PAGE_SIZE;
    } while (threads.length >= PAGE_SIZE)
    return threads;
};

var gmailThreadToTodoist = function (thread) {
    Logger.log("Adding thread subject: '%s' to todoist", thread.getFirstMessageSubject());

    createTodoistTaskFromGmailThread(thread);
};

var createTodoistTaskFromGmailThread = function (thread) {
    var data = {
        "content": "@Mail [" + thread.getFirstMessageSubject() + "](" + thread.getPermalink() + ") email from " + getFrom(thread)
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

function runGmailToTodoist() {
    var threads = getGmailThreads(GMAIL_QUERY);
    threads.forEach(gmailThreadToTodoist);
}
