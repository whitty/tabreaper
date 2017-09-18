var matching = document.querySelector('#matching-url');
var not_pinned = document.querySelector('#not-pinned');
var case_sensitive = document.querySelector('#case-sensitive');
var button = document.querySelector('button');

// set to true to skip closing - just print what we'd do
var debug_mode = false;

// set default and update value
button.disabled = !matching.value;
matching.addEventListener("input", (e) => {
  button.disabled = !matching.value;
});

// switch tabs on select
var tabs = document.querySelectorAll('.panel-section-tabs-button');
tabs.forEach((this_tab) => { this_tab.addEventListener("click", (e) => {
  tabs.forEach((tab) => {
    tab.classList.remove("selected");
    tab.classList.remove("select"); // temporary workaround
    document.querySelector("#" + tab.getAttribute("target")).style.display="none";
  });
  this_tab.classList.add("selected");
  this_tab.classList.add("select"); // temporary workaround
  document.querySelector("#" + this_tab.getAttribute("target")).style.display="inline";
})});

button.addEventListener("click", (e) => {
  let match = matching.value;
  if (match) {
    let n_pinned = not_pinned.checked;
    let by_title = document.querySelector('#title-form-tab').classList.contains("selected");
    let sensitive = by_title ? case_sensitive.checked : true;

    if (!sensitive)
      match = match.toLowerCase();

    // get current window with tabs
    browser.windows.getCurrent({populate: true}).then((window) => {

      for (var i = 0; i < window.tabs.length; i++) {
        let t = window.tabs[i];
        let val = by_title ? t.title : t.url; // TODO - title should be case insensitive

        if (!sensitive)
          val = val.toLowerCase();

        if (val.includes(match)) {
          if (!n_pinned || !t.pinned) {
            if (debug_mode)
              console.log("closed tab: " + t.url);
            else
              browser.tabs.remove(t.id);
          }
        }
      }
    });
  }
});
