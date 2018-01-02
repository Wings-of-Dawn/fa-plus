const OPTION_TYPE = {
  BOOLEAN: 0,
  INTEGER: 1,
  FLOAT: 2,
  STRING: 3
};
const OPTIONS = {
  TAB_COUNT: {
    key: "tab-count",
    type: OPTION_TYPE.INTEGER,
    defaultValue: 10
  },
  AUTO_OPEN: {
    key: "auto-open",
    type: OPTION_TYPE.BOOLEAN,
    defaultValue: false
  },
  LOAD_COUNT: {
    key: "load-count",
    type: OPTION_TYPE.INTEGER,
    defaultValue: 3
  },
  AUTO_CENTER: {
    key: "auto-center",
    type: OPTION_TYPE.BOOLEAN,
    defaultValue: true
  },
  KEYBOARD_SHORTCUTS: {
    key: "shortcuts",
    type: OPTION_TYPE.BOOLEAN,
    defaultValue: false
  }
};

// For convenient enumeration:
const ALL_OPTIONS = [
  OPTIONS.TAB_COUNT,
  OPTIONS.AUTO_OPEN,
  OPTIONS.LOAD_COUNT,
  OPTIONS.AUTO_CENTER,
  OPTIONS.KEYBOARD_SHORTCUTS,
];

function getOptionValue(option, callback) {
  getOptionValues([option], (optionValues) => callback(optionValues[option.key]));
}

function getOptionValues(options, callback) {
  // Load the option values from Chrome storage, providing defaults if no value has been set.
  const optionsAndDefaults = {};
  options.forEach((option) => optionsAndDefaults[option.key] = option.defaultValue);
  chrome.storage.local.get(
      optionsAndDefaults,
      (optionValues) => {
        const convertedOptionValues = {};
        options.forEach((option) => {
          const convertedValue = castOptionValue(option, optionValues[option.key]);
          convertedOptionValues[option.key] = convertedValue;
        });
        callback(convertedOptionValues);
      });
}

function setOptionValues(optionData, callback) {
  chrome.storage.local.set(optionData, callback);
}

function getOptionElementProperty(option) {
  switch (option.type) {
    case OPTION_TYPE.BOOLEAN: {
      return "checked";
    }
  }
  return "value";
}

function castOptionValue(option, optionValue) {
  switch (option.type) {
    case OPTION_TYPE.INTEGER: {
      return parseInt(optionValue);
    }
    case OPTION_TYPE.FLOAT: {
      return parseFloat(optionValue);
    }
    default: {
      return optionValue;
    }
  }
}
