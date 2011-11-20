function openSubmission(submission)
{
	chrome.tabs.create({
		url:		submission,
		selected:	false
	});
}

chrome.pageAction.onClicked.addListener(function(tab) {
	chrome.tabs.executeScript(tab.id, {file: "content_script.js"});
});

chrome.extension.onConnect.addListener(function(port) {
	port.onMessage.addListener(function(submissions) {
		submissions.forEach(openSubmission);
	});
});

chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
	if (change.status == "complete")
	{
		if (tab.url.indexOf(".furaffinity.net/msg/submissions") != -1)
		{
			chrome.pageAction.show(tabId);
		}
	}
});

