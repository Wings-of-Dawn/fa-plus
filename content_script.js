var SUBMISSION_RATING_CLASSES = {
    GENERAL:    "r-general",
    MATURE:     "r-mature",
    ADULT:      "r-adult"
};
var ALL_SUBMISSION_RATING_CLASSES = [
    SUBMISSION_RATING_CLASSES.GENERAL,
    SUBMISSION_RATING_CLASSES.MATURE,
    SUBMISSION_RATING_CLASSES.ADULT
];

var CHECKED_CONTAINER_CLASS = "checked";

var ADDED_ACTIONS_DIV_CLASSES = "added-actions";
var ADDED_ACTIONS_BUTTONS = [
    {
        classes:    "button open-button open-all-button",
        text:       "Open All",
        handler:    function () {openAllSubmissions();}
    },
    {
        classes:    "button general-button",
        text:       "Check/Uncheck General",
        handler:    function () {selectSubmissionsOfType(SUBMISSION_RATING_CLASSES.GENERAL);}
    },
    {
        classes:    "button mature-button",
        text:       "Check/Uncheck Mature",
        handler:    function () {selectSubmissionsOfType(SUBMISSION_RATING_CLASSES.MATURE);}
    },
    {
        classes:    "button adult-button",
        text:       "Check/Uncheck Adult",
        handler:    function () {selectSubmissionsOfType(SUBMISSION_RATING_CLASSES.ADULT);}
    },
    {
        classes:    "button open-button open-checked-button",
        text:       "Open Checked",
        handler:    function () {openSelectedSubmissions();}
    }
];

var INPUT_ELEMENT_TYPE_TAG = "input";

//  Create divs containing the buttons we want to add
var selectionButtonsTop = document.createElement("div");
selectionButtonsTop.setAttribute("class", ADDED_ACTIONS_DIV_CLASSES);
var selectionButtonsBottom = document.createElement("div");
selectionButtonsBottom.setAttribute("class", ADDED_ACTIONS_DIV_CLASSES);
ADDED_ACTIONS_BUTTONS.forEach(function (buttonData) {
    selectionButtonsTop.appendChild(makeButton(buttonData));
    selectionButtonsBottom.appendChild(makeButton(buttonData));
});

// Find the "actions" divs in the messages-list form
var MESSAGES_FORM_ID = "messages-form";
var messageForm = document.getElementById(MESSAGES_FORM_ID);
var EXISTING_ACTIONS_DIV_CLASS = "actions";
var actionsDivs = messageForm.getElementsByClassName(EXISTING_ACTIONS_DIV_CLASS);

// Add our row of buttons before each of the existing rows
messageForm.insertBefore(selectionButtonsBottom, actionsDivs[1].nextSibling); // Ordering is important! Collection will be mutated, so if we add the buttons to the top first, the bottom buttons will appear in the wrong place
messageForm.insertBefore(selectionButtonsTop, actionsDivs[0]);

// Tell the extension to show the page action icon
chrome.extension.sendRequest({type: "showPageAction"});

// Listen for requests from the extension
chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    switch (request.type)
    {
        case "getSubmissions":
            // Page action clicked: find and open all submissions on the page
            sendResponse(findAllSubmissions());
            break;
        default:
            // Unknown
            console.warn("unknown request type received: " + request.type);
            break;
    }
});

function makeButton(buttonData) {
    // Create a button element
    var button = document.createElement("input");
    button.setAttribute("class", buttonData.classes);
    button.setAttribute("type", "button");
    button.setAttribute("value", buttonData.text);

    // Add a click handler
    button.addEventListener("click", buttonData.handler, false);

    return button;
}

function selectSubmissionsOfType(type) {
    // Find containers for elements of the specified type
    var containers = findContainersForSubmissionsOfType(type);

    // "Select" the submission in the container by adding a "checked" class
    containers.forEach(function (container) {
        container.classList.toggle(CHECKED_CONTAINER_CLASS);
    });
}

function openSelectedSubmissions() {
    // Send the list of selected submissions to the extension to be opened
    chrome.extension.sendRequest({
        type:           "openSubmissions",
        submissions:    findSelectedSubmissions()
    });
}

function openAllSubmissions() {
    // Send all submissions to the extension to be opened
    chrome.extension.sendRequest({
        type:           "openSubmissions",
        submissions:    findAllSubmissions()
    });
}

function findAllSubmissions() {
    // Find all submission-container elements
    var containers = [];
    ALL_SUBMISSION_RATING_CLASSES.forEach(function (ratingClass) {
        containers = containers.concat(findContainersForSubmissionsOfType(ratingClass));
    });
    return getSubmissionsFromContainers(containers);
}

function findSelectedSubmissions() {
    // Find all checked submission-container elements
    var checkedContainers = findContainersForSubmissionsOfType(CHECKED_CONTAINER_CLASS);
    return getSubmissionsFromContainers(checkedContainers);
}

function findContainersForSubmissionsOfType(type) {
    return toArray(document.getElementsByClassName(type));
}

function toArray(nodelist) {
    var result = [];
    for (var i = 0; i < nodelist.length; i++)
        result.push(nodelist[i]);
    return result;
}

function getSubmissionsFromContainers(containers) {
    // Find the submission reference corresponding to each thumbnail
    var foundSubmissions = [];
    containers.forEach(function (container) {
        foundSubmissions.push(getSubmissionFromContainer(container));
    });

    return foundSubmissions;
}

function getSubmissionFromContainer(containerElement) {
    var SUBMISSION_REFERENCE_ELEMENT_TYPE_TAG = "a";
    var foundReferences = containerElement.getElementsByTagName(SUBMISSION_REFERENCE_ELEMENT_TYPE_TAG);
    var count = foundReferences.length;
    if (count !== 2)
    {
        console.warn("unexpected number of anchor tags in container: " + count + " (expected 2)");
        if (count < 1)
            return null;
    }

    // We expect the first anchor to refer to the submission, and the second to its author
    return foundReferences[0].href;
}

