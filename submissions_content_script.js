const SUBMISSION_RATINGS = {
  GENERAL: "r-general",
  MATURE: "r-mature",
  ADULT: "r-adult"
};

const ADDED_ACTIONS_DIV_CLASSES = "added-actions";
const ADDED_ACTIONS_BUTTONS = [
  {
    classes: "button open-button open-all-button",
    text: "Open All",
    handler: () => openSubmissions(getAllSubmissions())
  },
  {
    classes: "button general-button",
    text: "Check/Uncheck General",
    handler: () => toggleChecked(getSubmissionsByRating(SUBMISSION_RATINGS.GENERAL))
  },
  {
    classes: "button mature-button",
    text: "Check/Uncheck Mature",
    handler: () => toggleChecked(getSubmissionsByRating(SUBMISSION_RATINGS.MATURE))
  },
  {
    classes: "button adult-button",
    text: "Check/Uncheck Adult",
    handler: () => toggleChecked(getSubmissionsByRating(SUBMISSION_RATINGS.ADULT))
  },
  {
    classes: "button open-button open-checked-button",
    text: "Open Checked",
    handler: () => openSubmissions(getCheckedSubmissions())
  }
];

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

  // Add our row of buttons before each of the existing rows.
  // Ordering is important! Collection will be mutated, so if we add the buttons to the top first,
  // the bottom buttons will appear in the wrong place.
  messageForm.insertBefore(selectionButtonsBottom, actionsDivs[1].nextSibling);
  messageForm.insertBefore(selectionButtonsTop, actionsDivs[0]);
}

// Add the buttons to the control areas.
addButtons();

// Tell the extension to show the page action icon.
chrome.extension.sendMessage({type: "showPageAction"});

// Listen for messages from the extension.
chrome.extension.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "getSubmissions":
      // Page action clicked: find and open all submissions on the page
      sendResponse(getAllSubmissions().map((container) => getSubmissionFromContainer(container)));
      break;
    default:
      // Unknown
      console.warn("unknown message type received: " + message.type);
      break;
  }
});

// If enabled, install handlers for keyboard shortcuts.
getOptionValue(OPTIONS.KEYBOARD_SHORTCUTS, (enabled) => {
  if (enabled) {
    document.addEventListener('keydown', handleKeyDown);
  }
});

function openSubmissions(submissions) {
  // Send submissions to the extension to be opened
  chrome.extension.sendMessage({
    type: "openSubmissions",
    submissions: submissions.map((container) => getSubmissionFromContainer(container))
  });
}

function handleKeyDown(e) {
  // Skip events already handled, events with a modifier key held, and events sent to inputs.
  const activeElementType = document.activeElement.tagName;
  if (e.preventDefaulted ||
      e.altKey || e.ctrlKey || e.metaKey ||
      activeElementType === "INPUT" || activeElementType === "TEXTAREA") {
    return;
  }

  const shortcutAction = getShortcutAction(e.key);
  if (shortcutAction) {
    e.preventDefault();
    shortcutAction();
  }
}

function getShortcutAction(eventKey) {
  switch (eventKey) {
    case "a": {
      return () => openSubmissions(findAllSubmissions());
    }
    case "s": {
      return () => openSubmissions(findSelectedSubmissions());
    }
    case "q": {
      return () => toggleSelected(SUBMISSION_RATINGS.GENERAL);
    }
    case "w": {
      return () => toggleSelected(SUBMISSION_RATINGS.MATURE);
    }
    case "e": {
      return () => toggleSelected(SUBMISSION_RATINGS.ADULT);
    }
  }
  return null;
}

function getSubmissionsByRating(ratingClassName) {
  return Array.from(document.getElementsByClassName(ratingClassName));
}

function getAllSubmissions() {
  return Array.from(document.getElementsByTagName("figure"));
}

function getCheckedSubmissions() {
  return getAllSubmissions().filter((container) => getCheckboxFromContainer(container).checked);
}

function allChecked(submissions) {
  return submissions.every((container) => getCheckboxFromContainer(container).checked);
}

function toggleChecked(submissions) {
  const targetState = !allChecked(submissions);

  // Rather than setting the checkbox states directly, click the checkboxes that don't match the
  // desired state, to trigger JS handlers properly.
  submissions
      .map((container) => getCheckboxFromContainer(container))
      .filter((checkbox) => checkbox.checked !== targetState)
      .forEach((checkbox) => checkbox.click());
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

function getCheckboxFromContainer(containerElement) {
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
