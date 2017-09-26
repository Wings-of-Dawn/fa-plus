var CHECKED_CONTAINER_CLASS = "checked";
var CHECKBOX_STATE = {
    CHECKED:    true,
    UNCHECKED:  false
};

var SUBMISSION_RATINGS = {
    GENERAL: {
        className:  "r-general",
        state:      CHECKBOX_STATE.UNCHECKED
    },
    MATURE: {
        className:  "r-mature",
        state:      CHECKBOX_STATE.UNCHECKED
    },
    ADULT: {
        className:  "r-adult",
        state:      CHECKBOX_STATE.UNCHECKED
    }
};

var ADDED_ACTIONS_DIV_CLASSES = "added-actions";
var ADDED_ACTIONS_BUTTONS = [
    {
        classes:    "button open-button open-all-button",
        text:       "Open All",
        handler:    function () {openSubmissions(findAllSubmissions());}
    },
    {
        classes:    "button general-button",
        text:       "Check/Uncheck General",
        handler:    function () {toggleSelected(SUBMISSION_RATINGS.GENERAL);}
    },
    {
        classes:    "button mature-button",
        text:       "Check/Uncheck Mature",
        handler:    function () {toggleSelected(SUBMISSION_RATINGS.MATURE);}
    },
    {
        classes:    "button adult-button",
        text:       "Check/Uncheck Adult",
        handler:    function () {toggleSelected(SUBMISSION_RATINGS.ADULT);}
    },
    {
        classes:    "button open-button open-checked-button",
        text:       "Open Checked",
        handler:    function () {openSubmissions(findSelectedSubmissions());}
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
chrome.extension.sendMessage({type: "showPageAction"});

// Listen for messages from the extension
chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.type) {
        case "getSubmissions":
            // Page action clicked: find and open all submissions on the page
            sendResponse(findAllSubmissions());
            break;
        default:
            // Unknown
            console.warn("unknown message type received: " + message.type);
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

function toggleSelected(submissionRating) {
    // Find containers for elements of the specified type
    var containers = findContainersWithClassName(submissionRating.className);

    // "Select" the submission in the container
    containers.forEach(function (container) {
        var checkbox = getSelectionCheckboxFromContainer(container);
        if (checkbox && (checkbox.checked === submissionRating.state)) {
            checkbox.click();
        }
    });
    submissionRating.state = !submissionRating.state;
}

function openSubmissions(submissions) {
    // Send submissions to the extension to be opened
    chrome.extension.sendMessage({
        type:           "openSubmissions",
        submissions:    submissions
    });
}

function findAllSubmissions() {
    var ANCHOR_TAG = "a";
    return toArray(
        // Find all anchor elements
        document.getElementsByTagName(ANCHOR_TAG)
    ).filter(function (anchorElement) {
        // Filter for those that refer to submission pages
        return (anchorElement.pathname.search("^/view") === 0);
    }).map(function (anchorElement) {
        // Return the full paths of the submission pages
        return anchorElement.href;
    });
}

function findSelectedSubmissions() {
    // Find all checked submission-container elements
    var checkedContainers = findContainersWithClassName(CHECKED_CONTAINER_CLASS);
    return getSubmissionsFromContainers(checkedContainers);
}

function findContainersWithClassName(type) {
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
    if (count !== 2) {
        console.warn("unexpected number of anchor tags in container: " + count + " (expected 2)");
        if (count < 1)
            return null;
    }

    // We expect the first anchor to refer to the submission, and the second to its author
    return foundReferences[0].href;
}

function getSelectionCheckboxFromContainer(containerElement) {
    var SELECTION_CHECKBOX_ELEMENT_TAGNAME = "input";
    var SELECTION_CHECKBOX_ELEMENT_TYPE = "checkbox";
    var inputDescendants = containerElement.getElementsByTagName(SELECTION_CHECKBOX_ELEMENT_TAGNAME);
    var checkboxInputs = [];
    for (var i = 0; i < inputDescendants.length; i++) {
        var inputElement = inputDescendants[i];
        if (inputElement.type.toLowerCase() === SELECTION_CHECKBOX_ELEMENT_TYPE)
            checkboxInputs.push(inputElement);
    }
    var count = checkboxInputs.length;
    if (count !== 1) {
        console.warn("unexpected number of checkbox elements in container: " + count + " (expected 1)");
        if (count < 1)
            return null;
    }
    return checkboxInputs[0];
}

