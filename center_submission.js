var SUBMISSION_ELEMENT_ID = "submissionImg";
setTimeout(function () {
    var submissionElement = document.getElementById(SUBMISSION_ELEMENT_ID);
    if (submissionElement)
        submissionElement.scrollIntoView();
    else
        console.warn("cannot scroll to submission: no submission element found");
}, 500);
