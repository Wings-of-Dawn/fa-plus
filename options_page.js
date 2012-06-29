window.addEventListener("load", init, false);

function init()
{
    // Restore settings values from localStorage
    restoreOptions();

    // Add an event listener to the save button
    document.getElementById("savebutton").addEventListener("click", saveOptions, false);
}

// Populates options page with values loaded from localStorage
function restoreOption(option)
{
    // Find the corresponding element
    var element = document.getElementById(option.key);
    if (!element)
    {
        console.warn("no corresponding element for option with key \"" + option.key + "\"");
        return;
    }

    // Populate the element
    element[getOptionElementProperty(option)] = getOptionValue(option);
}

function restoreOptions()
{
    // Enumerate options, populating the form
    ALL_OPTIONS.forEach(restoreOption);
}

// Saves options to localStorage
function saveOption(option)
{
    // Find the corresponding element
    var element = document.getElementById(option.key);
    if (!element)
    {
        console.warn("no corresponding element for option with key \"" + option.key + "\"");
        return;
    }

    // Set the option to the value of the element's value
    setOptionValue(option, element[getOptionElementProperty(option)]);
}

function validTabCount(value)
{
    return (!isNaN(value) && (value >= 1) && (value <= 60));
}

function saveOptions()
{
    // Remove old error messages, if any
    var loadCountError = document.getElementById("load-count-error");
    var tabCountError = document.getElementById("tab-count-error");
    loadCountError.innerHTML = "";
    tabCountError.innerHTML = "";

    // Check that the tab-count fields contain integers between 1 and 60
    if (!validTabCount(document.getElementById(OPTIONS.LOAD_COUNT.key).value))
    {
        // Display an error message
        loadCountError.innerHTML = "Please enter a value in the range 1-60";
        return;
    }
    if (!validTabCount(document.getElementById(OPTIONS.TAB_COUNT.key).value))
    {
        // Display an error message
        tabCountError.innerHTML = "Please enter a value in the range 1-60";
        return;
    }

    // Enumerate options, saving each to local storage
    ALL_OPTIONS.forEach(saveOption);

    // Update status to let user know options were saved.
    var status = document.getElementById("status");
    status.innerHTML = "Options saved.";
    setTimeout(function() {
            status.innerHTML = "";
    }, 2000);
}

