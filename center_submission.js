var SUBMISSION_ELEMENT_ID = "submissionImg";

function centerViewOnSubmission() {
    debugger;
    var submissionElement = document.getElementById(SUBMISSION_ELEMENT_ID);
    if (!submissionElement) {
        console.warn("cannot scroll to submission: no submission element found");
        return;
    }

    // Determine which coordinates should be placed in the top-left of the window
    var targetX = submissionElement.x - ((document.documentElement.clientWidth - submissionElement.width) / 2);
    var targetY = submissionElement.y - ((document.documentElement.clientHeight - submissionElement.height) / 2);

    // Scroll the window to the target point
    window.scrollTo(targetX, targetY);
}

// Wait a short time to ensure everything is loaded before attempting to center the submission
setTimeout(centerViewOnSubmission, 500);
