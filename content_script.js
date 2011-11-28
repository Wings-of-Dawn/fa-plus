var INJECTED_DIV_CLASS = "actions";
var INJECTED_DIV_BUTTONS = [
    {
        classes:    "button general-button",
        text:       "Select General",
        handler:    "selectGeneralSubmissions"
    },
    {
        classes:    "button mature-button",
        text:       "Select Mature",
        handler:    "selectMatureSubmissions"
    },
    {
        classes:    "button adult-button",
        text:       "Select Adult",
        handler:    "selectAdultSubmissions"
    },
    {
        classes:    "button open-button",
        text:       "Open Selected",
        handler:    "openSelectedSubmissions"
    }
];

//  Create a div containing the buttons we want to add
var newDiv = document.createElement("div");
newDiv.setAttribute("class", INJECTED_DIV_CLASS);
INJECTED_DIV_BUTTONS.forEach(function (buttonData) {
    // Create a button element
    var button = document.createElement("input");
    button.setAttribute("class", buttonData.classes);
    button.setAttribute("type", "button");
    button.setAttribute("value", buttonData.text);

    // Add a click handler
    button.addEventListener("click", window[buttonData.handler], false);

    // Add the button to the new div
    newDiv.appendChild(button);
});

// Find the first "actions" div in the messages-list form
var MESSAGES_FORM_ID = "messages-form";
var messageForm = document.getElementById(MESSAGES_FORM_ID);
var ACTIONS_DIV_CLASS = "actions";
var actionsDiv = messageForm.getElementsByClassName(ACTIONS_DIV_CLASS)[0];

// Add our div before it
messageForm.insertBefore(newDiv, actionsDiv);

//chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
//    sendResponse(findSubmissions(request.submissionTypes));
//});

function selectGeneralSubmissions()
{
    console.log("DEBUG: select general");
}

function selectMatureSubmissions()
{
    console.log("DEBUG: select mature");
}

function selectAdultSubmissions()
{
    console.log("DEBUG: select adult");
}

function openSelectedSubmissions()
{
    console.log("DEBUG: open selected");
}

function findSubmissions(submissionTypes)
{
    var SUBMISSION_THUMB_CLASS_NAME = "thumb-overlay";
    var foundSubmissions = [];

    // Find the thumbnail-container elements for all submissions on the page
    var submissionThumbs = document.getElementsByClassName(SUBMISSION_THUMB_CLASS_NAME);

    // For each thumbnail, check if it passes our filter, and find the reference to the corresponding submission page
    for (var i = 0; i < submissionThumbs.length; i++)
    {
        // Check if the thumbnail's classes include one of the allowed submission types
        var thumbnail = submissionThumbs[i];
        var allowed = submissionTypes.some(function (type) {
            return (thumbnail.className.indexOf(type) > 0);
        });
        if (!allowed)
            continue;

        // Get the container around the thumbnail
        var submissionContainer = thumbnail.parentNode;

        // Find all anchor (link) elements in the container node (should be exactly 1)
        var anchors = submissionContainer.getElementsByTagName('a');
        if (anchors.length !== 1)
        {
            console.warn("Unexpected number of anchor elements in submission container element: " + anchors.length + " (expected 1)");
            if (anchors.length < 1)
                continue;
        }

        // Add the first anchor found to the list of submission-page links to open
        foundSubmissions.push(anchors[0].href);
    }

    return foundSubmissions;
}
