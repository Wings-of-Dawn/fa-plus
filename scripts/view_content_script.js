import(chrome.runtime.getURL("scripts/view_content_module.js"))
  .then(content => content.onLoad());
