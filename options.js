var OPTION_KEYS = ["general", "mature", "adult", "auto-remove"];

window.addEventListener("load", init, false);

function init()
{
	// Restore settings values from localStorage
	restoreOptions();

	// Add an event listener to the save button
	document.getElementById("savebutton").addEventListener("click", saveOptions, false);
}


// Populates checkboxes with values loaded from localStorage
function restoreOption(key)
{
	var value = localStorage[key];
	if (!value)
		return;
	document.getElementById(key).checked = (value === "true");
}

function restoreOptions()
{
	// Enumerate option keys, populating the form
	OPTION_KEYS.forEach(restoreOption);
}

// Saves options to localStorage.
function saveOption(key)
{
	var value = document.getElementById(key).checked;
	localStorage[key] = value;
}

function saveOptions()
{
	// Enumerate option keys, saving each to local storage
	OPTION_KEYS.forEach(saveOption);
	
	// Update status to let user know options were saved.
	var status = document.getElementById("status");
	status.innerHTML = "<p>Options saved.</p>";
	setTimeout(function() {
    		status.innerHTML = "";
  	}, 2000);
}

