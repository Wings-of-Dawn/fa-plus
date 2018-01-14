const CHECKED_CONTAINER_CLASS = "checked";
const CHECKBOX_STATE = {
  CHECKED: true,
  UNCHECKED: false
};

const SUBMISSION_RATINGS = {
  GENERAL: {
    className: "r-general",
    state: CHECKBOX_STATE.UNCHECKED
  },
  MATURE: {
    className: "r-mature",
    state: CHECKBOX_STATE.UNCHECKED
  },
  ADULT: {
    className: "r-adult",
    state: CHECKBOX_STATE.UNCHECKED
  }
};

const ADDED_ACTIONS_DIV_CLASSES = "added-actions";
const ADDED_ACTIONS_BUTTONS = [
  {
    classes: "button open-button open-all-button",
    text: "Open All",
    handler: () => openSubmissions(findAllSubmissions())
  },
  {
    classes: "button general-button",
    text: "Check/Uncheck General",
    handler: () => toggleSelected(SUBMISSION_RATINGS.GENERAL)
  },
  {
    classes: "button mature-button",
    text: "Check/Uncheck Mature",
    handler: () => toggleSelected(SUBMISSION_RATINGS.MATURE)
  },
  {
    classes: "button adult-button",
    text: "Check/Uncheck Adult",
    handler: () => toggleSelected(SUBMISSION_RATINGS.ADULT)
  },
  {
    classes: "button open-button open-checked-button",
    text: "Open Checked",
    handler: () => openSubmissions(findSelectedSubmissions())
  }
];


function addButtons() {
  // Create divs containing the buttons we want to add
  const selectionButtonsTop = document.createElement("div");
  selectionButtonsTop.setAttribute("class", ADDED_ACTIONS_DIV_CLASSES);
  const selectionButtonsBottom = document.createElement("div");
  selectionButtonsBottom.setAttribute("class", ADDED_ACTIONS_DIV_CLASSES);
  ADDED_ACTIONS_BUTTONS.forEach((buttonData) => {
    selectionButtonsTop.appendChild(makeButton(buttonData));
    selectionButtonsBottom.appendChild(makeButton(buttonData));
  });

  // Find the "actions" divs in the messages-list form.
  const messageForm = document.getElementById("messages-form");
  const actionsDivs = messageForm.getElementsByClassName("actions");

  // Add our row of buttons before each of the existing rows
  messageForm.insertBefore(selectionButtonsBottom, actionsDivs[1].nextSibling); // Ordering is important! Collection will be mutated, so if we add the buttons to the top first, the bottom buttons will appear in the wrong place
  messageForm.insertBefore(selectionButtonsTop, actionsDivs[0]);
}

// Add the buttons to the control areas.
addButtons();

// Tell the extension to show the page action icon
chrome.extension.sendMessage({type: "showPageAction"});

// Listen for messages from the extension
chrome.extension.onMessage.addListener((message, sender, sendResponse) => {
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
  // Create a button element.
  const button = document.createElement("input");
  button.setAttribute("class", buttonData.classes);
  button.setAttribute("type", "button");
  button.setAttribute("value", buttonData.text);

  // Add a click handler.
  button.addEventListener("click", buttonData.handler, false);

  return button;
}

function toggleSelected(submissionRating) {
  // Find containers for elements of the specified type.
  const containers = Array.from(document.getElementsByClassName(submissionRating.className));

  // "Select" (or deselect) the submission in the container.
  containers
      .map((container) => getSelectionCheckboxFromContainer(container))
      .filter((checkbox) => checkbox && (checkbox.checked === submissionRating.state))
      .forEach((checkbox) => checkbox.click());

  // Keep track of the last known selection-state for these submissions.
  submissionRating.state = !submissionRating.state;
}

function openSubmissions(submissions) {
  // Send submissions to the extension to be opened
  chrome.extension.sendMessage({
    type: "openSubmissions",
    submissions: submissions
  });
}

function findAllSubmissions() {
  return Array.from(document.getElementsByTagName("a"))
      .filter((anchor) => anchor.pathname.search("^/view") === 0)
      .map((anchor) => anchor.href);
}

function findSelectedSubmissions() {
  // Find all checked submission-container elements
  const checkedContainers = Array.from(document.getElementsByClassName(CHECKED_CONTAINER_CLASS));
  return checkedContainers.map(getSubmissionFromContainer);
}

function getSubmissionFromContainer(containerElement) {
  const foundReferences = containerElement.getElementsByTagName("a");
  const count = foundReferences.length;
  if (count !== 3) {
    console.warn("unexpected number of anchor tags in container: " + count + " (expected 3)");
    if (count < 1) {
      return null;
    }
  }

  // We expect the first two anchors to refer to the submission, and the third to its author.
  return foundReferences[0].href;
}

function getSelectionCheckboxFromContainer(containerElement) {
  const checkboxInputs =
      Array.from(containerElement.getElementsByTagName("input"))
          .filter((inputElement) => inputElement.type.toLowerCase() === "checkbox");
  const count = checkboxInputs.length;
  if (count !== 1) {
    console.warn("unexpected number of checkbox elements in container: " + count + " (expected 1)");
    if (count < 1) {
      return null;
    }
  }
  return checkboxInputs[0];
}
