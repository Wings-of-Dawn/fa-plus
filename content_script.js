var ACTIONS_DIV_CLASS = "actions";
var ACTIONS_BUTTONS = [
    {
        classes:    "button open-button open-all-button",
        text:       "Open All",
        handler:    "openAllSubmissions"
    },
    {
        classes:    "button general-button",
        text:       "Check General",
        handler:    "selectGeneralSubmissions"
    },
    {
        classes:    "button mature-button",
        text:       "Check Mature",
        handler:    "selectMatureSubmissions"
    },
    {
        classes:    "button adult-button",
        text:       "Check Adult",
        handler:    "selectAdultSubmissions"
    },
    {
        classes:    "button open-button open-checked-button",
        text:       "Open Checked",
        handler:    "openSelectedSubmissions"
    }
];

var INPUT_ELEMENT_TYPE_TAG = "input";

//  Create divs containing the buttons we want to add
var selectionButtonsTop = document.createElement("div");
selectionButtonsTop.setAttribute("class", ACTIONS_DIV_CLASS);
var selectionButtonsBottom = document.createElement("div");
selectionButtonsBottom.setAttribute("class", ACTIONS_DIV_CLASS);
ACTIONS_BUTTONS.forEach(function (buttonData) {
    makeButton(buttonData, selectionButtonsTop);
    makeButton(buttonData, selectionButtonsBottom);
});

// Find the "actions" divs in the messages-list form
var MESSAGES_FORM_ID = "messages-form";
var messageForm = document.getElementById(MESSAGES_FORM_ID);
var ACTIONS_DIV_CLASS = "actions";
var actionsDivs = messageForm.getElementsByClassName(ACTIONS_DIV_CLASS);

// Add our row of buttons before each of the existing rows
messageForm.insertBefore(selectionButtonsBottom, actionsDivs[1].nextSibling); // Ordering is important! Collection will be mutated
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

function makeButton(buttonData, container) {
    // Create a button element
    var button = document.createElement("input");
    button.setAttribute("class", buttonData.classes);
    button.setAttribute("type", "button");
    button.setAttribute("value", buttonData.text);

    // Add a click handler
    button.addEventListener("click", window[buttonData.handler], false);

    // Add the button to the new div
    container.appendChild(button);
}

function selectGeneralSubmissions()
{
    var GENERAL_THUMB_CLASS_NAME = "general";
    selectSubmissionsOfType(GENERAL_THUMB_CLASS_NAME);
}

function selectMatureSubmissions()
{
    var MATURE_THUMB_CLASS_NAME = "mature";
    selectSubmissionsOfType(MATURE_THUMB_CLASS_NAME);
}

function selectAdultSubmissions()
{
    var ADULT_THUMB_CLASS_NAME = "adult";
    selectSubmissionsOfType(ADULT_THUMB_CLASS_NAME);
}

function selectSubmissionsOfType(type)
{
    // Find containers for elements of the specified type
    var containers = findContainersForSubmissionType(type);

    // Find and check the checkbox in each container
    containers.forEach(function (containerElement) {
        // Find input elements of the correct type in the container
        var inputElements = containerElement.getElementsByTagName(INPUT_ELEMENT_TYPE_TAG);
        var checkboxes = [];
        for (var i = 0; i < inputElements.length; i++)
        {
            var inputElement = inputElements[i];
            if (isCheckbox(inputElement))
                checkboxes.push(inputElement);
        }

        // Check that at least one such element exists
        if (checkboxes.length !== 1)
            console.warn("unexpected number of checkbox elements in container: " + checkboxes.length + " (expected 1)");

        // Check the checkbox (or checkboxes, if we found more than one)
        checkboxes.forEach(function (checkbox) {
            if (!checkbox.checked)
                checkbox.click();
        });
    });
}

function openSelectedSubmissions()
{
    // Send the list of selected submissions to the extension to be opened
    chrome.extension.sendRequest({
        type:           "openSubmissions",
        submissions:    findSelectedSubmissions()
    });
}

function openAllSubmissions()
{
    // Send all submissions to the extension to be opened
    chrome.extension.sendRequest({
        type:           "openSubmissions",
        submissions:    findAllSubmissions()
    });
}

function findSubmissionThumbnails()
{
    var SUBMISSION_THUMB_CLASS_NAME = "thumb-overlay";
    return document.getElementsByClassName(SUBMISSION_THUMB_CLASS_NAME);
}

function findAllSubmissions()
{
    // Find all submission thumbnails
    var submissionThumbs = findSubmissionThumbnails();

    // Find the submission reference corresponding to each thumbnail
    var foundSubmissions = [];
    for (var i = 0; i < submissionThumbs.length; i++)
    {
        var thumb = submissionThumbs[i];
        var container = findSubmissionContainer(thumb);
        if (!container)
            continue;
        var submission = getSubmissionFromContainer(container);
        if (!submission)
            continue;
        foundSubmissions.push(submission);
    }
    return foundSubmissions;
}

function findContainersForSubmissionType(type)
{
    var foundContainers = [];
    var lowercaseType = type.toLowerCase();

    // Find the thumbnails for all submissions on the page
    var submissionThumbs = findSubmissionThumbnails();

    // For each thumbnail, check if it is the correct type, and if so, get its list-item container element
    for (var i = 0; i < submissionThumbs.length; i++)
    {
        // Check if the thumbnail's classes include one of the allowed submission types
        var thumbnail = submissionThumbs[i];
        if (thumbnail.className.toLowerCase().indexOf(lowercaseType) < 0)
            continue;

        // Find the submission's list-item
        var container = findSubmissionContainer(thumbnail);
        if (!container)
            continue;

        // Add the container to the list
        foundContainers.push(container);
    }
    return foundContainers;
}

function findSelectedSubmissions()
{
    // Find all input elements on the page
    var inputElements = document.getElementsByTagName(INPUT_ELEMENT_TYPE_TAG);

    // Use this list to find submissions whose checkbox is checked
    var foundSubmissions = [];
    for (var i = 0; i < inputElements.length; i++)
    {
        var inputElement = inputElements[i];
        if (!isCheckbox(inputElement) || !inputElement.checked)
            continue;

        // Find the checkbox's container
        var container = findSubmissionContainer(inputElement);
        if (!container)
            continue;

        // Find the anchor referring to the submission in the container
        var submission = getSubmissionFromContainer(container);
        if (!submission)
            continue;

        // Add the reference to the list
        foundSubmissions.push(submission);
    }
    return foundSubmissions;
}

function isCheckbox(inputElement)
{
    var CHECKBOX_ELEMENT_TYPE = "checkbox";
    return (inputElement.type.toLowerCase() == CHECKBOX_ELEMENT_TYPE);
}

function findSubmissionContainer(submissionElement)
{
    var SUBMISSION_CONTAINER_ELEMENT_TYPE_TAG = "li";
    var currentElement = submissionElement;
    while (currentElement = currentElement.parentNode)
    {
        if (currentElement.tagName.toLowerCase() == SUBMISSION_CONTAINER_ELEMENT_TYPE_TAG)
            return currentElement;
    }
    console.warn("no submission-list container element found for element:");
    console.warn(submissionElement);
    return null;
}

function getSubmissionFromContainer(containerElement)
{
    var SUBMISSION_REFERENCE_ELEMENT_TYPE_TAG = "a";
    var foundReferences = containerElement.getElementsByTagName(SUBMISSION_REFERENCE_ELEMENT_TYPE_TAG);
    var count = foundReferences.length;
    if (count !== 2)
    {
        console.warn("unexpected number of anchor tags in container: " + count + " (expected 2)");
        if (count < 1)
            return null;
    }

    // We expect the first anchor to refer to the submission, and the second to it's submitter
    return foundReferences[0].href;
}

