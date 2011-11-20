var submissionsToOpen;
var loadingTabs;

function openSubmission(submission)
{
	// Create a new tab to display the submission page
	var newTab = chrome.tabs.create({
		url:		submission,
		selected:	false
	});

	// Add the tab's id to the list of tabs that are currently loading
	loadingTabs.push(newTab.id);
}

chrome.pageAction.onClicked.addListener(function(tab) {
	chrome.tabs.executeScript(tab.id, {file: "content_script.js"});
});

chrome.extension.onConnect.addListener(function(port) {
	// Set up a listener to receive a list of submission-page links from the content script
	port.onMessage.addListener(function(submissions) {
		// Hold a reference to the submissions
		submissionsToOpen = submissions;

		// Start opening tabs for the submissions
		for (var i = 0; (i < localStorage["numconcurrent"]) && (submissionsToOpen.length > 0); i++)
			openSubmission(submissionsToOpen.shift());
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
	// If the newly-loaded page is a tab opened by this extension, check if we should load the next submission
	else if ((var index = loadingTabs.indexOf(tabId)) > -1)
	{
		// Remove the completed tab from our set of loading tabs
		loadingTabs.splice(index, 1);

		// If we have more submissions to open, start the next one
		if (submissionsToOpen.length > 0)
			openSubmission(submissionsToOpen.shift());
	}
});

