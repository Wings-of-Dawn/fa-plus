chrome.extension.connect().postMessage(findSubmissions());

var SUBMISSION_TYPES_OPTIONS_KEYS = ["general", "mature", "adult"];

function findSubmissions()
{
	// Find the thumbnails for all submissions of the types we want to open
	var submissionThumbs = [];
	SUBMISSION_TYPES_OPTIONS_KEYS.foreach(function (key) {
		if (localStorage[key] === "true")
			submissionsThumbs.concat(document.getElementsByClass(key));
	});

	// For each thumbnail, find the reference to the corresponding submission page
	var foundSubmissions = [];
	submissionThumbs.foreach(function (thumb) {
		// Get the container around the thumbnail
		var submissionContainer = thumb.parentNode;

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
	});

	return foundSubmissions;
}

