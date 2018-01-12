const SUBMISSION_ELEMENT_ID = "submissionImg";

const FAVORITE_LINK_PATTERN = RegExp("/fav/");

function centerViewOnSubmission() {
  const submissionElement = document.getElementById(SUBMISSION_ELEMENT_ID);
  if (!submissionElement) {
    console.warn("cannot scroll to submission: no submission element found");
    return;
  }

  // Determine which coordinates should be placed in the top-left of the window.
  const boundingRect = submissionElement.getBoundingClientRect();
  const targetX = boundingRect.x + ((boundingRect.width - document.documentElement.clientWidth) / 2);
  const targetY = boundingRect.y + ((boundingRect.height - document.documentElement.clientHeight) / 2);

  // Scroll the window to the target point.
  window.scrollTo(targetX, targetY);
}

// If view-centering is requested, wait a short time to ensure everything is loaded.
getOptionValue(OPTIONS.AUTO_CENTER, (enabled) => {
  if (enabled) {
    setTimeout(centerViewOnSubmission, 500);
  }
});

// If enabled, install handlers for keyboard shortcuts.
getOptionValue(OPTIONS.KEYBOARD_SHORTCUTS, (enabled) => {
  if (enabled) {
    document.addEventListener('keydown', handleKeyDown);
  }
});

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
    case "j":
      return () => document.getElementsByClassName('next')[0].click();
    case "k":
      return () => document.getElementsByClassName('prev')[0].click();
    case "f":
      return () => getFavoriteLink().click();
    case "v":
      return () => document.getElementById(SUBMISSION_ELEMENT_ID).click();
  }
  return null;
}

function getFavoriteLink() {
  const favLinks =
      Array.from(document.getElementsByTagName("a"))
          .filter((link) => FAVORITE_LINK_PATTERN.test(link.href));
  return favLinks[0];
}
