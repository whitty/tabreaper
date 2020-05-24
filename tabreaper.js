// query box
var matching = document.querySelector('#matching-url');
// matching checkboxes
var not_pinned = document.querySelector('#not-pinned');
var case_sensitive = document.querySelector('#case-sensitive');

// Output elements
var close_button = document.querySelector('#close-button');
var match_count = document.querySelector('#match-count');
var summary = document.querySelector('#summary');
var table = document.querySelector('#summary-table');
var no_duplicates = document.querySelector('#no-duplicates');

var empty_icon = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"/>');

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

    // restore any hides
    if (tab.getAttribute("hide")) {
      tab.getAttribute("hide").split(" ").forEach(function(id) {
        document.querySelector("#" + id).style.display="";
      });
    }
  });
  this_tab.classList.add("selected");
  this_tab.classList.add("select"); // temporary workaround
  document.querySelector("#" + this_tab.getAttribute("target")).style.display="inline";

  // hide any elements marked as hides
  if (this_tab.getAttribute("hide")) {
    this_tab.getAttribute("hide").split(" ").forEach(function(id) {
      document.querySelector("#" + id).style.display="none";
    });
  }
  update_summary();
})});

function match_duplicates(args) {

  // get current window with tabs
  return browser.windows.getCurrent({populate: true}).then((window) => {

    let seen = {};
    let matched = [];

    for (var i = 0; i < window.tabs.length; i++) {
      let t = window.tabs[i];
      if (t.url in seen) {
        if (args.n_pinned && t.pinned) {
          // this is pinned, check the stashed one
          // if this isn't then discard it instead
          if (!seen[t.url].pinned) {
            let prev = seen[t.url];
            seen[t.url] = t;
            matched.push(prev);
          }
        } else {
          matched.push(t);
        }
      } else {
        seen[t.url] = t;
      }
    }
    return matched;
  });
}

function match_tabs(args) {

  if (args.by_duplicate) {
    return match_duplicates(args)
  }
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
  let by_duplicate = document.querySelector('#duplicates-form-tab').classList.contains("selected");
  return {
    match: matching.value,
    n_pinned: not_pinned.checked,
    by_title: by_title,
    by_duplicate: by_duplicate,
    sensitive: by_title ? case_sensitive.checked : true,
  };
}

// the main closer
function close_matched() {
  let args = get_args();
  if (args.match || args.by_duplicate) {
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

function applyHighlights(highlights, node) {
  highlights.forEach(function(h) {
    if (h[1]) {
      let section = document.createElement('span');
      section.setAttribute('class', 'highlight');
      section.appendChild(document.createTextNode(h[0]));
      node.appendChild(section);
    } else {
      node.appendChild(document.createTextNode(h[0]));
    }
  });
}

function close_one(tab) {
  if (debug_mode)
    console.log("closed tab: " + tab.url);
  else
    browser.tabs.remove(tab.id).then(function() {
      update_summary();
    });
}

function summaryRow(tab, args) {
  let tr = document.createElement("div");
  tr.setAttribute('class', 'summary-row');

  let ico_parent = document.createElement('div');
  ico_parent.setAttribute('class', 'summary-close-icon-switcher summary-cell')

  let ico = document.createElement("img");
  let favIconUrl = tab.favIconUrl ? tab.favIconUrl : empty_icon;
  ico.setAttribute('src', favIconUrl);
  ico.setAttribute('height', '16');
  ico.setAttribute('class', 'summary-icon toolbarbutton-icon');
  ico_parent.appendChild(ico);
  tr.appendChild(ico_parent);

  let close_ico = document.createElement('img');
  close_ico.setAttribute('src', 'chrome://global/skin/icons/close.svg')
  close_ico.setAttribute('class', 'summary-close');
  close_ico.addEventListener("click", (e) => {
    close_one(tab);
  });
  ico_parent.appendChild(close_ico);

  let entry = document.createElement('span');
  if (args.by_title) {
    applyHighlights(util.splitSimpleMatchForHighlight(tab.title, args.match, args.sensitive), entry);
  } else {
    entry.appendChild(document.createTextNode(tab.title));
  }
  entry.setAttribute('class', 'summary-cell')
  tr.appendChild(entry)
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
  if (args.match || args.by_duplicate) {
    summary.style.display = "inline";
    match_tabs(args).then((matched) => {
      close_button.disabled = matched.length == 0;
      match_count.textContent = matched.length;
      while (table.firstChild)
        table.removeChild(table.firstChild);
      matched.forEach((tab) => {
        table.appendChild(summaryRow(tab, args));
      });
      if (matched.length == 0)
        table.appendChild(notFoundRow());
      if (args.by_duplicate) {
        if (matched.length == 0) {
          summary.style.display = "none";
          close_button.disabled = true;
          no_duplicates.style.display = "inline";
        } else {
          no_duplicates.style.display = "none";
        }
      }
    });
  } else {
    summary.style.display = "none";
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
