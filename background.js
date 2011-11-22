var submissionsToOpen;
var openTabs = [];

function submissionsReceived(submissions)
{
    // Make this our new list of submissions to open
    submissionsToOpen = submissions;

    // Start opening submissions in tabs
    for (var i = 0; (i < getOptionValue(OPTIONS.TAB_COUNT)) && (submissionsToOpen.length > 0); i++)
        openSubmission(submissionsToOpen.shift());
}

function openSubmission(submission)
{
	// Create a new tab to display the submission page
	var newTab = chrome.tabs.create({
		url:		submission,
		selected:	false
	},
	function (newTab) {
		// Add the tab's id to the list of tabs that are currently loading
		openTabs.push(newTab.id);
	});
}

chrome.pageAction.onClicked.addListener(function(tab) {
    // Invoke the content script on this tab
	chrome.tabs.executeScript(tab.id, {file: "content_script.js"}, function () {
        // After the content script has loaded, prepare a request for submissions
        var types = [];
        if (getOptionValue(OPTIONS.OPEN_GENERAL))
            types.push(OPTIONS.OPEN_GENERAL.key);
        if (getOptionValue(OPTIONS.OPEN_MATURE))
            types.push(OPTIONS.OPEN_MATURE.key);
        if (getOptionValue(OPTIONS.OPEN_ADULT))
            types.push(OPTIONS.OPEN_ADULT.key);

        // Send the request, including a callback
        chrome.tabs.sendRequest(
            tab.id,
            {submissionTypes: types},
            submissionsReceived);
    });
});

chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
	// We're only interested in pages that have completely loaded
	if (change.status !== "complete")
		return;

	// If we've just loaded a page with submission thumbnails, show the "open all" icon
	if (tab.url.indexOf(".furaffinity.net/msg/submissions") != -1)
	{
		chrome.pageAction.show(tabId);
	}
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
	// Check if the closed tab is one of the submission pages we've opened
	if (openTabs.indexOf(tabId) > -1)
	{
		// Remove that tab from the list of open tabs
		openTabs.splice(openTabs.indexOf(tabId), 1);

		// If the window is still open, and we have more submissions to display, open another
		if (!removeInfo.isWindowClosing && (submissionsToOpen.length > 0))
			openSubmission(submissionsToOpen.shift());
	}
});
