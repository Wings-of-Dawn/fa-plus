var submissionsToOpen = [];
var submissionsTab;
var openTabs = [];

var ICON = {
    ICON_NORMAL:    {
        path:   "FAIcon.png",
        title:  "Open submissions in tabs"
    },
    ICON_CANCEL:    {
        path:   "FAIconCancel.png",
        title:  "Stop opening submissions"
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
    openTabs.forEach(function (tabId) {
        // I'm not sure why, but this call needs to be wrapped in an anonymous function; probably hidden arguments confused by additional parameters passed by forEach()
        chrome.pageAction.hide(tabId);
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
        openTabs.push(newTab.id);
    });
}

chrome.pageAction.onClicked.addListener(function(tab) {
    // If there are no tabs to be opened, run the content script to find submissions to open
    if (submissionsToOpen.length === 0)
    {
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

chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
    // We're only interested in pages that have completely loaded
    if (change.status !== "complete")
        return;

    // If we've just loaded a page with submission thumbnails, show the "open all" icon
    if (tab.url.indexOf(".furaffinity.net/msg/submissions") !== -1)
    {
        showPageAction(tabId, ICON.ICON_NORMAL);
        submissionsTab = tabId;
    }

    // If we've just opened a new tab for a submission, display the "cancel opening tabs" icon
    if ((openTabs.indexOf(tabId) >= 0) && (submissionsToOpen.length > 0))
        showPageAction(tabId, ICON.ICON_CANCEL);
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    // Check if the closed tab is one of the submission pages we've opened
    if (openTabs.indexOf(tabId) > -1)
    {
        // Remove that tab from the list of open tabs
        openTabs.splice(openTabs.indexOf(tabId), 1);

        // If the window is closing, there's nothing more for us to do
        if (removeInfo.isWindowClosing)
            return;

        // If there are more submissions to open, open the next one
        if (submissionsToOpen.length > 0)
            openSubmission(submissionsToOpen.shift());
        // Otherwise, change the page action icons back to their "empty queue" state
        else
            restoreDefaultActions();
    }
});

