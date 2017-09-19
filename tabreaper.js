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

function match_tabs(args) {

  let match = args.match;
  if (!args.sensitive)
    match = match.toLowerCase();

  // get current window with tabs
  return browser.windows.getCurrent({populate: true}).then((window) => {

    let matched = [];
 
    for (var i = 0; i < window.tabs.length; i++) {
      let t = window.tabs[i];
      let val = args.by_title ? t.title : t.url; // TODO - title should be case insensitive

      if (!args.sensitive)
        val = val.toLowerCase();

      if (val.includes(match)) {
        if (!args.n_pinned || !t.pinned) {
          matched.push(t);
        }
      }
    }
    return matched;
  });
}

// get args from form
function get_args() {
  let by_title = document.querySelector('#title-form-tab').classList.contains("selected");
  return {
    match: matching.value,
    n_pinned: not_pinned.checked,
    by_title: by_title,
    sensitive: by_title ? case_sensitive.checked : true
  };
}

// the main closer
function close_matched() {
  let args = get_args();
  if (args.match) {
    match_tabs(args).then((matched) => {
      for (var i = 0; i < matched.length; ++i) {
        let t = matched[i];
        if (debug_mode)
          console.log("closed tab: " + t.url);
        else
          browser.tabs.remove(t.id);
      }
    });
  }
}

button.addEventListener("click", (e) => {
  close_matched();
});
