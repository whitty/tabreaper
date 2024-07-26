util.applyI18N(document)

document.addEventListener("DOMContentLoaded", () => {
  browser.storage.local.get({
    'pinned-tab-handling-selection': 'preserve',
  }).then((result) => {
    document.querySelector("#pinned-tab-handling-selection").value = result['pinned-tab-handling-selection']
  });
});

document.querySelector("#pinned-tab-handling-selection").addEventListener("change", (e) => {
  browser.storage.local.set({
    'pinned-tab-handling-selection': e.target.value
  });
});

document.querySelector("#debug-box-enable").addEventListener("change", (e) => {
  browser.storage.local.set({
    'debug-box-enable': e.target.checked
  });
});
