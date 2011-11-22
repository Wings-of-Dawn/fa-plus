chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    sendResponse(findSubmissions(request.submissionTypes));
});

function findSubmissions(submissionTypes)
{
	var foundSubmissions = [];
    submissionTypes.forEach(function (type) {
	    // Find the thumbnails for all submissions of each type we want to open
        var submissionThumbs = document.getElementsByClassName(type);

        // For each thumbnail, find the reference to the corresponding submission page
        for (var i = 0; i < submissionThumbs.length; i++)
        {
            // Get the container around the thumbnail
            var submissionContainer = submissionThumbs[i].parentNode;

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
    });

	return foundSubmissions;
}

