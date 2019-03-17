var matching = document.querySelector('#matching-url');
var not_pinned = document.querySelector('#not-pinned');
var case_sensitive = document.querySelector('#case-sensitive');
var close_button = document.querySelector('#close-button');
var match_count = document.querySelector('#match-count');
var summary = document.querySelector('#summary');
var table = document.querySelector('#summary-table');

// set to true to skip closing - just print what we'd do
var debug_mode = false;
var max_summary_lines = 10;

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
  update_summary();
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
      matching.value = "";
      matching.focus();
      update_summary();
    });
  }
}

function summaryRow(tab) {
  let tr = document.createElement("div");
  tr.setAttribute('class', 'summary-row');
  let ico = document.createElement("img");
  ico.setAttribute('src', tab.favIconUrl);
  ico.setAttribute('height', '16');
  ico.setAttribute('class', 'summary-icon toolbarbutton-icon');
  tr.appendChild(ico);
  tr.appendChild(document.createTextNode(tab.title));
  return tr;
}

function elipsisRow() {
  let tr = document.createElement("div");
  tr.setAttribute('class', 'summary-row summary-row-elipsis');
  tr.appendChild(document.createTextNode('...'));
  return tr;
}

function notFoundRow() {
  let tr = document.createElement("div");
  tr.setAttribute('class', 'summary-row summary-row-not-found');
  tr.appendChild(document.createTextNode('Not found'));
  return tr;
}

function update_summary() {
  let args = get_args();
  if (args.match) {
    summary.style.display = "inline";
    match_tabs(args).then((matched) => {
      close_button.disabled = matched.length == 0;
      match_count.textContent = matched.length;
      while (table.firstChild)
        table.removeChild(table.firstChild);
      matched.slice(0, max_summary_lines).forEach((tab) => {
        table.appendChild(summaryRow(tab));
      });
      if (matched.length > max_summary_lines)
        table.appendChild(elipsisRow());
      else if (matched.length == 0)
        table.appendChild(notFoundRow());
    });
  } else {
    summary.style.display  = "none";
    close_button.disabled = true;
  }
}

// initialise state
update_summary();
// update summary on all input updates
[matching, case_sensitive, not_pinned].forEach((inp) => {
  inp.addEventListener("input", (e) => {
    update_summary();
  })
});

close_button.addEventListener("click", (e) => {
  close_matched();
});

matching.addEventListener("keyup", (e) => {
  if (e.key == "Enter" && matching.value)
    close_button.click();
});
