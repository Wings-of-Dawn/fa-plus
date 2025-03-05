import {
  ALL_OPTIONS,
  OPTIONS,
  getOptionElementProperty,
  getOptionValues,
  setOptionValues,
} from "./options.js";

const MIN_TAB_COUNT = 1;
const MAX_TAB_COUNT = 72;

document.addEventListener("DOMContentLoaded", () => init());

function init() {
  // Restore settings values from storage.
  restoreOptions();

  // Add a tooltip for keyboard shortcuts.
  document.getElementById("shortcuts-tooltip").addEventListener("click", () => {
    const tooltipContent = document.getElementById("shortcuts-tooltip-content");
    tooltipContent.hidden = !tooltipContent.hidden;
  });

  // Add an event listener to the save button.
  document.getElementById("savebutton").addEventListener("click", () => saveOptions());
}

// Populates an element on the options page with a value loaded from storage.
function restoreOption(option, optionValue) {
  // Find the corresponding element.
  const element = document.getElementById(option.key);
  if (!element) {
    console.warn("no corresponding element for option with key \"" + option.key + "\"");
    return;
  }

  // Populate the element.
  element[getOptionElementProperty(option)] = optionValue;
}

function restoreOptions() {
  // Enumerate options, populating the form.
  getOptionValues(ALL_OPTIONS, (optionValues) => {
    ALL_OPTIONS.forEach((option) => restoreOption(option, optionValues[option.key]));
  });
}

// Retrieves the current value of the specified option from the state of the page.
function getUpdatedOptionValue(option) {
  // Find the corresponding element.
  const element = document.getElementById(option.key);
  if (!element) {
    console.warn("no corresponding element for option with key \"" + option.key + "\"");
    return;
  }
  return element[getOptionElementProperty(option)];
}

function validTabCount(value) {
  return (!isNaN(value) && (value >= MIN_TAB_COUNT) && (value <= MAX_TAB_COUNT));
}

function saveOptions() {
  // Remove old error messages, if any.
  const loadCountError = document.getElementById("load-count-error");
  const tabCountError = document.getElementById("tab-count-error");
  loadCountError.innerHTML = "";
  tabCountError.innerHTML = "";

  // Check that the tab-count fields contain acceptable values.
  const errorMessage = "Please enter a value in the range " + MIN_TAB_COUNT + "-" + MAX_TAB_COUNT;
  if (!validTabCount(document.getElementById(OPTIONS.LOAD_COUNT.key).value)) {
    loadCountError.innerHTML = errorMessage;
    return;
  }
  if (!validTabCount(document.getElementById(OPTIONS.TAB_COUNT.key).value)) {
    tabCountError.innerHTML = errorMessage;
    return;
  }

  // Save all option values.
  const optionValues = {};
  ALL_OPTIONS.forEach((option) => optionValues[option.key] = getUpdatedOptionValue(option));
  setOptionValues(optionValues, () => {
    // Update status to let user know options were saved.
    const statusElement = document.getElementById("status");
    statusElement.innerHTML = "Options saved.";
    setTimeout(() => { statusElement.innerHTML = ""; }, 3000);
  });
}
