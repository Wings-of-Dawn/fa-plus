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

const SHORTCUT_MODE = {
  DEFAULT: {
    labelText: "Select...",
    labelClasses: ""
  },
  VIEW: {
    labelText: "Open...",
    labelClasses: "view-mode-label"
  },
  REMOVE: {
    labelText: "Remove...",
    labelClasses: "remove-mode-label"
  }
};
let shortcutMode = SHORTCUT_MODE.DEFAULT;
let shortcutModeLabel;
let shortcutModeTimeout;

// Add the buttons to the control areas.
addButtons();

// Tell the extension to show the page action icon.
chrome.extension.sendMessage({type: "showPageAction"});

// Listen for messages from the extension.
chrome.extension.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "getSubmissions":
      // Page action clicked: open all submissions on the page.
      openSubmissions(getAllSubmissions());
      break;
    default:
      console.warn("unknown message type received: " + message.type);
      break;
  }
});

// If enabled, install handlers for keyboard shortcuts.
getOptionValue(OPTIONS.KEYBOARD_SHORTCUTS, (enabled) => {
  if (enabled) {
    document.addEventListener('keydown', handleKeyDown);
  }

  // Create a floating element to show the current shortcut mode.
  shortcutModeLabel = createAndAddModeLabel();
});

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

function createAndAddModeLabel() {
  const label = document.createElement("div");
  label.id = "shortcut-mode-label";
  label.hidden = true;
  document.body.appendChild(label);
  return label;
}

function openSubmissions(submissions) {
  // Send submissions to the extension to be opened
  chrome.extension.sendMessage({
    type: "openSubmissions",
    submissions: submissions.map((container) => getSubmissionFromContainer(container))
  });
}

function handleKeyDown(e) {
  // Skip events already handled, events with a modifier key (other than shift) held, and events
  // sent to text inputs.
  // TODO: this is a little fragile; find a better way to filter types of inputs
  const activeElement = document.activeElement;
  if (e.preventDefaulted ||
      e.altKey || e.ctrlKey || e.metaKey ||
      (activeElement.tagName === "INPUT" && activeElement.type === "text") ||
      activeElement.tagName === "TEXTAREA") {
    return;
  }

  const shortcutAction = getShortcutAction(e);
  if (shortcutAction) {
    e.preventDefault();
    shortcutAction();
  }
}

function getShortcutAction(e) {
  // If a "mode" key is pressed, return an action that changes the current mode.
  switch (e.key) {
    // Shift-R: remove submissions mode.
    case "R":
      return () => setShortcutMode(SHORTCUT_MODE.REMOVE);
    // V: "view" (open) submissions mode.
    case "v":
      return () => setShortcutMode(SHORTCUT_MODE.VIEW);
  }

  // Otherwise, determine a shortcut action (if any) based on the current mode.
  switch (shortcutMode) {
    case SHORTCUT_MODE.DEFAULT:
      return getSelectShortcutAction(e.key);
    case SHORTCUT_MODE.VIEW:
      return getViewShortcutAction(e.key);
    case SHORTCUT_MODE.REMOVE:
      return getRemoveShortcutAction(e.key);
  }
  return null;
}

function getSelectShortcutAction(eventKey) {
  // If the key corresponds to a standard grouping of submissions, toggle their check-state.
  const submissionsSource = submissionsSourceByKey(eventKey);
  if (submissionsSource) {
    return () => toggleChecked(submissionsSource());
  }

  // Check for keys corresponding to other actions.
  switch (eventKey) {
    case "n":
      return () => setChecked(getAllSubmissions(), false);
    case "i":
      return () => document.getElementsByClassName("invert-selection")[0].click();
    // TODO: next/previous page navigation (tricky due to FA's layout classes)
  }

  // Not a "select submissions" shortcut key.
  return null;
}

function getViewShortcutAction(eventKey) {
  // If the key corresponds to a standard grouping of submissions, open them.
  const submissionsSource = submissionsSourceByKey(eventKey);
  if (submissionsSource) {
    return () => {
      openSubmissions(submissionsSource());
      resetShortcutMode();
    };
  }

  // Not a "view" shortcut key.
  return null;
}

function getRemoveShortcutAction(eventKey) {
  // If the key corresponds to a standard grouping of submissions, check them (if not already
  // checked) and click the "remove checked" button.
  const submissionsSource = submissionsSourceByKey(eventKey);
  if (submissionsSource) {
    return () => {
      // Locate the specified set of submissions first.
      submissions = submissionsSource();

      // Uncheck all submissions, to avoid removing any not specified by the shortcut.
      setChecked(getAllSubmissions(), false);

      // Check the specified submissions and click the remove button.
      setChecked(submissions, true);
      document.getElementsByClassName("remove-checked")[0].click();
      resetShortcutMode();
    };
  }

  // If the key corresponds to the "nuke submissions" action, click the button.
  if (eventKey === "n") {
    return () => {
      // Should open a confirmation dialog rather than acting immediately.
      // (FA, if you change this behavior without warning, so help you...)
      document.getElementsByClassName("remove-nuke")[0].click();
      resetShortcutMode();
    };
  }

  // Not a "remove submissions" shortcut key.
  return null;
}

function submissionsSourceByKey(eventKey) {
  switch (eventKey) {
    case "e":
      return () => getAllSubmissions();
    case "c":
      return () => getCheckedSubmissions();
    case "g":
      return () => getSubmissionsByRating(SUBMISSION_RATINGS.GENERAL);
    case "m":
      return () => getSubmissionsByRating(SUBMISSION_RATINGS.MATURE);
    case "a":
      return () => getSubmissionsByRating(SUBMISSION_RATINGS.ADULT);
  }
  return null;
}

function setShortcutMode(mode) {
  clearTimeout(shortcutModeTimeout);

  shortcutMode = mode;
  shortcutModeLabel.textContent = mode.labelText;
  shortcutModeLabel.className = mode.labelClasses;
  shortcutModeLabel.hidden = false;

  shortcutModeTimeout = setTimeout(() => resetShortcutMode(), 500);
}

function resetShortcutMode() {
  shortcutMode = SHORTCUT_MODE.DEFAULT;
  shortcutModeLabel.hidden = true;
  shortcutModeTimeout = undefined;
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
  setChecked(submissions, !allChecked(submissions));
}

function setChecked(submissions, targetState) {
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
