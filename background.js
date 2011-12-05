var submissionsToOpen = [];
var submissionsTab;
var openTabs = [];

var ICON = {
    ICON_NORMAL:    {
        path:   "FAIcon.png",
        title:  "Click to open all submissions"
    },
    ICON_CANCEL:    {
        path:   "FAIconCancel.png",
        title:  "Click to stop opening new submissions"
    }
};

function showPageAction(tabId, icon)
{
    chrome.pageAction.setIcon({tabId: tabId, path: icon.path});
    chrome.pageAction.setTitle({tabId: tabId, title: icon.title});
    chrome.pageAction.show(tabId);
}

function restoreDefaultActions()
{
    // Restore the original icon on the submissions tab
    showPageAction(submissionsTab, ICON.ICON_NORMAL);

    // Remove the "cancel" icon from all open tabs
    openTabs.forEach(function (tabData) {
        chrome.pageAction.hide(tabData.id);
    });
}

function submissionsReceived(submissions)
{
    // Make this our new list of submissions to open
    submissionsToOpen = submissions;

    // Start opening submissions in tabs
    for (var i = 0; (i < getOptionValue(OPTIONS.TAB_COUNT)) && (submissionsToOpen.length > 0); i++)
        openSubmission(submissionsToOpen.shift());

    // If there are more submissions to be opened, give the user the option of stopping them from opening
    if (submissionsToOpen.length > 0)
        showPageAction(submissionsTab, ICON.ICON_CANCEL);
}

function openSubmission(submission)
{
    // Create a new tab to display the submission page
    var newTab = chrome.tabs.create({
        url:        submission,
        selected:   false
    },
    function (newTab) {
        // Add the tab's id to the list of tabs that are loading or open
        openTabs.push({id: newTab.id, submissionURL: submission});
    });
}

function findOpenTab(tabId)
{
    var matches = openTabs.filter(function (tabData) {
        return (tabData.id === tabId);
    });
    if (matches.length < 1)
        return null;
    return matches[0];
}

function scrollToSubmission(tabId)
{
    chrome.tabs.executeScript(tabId, {file: "center_submission.js"});
}

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    switch (request.type)
    {
        case "showPageAction":
            // Content script has found a tab with submissions; display the page action
            showPageAction(sender.tab.id, ICON.ICON_NORMAL);

            // Note which tab is the submissions page
            submissionsTab = sender.tab.id;

            break;
        case "openSubmissions":
            // Request from content script to open a collection of submissions
            submissionsReceived(request.submissions);
            break;
        default:
            // Unknown
            console.warn("unknown request type received: " + request.type);
            break;
    }
});

chrome.pageAction.onClicked.addListener(function (tab) {
    // If there are no tabs to be opened, run the content script to find submissions to open
    if (submissionsToOpen.length === 0)
    {
            // Send the request, including a callback
            chrome.tabs.sendRequest(
                tab.id,
                {type: "getSubmissions"},
                submissionsReceived);
    }
    // If we are in the process of opening submissions, stop doing so
    else
    {
        // Clear the list of submissions
        submissionsToOpen = [];

        // Reset page-action icons
        restoreDefaultActions();
    }
});

chrome.tabs.onUpdated.addListener(function (tabId, change, tab) {
    // We're only interested in pages that have completely loaded
    if (change.status !== "complete")
        return;

    // Check if the tab one of the tabs we opened, and that it's displaying the page we displayed
    var openTabData = findOpenTab(tabId);
    if (openTabData && (openTabData.submissionURL.indexOf(tab.url) >= 0))
    {
        // Show the "stop opening tabs" action icon, if applicable
        if (submissionsToOpen.length > 0)
            showPageAction(tabId, ICON.ICON_CANCEL);

        // If requested, center the submission in the page
        if (getOptionValue(OPTIONS.AUTO_CENTER))
            scrollToSubmission(tabId);
    }
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    // Check if the closed tab is one of the submission pages we've opened
    var tab = findOpenTab(tabId);
    if (tab)
    {
        // Remove that tab from the list of open tabs
        openTabs.splice(openTabs.indexOf(tab), 1);

        // If the window is closing, there's nothing more for us to do
        if (removeInfo.isWindowClosing)
            return;

        // If there are more submissions to open, open the next one
        if (submissionsToOpen.length > 0)
            openSubmission(submissionsToOpen.shift());

        // If this was the last submission, change the page action icons back to their "empty queue" state
        if (submissionsToOpen.length === 0)
            restoreDefaultActions();
    }
});

