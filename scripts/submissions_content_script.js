import(chrome.runtime.getURL("scripts/submissions_content_module.js"))
  .then(content => content.onLoad());
