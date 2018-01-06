const SUBMISSION_ELEMENT_ID = "submissionImg";

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