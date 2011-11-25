chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    sendResponse(findSubmissions(request.submissionTypes));
});

function findSubmissions(submissionTypes)
{
    var SUBMISSION_THUMB_CLASS_NAME = "thumb-overlay";
	var foundSubmissions = [];

    // Find the thumbnail-container elements for all submissions on the page
    var submissionThumbs = document.getElementsByClassName(SUBMISSION_THUMB_CLASS_NAME);

    // For each thumbnail, check if it passes our filter, and find the reference to the corresponding submission page
    for (var i = 0; i < submissionThumbs.length; i++)
    {
        // Check if the thumbnail's classes include one of the allowed submission types
        var thumbnail = submissionThumbs[i];
        var allowed = submissionTypes.some(function (type) {
            return (thumbnail.className.indexOf(type) > 0);
        });
        if (!allowed)
            continue;

        // Get the container around the thumbnail
        var submissionContainer = thumbnail.parentNode;

        // Find all anchor (link) elements in the container node (should be exactly 1)
        var anchors = submissionContainer.getElementsByTagName('a');
        if (anchors.length !== 1)
        {
            console.warn("Unexpected number of anchor elements in submission container element: " + anchors.length + " (expected 1)");
            if (anchors.length < 1)
                continue;
        }

        // Add the first anchor found to the list of submission-page links to open
        foundSubmissions.push(anchors[0].href);
    }

	return foundSubmissions;
}
