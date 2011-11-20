chrome.extension.connect().postMessage(findSubmissions());

function findSubmissions()
{
	// Find the thumbnails for all submissions of the types we want to open
	var submissionThumbs = document.getElementsByClassName("thumb-overlay");

	// For each thumbnail, find the reference to the corresponding submission page
	var foundSubmissions = [];
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
				return;
		}

		// Add the first anchor found to the list of submission-page links to open
		foundSubmissions.push(anchors[0].href);
	}

	return foundSubmissions;
}

