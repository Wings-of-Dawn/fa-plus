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
    handler: () => openSubmissions(getAllSubmissions()),
  },
  {
    classes: "button general-button",
    text: "Select/Deselect General",
    handler: () => toggleChecked(getSubmissionsByRating(SUBMISSION_RATINGS.GENERAL)),
  },
  {
    classes: "button mature-button",
    text: "Select/Deselect Mature",
    handler: () => toggleChecked(getSubmissionsByRating(SUBMISSION_RATINGS.MATURE)),
  },
  {
    classes: "button adult-button",
    text: "Select/Deselect Adult",
    handler: () => toggleChecked(getSubmissionsByRating(SUBMISSION_RATINGS.ADULT)),
  },
  {
    classes: "button open-button open-checked-button",
    text: "Open Selected",
    handler: () => openSubmissions(getCheckedSubmissions()),
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

// // Add the buttons to the control areas.
addButtons();

// // If enabled, install handlers for keyboard shortcuts.
// getOptionValue(OPTIONS.KEYBOARD_SHORTCUTS, (enabled) => {
//   if (enabled) {
//     document.addEventListener('keydown', handleKeyDown);

//     // Create a floating element to show the current shortcut mode.
//     shortcutModeLabel = createAndAddModeLabel();
//   }
// });

function addButtons() {
  // Find the "actions" sections at the top and bottom of the page.
  const actionsSections = document.querySelectorAll('.section-options.actions');

  actionsSections.forEach(
    section =>
      ADDED_ACTIONS_BUTTONS
        .map(buttonData => makeButton(buttonData))
        .forEach(button => section.prepend(button)));
}

function makeButton(buttonData) {
  // Create a button element.
  const button = document.createElement("button");
  button.setAttribute("class", buttonData.classes);
  button.setAttribute("type", "button");
  button.textContent = buttonData.text;

  // Add a click handler.
  button.addEventListener("click", buttonData.handler, false);

  return button;
}

// function createAndAddModeLabel() {
//   const label = document.createElement("div");
//   label.id = "shortcut-mode-label";
//   label.hidden = true;
//   document.body.appendChild(label);
//   return label;
// }

async function openSubmissions(submissions) {
  // Send submissions to the extension to be opened
  await chrome.runtime.sendMessage({
    type: "openSubmissions",
    submissions: submissions.map(container => getSubmissionFromContainer(container))
  });
}

// function handleKeyDown(e) {
//   // Skip events already handled, events with a modifier key (other than shift) held, and events
//   // sent to text inputs.
//   // TODO: this is a little fragile; find a better way to filter types of inputs
//   const activeElement = document.activeElement;
//   if (e.preventDefaulted ||
//       e.altKey || e.ctrlKey || e.metaKey ||
//       (activeElement.tagName === "INPUT" && activeElement.type === "text") ||
//       activeElement.tagName === "TEXTAREA") {
//     return;
//   }

//   const shortcutAction = getShortcutAction(e);
//   if (shortcutAction) {
//     e.preventDefault();
//     shortcutAction();
//   }
// }

// function getShortcutAction(e) {
//   // If a "mode" key is pressed, return an action that changes the current mode.
//   switch (e.key) {
//     // Shift-R: remove submissions mode.
//     case "R":
//       return () => setShortcutMode(SHORTCUT_MODE.REMOVE);
//     // V: "view" (open) submissions mode.
//     case "v":
//       return () => setShortcutMode(SHORTCUT_MODE.VIEW);
//   }

//   // Otherwise, determine a shortcut action (if any) based on the current mode.
//   switch (shortcutMode) {
//     case SHORTCUT_MODE.DEFAULT:
//       return getSelectShortcutAction(e.key);
//     case SHORTCUT_MODE.VIEW:
//       return getViewShortcutAction(e.key);
//     case SHORTCUT_MODE.REMOVE:
//       return getRemoveShortcutAction(e.key);
//   }
//   return null;
// }

// function getSelectShortcutAction(eventKey) {
//   // If the key corresponds to a standard grouping of submissions, toggle their check-state.
//   const submissionsSource = submissionsSourceByKey(eventKey);
//   if (submissionsSource) {
//     return () => toggleChecked(submissionsSource.getter());
//   }

//   // Check for keys corresponding to other actions.
//   switch (eventKey) {
//     case "n":
//       return () => setChecked(getAllSubmissions(), false);
//     case "i":
//       return () => document.getElementsByClassName("invert-selection")[0].click();
//     // TODO: next/previous page navigation (tricky due to FA's layout classes)
//   }

//   // Not a "select submissions" shortcut key.
//   return null;
// }

// function getViewShortcutAction(eventKey) {
//   // If the key corresponds to a standard grouping of submissions, open them.
//   const submissionsSource = submissionsSourceByKey(eventKey);
//   if (submissionsSource) {
//     return () => {
//       appendShortcutLabelText(submissionsSource.label);
//       openSubmissions(submissionsSource.getter());
//       resetShortcutMode();
//     };
//   }

//   // Not a "view" shortcut key.
//   return null;
// }

// function getRemoveShortcutAction(eventKey) {
//   // If the key corresponds to a standard grouping of submissions, check them (if not already
//   // checked) and click the "remove checked" button.
//   const submissionsSource = submissionsSourceByKey(eventKey);
//   if (submissionsSource) {
//     return () => {
//       appendShortcutLabelText(submissionsSource.label);

//       // Locate the specified set of submissions first.
//       submissions = submissionsSource.getter();

//       // Uncheck all submissions, to avoid removing any not specified by the shortcut.
//       setChecked(getAllSubmissions(), false);

//       // Check the specified submissions and click the remove button.
//       setChecked(submissions, true);
//       document.getElementsByClassName("remove-checked")[0].click();
//       resetShortcutMode();
//     };
//   }

//   // If the key corresponds to the "nuke submissions" action, click the button.
//   if (eventKey === "n") {
//     return () => {
//       // Should open a confirmation dialog rather than acting immediately.
//       // (FA, if you change this behavior without warning, so help you...)
//       document.getElementsByClassName("remove-nuke")[0].click();
//       resetShortcutMode();
//     };
//   }

//   // Not a "remove submissions" shortcut key.
//   return null;
// }

// function submissionsSourceByKey(eventKey) {
//   switch (eventKey) {
//     case "e":
//       return {
//         label: "all",
//         getter: () => getAllSubmissions()
//       };
//     case "c":
//       return {
//         label: "checked",
//         getter: () => getCheckedSubmissions()
//       };
//     case "g":
//       return {
//         label: "general",
//         getter: () => getSubmissionsByRating(SUBMISSION_RATINGS.GENERAL)
//       };
//     case "m":
//       return {
//         label: "mature",
//         getter: () => getSubmissionsByRating(SUBMISSION_RATINGS.MATURE)
//       };
//     case "a":
//       return {
//         label: "adult",
//         getter: () => getSubmissionsByRating(SUBMISSION_RATINGS.ADULT)
//       };
//   }
//   return null;
// }

// function setShortcutMode(mode) {
//   clearTimeout(shortcutModeTimeout);

//   shortcutMode = mode;
//   shortcutModeLabel.textContent = mode.labelText;
//   shortcutModeLabel.className = mode.labelClasses;
//   shortcutModeLabel.hidden = false;

//   // Automatically return to the default shortcut-mode after a short delay.
//   shortcutModeTimeout = setTimeout(() => {
//     shortcutMode = SHORTCUT_MODE.DEFAULT;
//     shortcutModeLabel.hidden = true;
//   }, 500);
// }

// function appendShortcutLabelText(text) {
//   shortcutModeLabel.textContent = shortcutModeLabel.textContent + " " + text;
// }

// function resetShortcutMode() {
//   clearTimeout(shortcutModeTimeout);
//   shortcutMode = SHORTCUT_MODE.DEFAULT;

//   // Leave the mode-label visible for a few moments.
//   shortcutModeTimeout = setTimeout(() => shortcutModeLabel.hidden = true, 1000);
// }

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
