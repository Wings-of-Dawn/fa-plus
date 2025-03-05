import { OPTIONS, getOptionValue, getOptionValues, } from "./options/options.js";

let submissionsToOpen = [];
let submissionsTabId = null;
let submissionsWindowId = null;
const loadingTabs = [];
const openTabs = [];


function submissionsReceived(newSubmissions) {
  // Add the new submissions to the list of submissions to open.
  submissionsToOpen = submissionsToOpen.concat(newSubmissions);

  // Start opening submissions in tabs, up to the maximum number of tabs to open.
  getOptionValue(
    OPTIONS.LOAD_COUNT,
    maxLoadingCount => {
      const currentCount = loadingTabs.length + openTabs.length;
      for (let i = currentCount; (i < maxLoadingCount) && (submissionsToOpen.length > 0); i++) {
        openSubmission(submissionsToOpen.shift());
      }
    });
}

function openNextSubmission() {
  // Do nothing if this was the last submission in the queue.
  if (submissionsToOpen.length === 0) {
    return;
  }

  // If more submissions can be opened, begin loading them.
  getOptionValues(
    [OPTIONS.LOAD_COUNT, OPTIONS.TAB_COUNT],
    optionValues => {
      // Start loading another submission if:
      // - the number of loading tabs is below the configured maximum, and
      // - the total number of tabs (loading and loaded) is below the configured maximum.
      const totalTabCount = loadingTabs.length + openTabs.length;
      if ((loadingTabs.length < optionValues[OPTIONS.LOAD_COUNT.key]) &&
        (totalTabCount < optionValues[OPTIONS.TAB_COUNT.key])) {
        openSubmission(submissionsToOpen.shift());
      }
    });
}

function openSubmission(submission) {
  // Create a new tab to display the submission page.
  const tabInfo = {
    windowId: submissionsWindowId,
    url: submission,
    active: false,
  };
  chrome.tabs.create(
    tabInfo,
    (newTab) => {
      // Add the tab's info to the list of loading tabs.
      loadingTabs.push({ id: newTab.id, submissionURL: submission });
    });
}

function removeTabData(tabData, tabSet) {
  tabSet.splice(tabSet.indexOf(tabData), 1);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "openSubmissions": {
      // Request from content script to open a collection of submissions.
      // Note the window id in which to open the submissions.
      // FIXME: we should group tabs by window, rather than assuming all tabs open in the same window
      submissionsWindowId = sender.tab.windowId;
      submissionsTabId = sender.tab.id;

      // Open the submissions in tabs.
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

chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
  // We're only interested in pages that have completely loaded.
  if (change.status !== "complete") {
    return;
  }

  // Check if the tab is one of the tabs we opened.
  const tabData = loadingTabs.find(loadingTabData => loadingTabData.id === tabId);
  if (!tabData) {
    return;
  }

  // Transfer to the list of open tabs.
  removeTabData(tabData, loadingTabs);
  openTabs.push(tabData);

  // If requested, open the next submission automatically.
  getOptionValue(
    OPTIONS.AUTO_OPEN,
    enabled => {
      if (enabled) {
        openNextSubmission();
      }
    });
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  // Check if this was the submissions tab or the window is closing.
  if ((tabId === submissionsTabId) || removeInfo.isWindowClosing) {
    // Drop our reference to the tab, and clear the queue of tabs to open.
    submissionsWindowId = null;
    submissionsTabId = null;
    submissionsToOpen = [];
    return;
  }

  // Check if the closed tab is one of the submission pages we've opened.
  let tabData = openTabs.find(openTabData => openTabData.id === tabId);
  if (tabData) {
    // Remove the tab from the list of open tabs.
    removeTabData(tabData, openTabs);
  }

  // Check if the closed tab was a tab that was still loading.
  tabData = loadingTabs.find(loadingTabData => loadingTabData.id === tabId);
  if (tabData) {
    // Remove the tab from the list of loading tabs.
    removeTabData(tabData, loadingTabs);
  }

  // Attempt to open the next tab.
  openNextSubmission();
});
