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

function saveOptions()
{
    // Check that the tab-count field contains an integer between 1 and 60
    var tabCountVal = parseInt(document.getElementById(OPTIONS.TAB_COUNT.key).value);
    var errorElement = document.getElementById("tab-count-error");
    if (isNaN(tabCountVal) || (tabCountVal < 1) || (tabCountVal > 60))
    {
        // Display an error message
        errorElement.innerHTML = "Please enter a value in the range 1-60";
        return;
    }

    // Enumerate options, saving each to local storage
    ALL_OPTIONS.forEach(saveOption);

    // Remove error message, if any
    errorElement.innerHTML = "";

    // Update status to let user know options were saved.
    var status = document.getElementById("status");
    status.innerHTML = "Options saved.";
    setTimeout(function() {
            status.innerHTML = "";
    }, 2000);
}

