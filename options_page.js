const MIN_TAB_COUNT = 1;
const MAX_TAB_COUNT = 72;

window.addEventListener("load", init, false);

function init() {
  // Restore settings values from storage.
  restoreOptions();

  // Add an event listener to the save button.
  document.getElementById("savebutton").addEventListener("click", saveOptions, false);
}

// Populates options page with values loaded from storage.
function restoreOption(option) {
  // Find the corresponding element.
  const element = document.getElementById(option.key);
  if (!element) {
    console.warn("no corresponding element for option with key \"" + option.key + "\"");
    return;
  }

  // Populate the element.
  element[getOptionElementProperty(option)] = getOptionValue(option);
}

function restoreOptions() {
  // Enumerate options, populating the form.
  ALL_OPTIONS.forEach(restoreOption);
}

// Saves options to localStorage
function saveOption(option) {
  // Find the corresponding element.
  const element = document.getElementById(option.key);
  if (!element) {
    console.warn("no corresponding element for option with key \"" + option.key + "\"");
    return;
  }

  // Set the option to the value of the element's value
  setOptionValue(option, element[getOptionElementProperty(option)]);
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

  // Enumerate options, saving each to local storage
  ALL_OPTIONS.forEach(saveOption);

  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = "Options saved.";
  setTimeout(function() {status.innerHTML = "";}, 2000);
}
