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
    console.log("DEBUG: selecting submissions marked \"" + type + "\"");

    // Find containers for elements of the specified type
    var containers = findContainersForSubmissionType(type);

    // Find and check the checkbox in each container
    var INPUT_ELEMENT_TYPE_TAG = "input";
    var CHECKBOX_ELEMENT_TYPE = "checkbox";
    containers.forEach(function (containerElement) {
        // Find input elements of the correct type in the container
        var inputElements = containerElement.getElementsByTagName(INPUT_ELEMENT_TYPE_TAG);
        var checkboxes = [];
        for (var i = 0; i < inputElements.length; i++)
        {
            var inputElement = inputElements[i];
            if (inputElement.type.toLowerCase() == CHECKBOX_ELEMENT_TYPE)
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
    console.log("DEBUG: open selected");
}

function findContainersForSubmissionType(type)
{
    var SUBMISSION_THUMB_CLASS_NAME = "thumb-overlay";
    var foundContainers = [];
    var lowercaseType = type.toLowerCase();

    // Find the thumbnail-container elements for all submissions on the page
    var submissionThumbs = document.getElementsByClassName(SUBMISSION_THUMB_CLASS_NAME);

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
        {
            console.warn("no submission container found for submission thumbnail:");
            console.warn(thumbnail);
            continue;
        }

        // Add the container to the list
        foundContainers.push(container);
    }
    return foundContainers;
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
    return null;
}

