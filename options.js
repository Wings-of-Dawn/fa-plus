var OPTION_TYPE = {
    BOOLEAN:    0,
    INTEGER:    1,
    FLOAT:      2,
    STRING:     3
};
var OPTIONS = {
    TAB_COUNT: {
        key:            "tab-count",
        type:           OPTION_TYPE.INTEGER,
        defaultValue:   5
    },
    AUTO_CENTER: {
        key:            "auto-center",
        type:           OPTION_TYPE.BOOLEAN,
        defaultValue:   true
    }
};

// For convenient enumeration:
var ALL_OPTIONS = [
    OPTIONS.TAB_COUNT,
    OPTIONS.AUTO_CENTER,
];

function getOptionValue(option)
{
    // Load the option value from localStorage
    var value = localStorage[option.key];

    // If the value doesn't exist, set to default
    if (!value)
    {
        value = option.defaultValue;
        localStorage[option.key] = option.defaultValue;
    }

    // Convert to the appropriate type, if necessary
    switch (option.type)
    {
        case OPTION_TYPE.BOOLEAN:
        {
            // Check if the value is boolean "false", or a string representation thereof
            if (!value || (value === "false"))
                value = false;
            else
                value = true;
            break;
        }
        case OPTION_TYPE.INTEGER:
        {
            value = parseInt(value);
            break;
        }
        case OPTION_TYPE.FLOAT:
        {
            value = parseFloat(value);
            break;
        }
        default:
            break;
    }

    // Return the value
    return value;
}

function setOptionValue(option, value)
{
    localStorage[option.key] = value;
}

function getOptionElementProperty(option)
{
    switch (option.type)
    {
        case OPTION_TYPE.BOOLEAN:
            return "checked";
    }
    return "value";
}
