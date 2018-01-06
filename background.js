var submissionsToOpen = [];
var submissionsTabId = null;
var submissionsWindowId = null;
var loadingTabs = [];
var openTabs = [];

var ICON = {
  ICON_NORMAL:  {
    path: "FAIcon.png",
    title: "Click to open all submissions"
  },
  ICON_CANCEL:  {
    path: "FAIconCancel.png",
    title: "Click to stop opening new submissions"
  }
};

function showPageAction(tabId, icon) {
  chrome.pageAction.setIcon({tabId: tabId, path: icon.path});
  chrome.pageAction.setTitle({tabId: tabId, title: icon.title});
  chrome.pageAction.show(tabId);
}

function restoreDefaultActions() {
  // Restore the original icon on the submissions tab
  if (submissionsTabId) {
    showPageAction(submissionsTabId, ICON.ICON_NORMAL);
  }

  // Remove the "cancel" icon from all open tabs
  openTabs.forEach(function (tabData) {
    chrome.pageAction.hide(tabData.id);
  });
}

function submissionsReceived(newSubmissions) {
  // Add the new submissions to the list of submissions to open
  submissionsToOpen = submissionsToOpen.concat(newSubmissions);

  // Start opening submissions in tabs, up to the maximum number of tabs to open.
  getOptionValue(
      OPTIONS.LOAD_COUNT,
      (maxLoadingCount) => {
        const currentCount = (loadingTabs.length + openTabs.length);
        for (let i = currentCount; (i < maxLoadingCount) && (submissionsToOpen.length > 0); i++) {
          openSubmission(submissionsToOpen.shift());
        }
      });
}

function openNextSubmission() {
  // Check if the submissions queue is empty, and if not, load the next one
  if ((submissionsToOpen.length > 0) && canOpenTab()) {
    openSubmission(submissionsToOpen.shift());
  }

  // If this was the last submission in the queue, remove the page action icons
  if (submissionsToOpen.length === 0) {
    restoreDefaultActions();
  }
}

function canOpenTab() {
  // Check the number of tabs currently loading
  if (loadingTabs.length >= getOptionValue(OPTIONS.LOAD_COUNT)) {
    return false;
  }

  // Check the total number of tabs we have open, if applicable
  var totalTabs = (loadingTabs.length + openTabs.length);
  if (getOptionValue(OPTIONS.AUTO_OPEN) && (totalTabs >= getOptionValue(OPTIONS.TAB_COUNT))) {
    return false;
  }

  return true;
}

function openSubmission(submission) {
  // Create a new tab to display the submission page
  var newTab = chrome.tabs.create({
    windowId: submissionsWindowId,
    url: submission,
    selected: false
  },
  function (newTab) {
    // Add the tab's id to the list of loading tabs
    loadingTabs.push({id: newTab.id, submissionURL: submission});
  });
}

function findTab(tabId, tabSet) {
  var matches = tabSet.filter(function (tabData) {
    return (tabData.id === tabId);
  });
  if (matches.length < 1) {
    return null;
  }
  return matches[0];
}

function removeTabData(tabData, tabSet) {
  tabSet.splice(tabSet.indexOf(tabData), 1);
}

chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.type) {
    case "showPageAction": {
      // Content script has found a tab with submissions; display the page action
      showPageAction(sender.tab.id, ICON.ICON_NORMAL);

      // Note which tab is the submissions page
      submissionsTabId = sender.tab.id;

      break;
    }
    case "openSubmissions": {
      // Request from content script to open a collection of submissions
      // Note the window id in which to open the submissions
      // FIXME: we should group tabs by window, rather than assuming all tabs open in the same window
      submissionsWindowId = sender.tab.windowId;

      // Open the submissions in tabs
      submissionsReceived(message.submissions);
      break;
    }
    default: {
      // Unknown
      console.warn("unknown message type received: " + message.type);
      break;
    }
  }
});

chrome.pageAction.onClicked.addListener(function (tab) {
  // If there are no tabs to be opened, run the content script to find submissions to open
  if (submissionsToOpen.length === 0) {
    // Send the message, including a callback
    chrome.tabs.sendMessage(
      tab.id,
      {type: "getSubmissions"},
      submissionsReceived);
  } else {
    // If we are in the process of opening submissions, stop doing so
    // Clear the list of submissions
    submissionsToOpen = [];

    // Reset page-action icons
    restoreDefaultActions();
  }
});

chrome.tabs.onUpdated.addListener(function (tabId, change, tab) {
  // We're only interested in pages that have completely loaded.
  if (change.status !== "complete") {
    return;
  }

  // Check if the tab is one of the tabs we opened.
  var tabData = findTab(tabId, loadingTabs);
  if (!tabData) {
    return;
  }

  // Transfer to the list of open tabs.
  removeTabData(tabData, loadingTabs);
  openTabs.push(tabData);

  // Show the "stop opening tabs" action icon, if applicable
  if (submissionsToOpen.length > 0) {
    showPageAction(tabId, ICON.ICON_CANCEL);
  }

  // If requested, open the next submission automatically.
  getOptionValue(
      OPTIONS.AUTO_OPEN,
      (enabled) => {
        if (enabled) {
          openNextSubmission();
        }
      });
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
  // Check if this was the submissions tab
  if (tabId === submissionsTabId) {
    // Destroy our reference to the tab
    submissionsTabId = null;
    return;
  }

  // Check if the closed tab is one of the submission pages we've opened
  var tabData = null;
  if ((tabData = findTab(tabId, openTabs))) {
    // Remove the tab from the list of open tabs
    removeTabData(tabData, openTabs);
  } else if ((tabData = findTab(tabId, loadingTabs))) {
    // Check if the closed tab was a tab that was still loading
    // Remove the tab from the list of loading tabs
    removeTabData(tabData, loadingTabs);
  }

  // If the window is closing, stop opening new tabs
  if (removeInfo.isWindowClosing) {
    submissionsToOpen = [];
    submissionsWindowId = null;
    return;
  }

  // Otherwise, attempt to open the next tab
  openNextSubmission();
});
