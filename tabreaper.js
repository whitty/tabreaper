// query box
var matching = document.querySelector('#matching-url');
// matching checkboxes
var not_pinned = document.querySelector('#not-pinned');
var pinned_policy_warning = document.querySelector('#pinned-policy-warning');
var pinned_policy = "preserve";
var case_sensitive = document.querySelector('#case-sensitive');
var use_regex = document.querySelector('#use-regex');
var all_windows = document.querySelector('#all-windows');
var not_current = document.querySelector('#not-current');

var suggestions_panel = document.querySelector('#suggestions-panel');
suggestions_panel.style.display = "none";

// Output elements
var close_button = document.querySelector('#close-button');
var gather_button = document.querySelector('#gather-to-end-button');
var match_count = document.querySelector('#match-count');
var summary = document.querySelector('#summary');
var table = document.querySelector('#summary-table');
var no_duplicates = document.querySelector('#no-duplicates');
var unicode_warning = document.querySelector('#unicode-warning');

var empty_icon = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"/>');

// set to true to skip closing - just print what we'd do
var debug_mode = false;
var max_summary_lines = 10;

// substitute I18N
util.applyI18N(document)

// UI tabs handling

// switch tabs on select
var tabs = document.querySelectorAll('.panel-section-tabs-button');
tabs.forEach((this_tab) => { this_tab.addEventListener("click", (e) => {
  tabs.forEach((tab) => {
    tab.classList.remove("selected");
    tab.classList.remove("select"); // temporary workaround

    // restore any "hide"s, hide any "shows"
    if (tab.getAttribute("hide")) {
      tab.getAttribute("hide").split(" ").forEach(function(id) {
        document.querySelector("#" + id).style.display = null;
      });
    }
    if (tab.getAttribute("show")) {
      tab.getAttribute("show").split(" ").forEach(function(id) {
        document.querySelector("#" + id).style.display = "none";
      });
    }
  });
  // persist this tab selection
  browser.storage.local.set({'current-tab': this_tab.id})

  // update the UI
  this_tab.classList.add("selected");
  this_tab.classList.add("select"); // temporary workaround

  // hide any elements marked as "hide"s, show any "show"s
  if (this_tab.getAttribute("hide")) {
    this_tab.getAttribute("hide").split(" ").forEach(function(id) {
      document.querySelector("#" + id).style.display="none";
    });
  }
  if (this_tab.getAttribute("show")) {
    this_tab.getAttribute("show").split(" ").forEach(function(id) {
      document.querySelector("#" + id).style.display=null;
    });
  }
  update_summary_immediate(); // ensure state-based summary stuff is immediately hidden
  update_summary();
})});

// Load persisted tab
browser.storage.local.get({'current-tab': tabs[0].id}).then((result) => {
  for (let this_tab of tabs) {
    if (this_tab.id == result['current-tab']) {
      this_tab.click();
      break;
    }
  }
});

// tab matching and closing functions

function withCurrentTab() {
  return browser.tabs.query({currentWindow: true, active: true}).then((currentTabs) => {
    if (!currentTabs.length) {
      return null;
    }
    return currentTabs[0];
  });
}

function fetchTabs(args) {
  let query = {};
  if (!args.all_windows)
    query['currentWindow'] = true;
  return Promise.all([withCurrentTab(), browser.tabs.query(query)])
}

function match_duplicates(args) {

  // get current window with tabs
  return fetchTabs(args).then(([currentTab, tabs]) => {

    let seen = {};
    let matched = [];

    for (let t of tabs) {
      // cookieStoreId == tab containers (aka contextualIdentities)
      let key = [ util.referenceUrl(t.url, document), t.cookieStoreId ];
      if (key in seen) {
        if (t.pinned) {
          args.pinned_match_count += 1;
        }

        let isCurrent = currentTab && (t.active && t.id == currentTab.id);
        if (args.n_current && isCurrent) {
          // swap current tab with last seen tab and kill
          // last seen if we are preserving current
          let prev = seen[key];
          seen[key] = t;
          matched.push(prev);
        } else if (args.n_pinned && t.pinned) {
          // this is pinned, check the stashed one
          // if this isn't then discard it instead
          if (!seen[key].pinned) {
            let prev = seen[key];
            seen[key] = t;
            matched.push(prev);
          }
        } else {
          matched.push(t);
        }
      } else {
        seen[key] = t;
      }
    }
    return matched;
  });
}

function punyEquivalent(url) {
  let u = new URL(url)
  return u.protocol + "//" + punycode.toUnicode(u.host) + u.pathname + u.search + u.hash
}

function match_tabs(args) {

  if (args.by_duplicate) {
    return match_duplicates(args)
  }
  let match = args.match;
  if (!args.sensitive)
    match = match.toLowerCase();

  // Promise.all resolves multiple promises before caling back:
  // [0] get current tab for avoiding close of current tab query
  // [1] and fetch tabs to search for matches
  return fetchTabs(args).then(([currentTab, tabs]) => {

    let matched = [];

    for (let t of tabs) {
      let val = args.by_title ? t.title : decodeURI(t.url);

      if (!args.sensitive)
        val = val.toLowerCase();

      function do_match(val, match) {
        return args.regex ? val.match(match) : val.includes(match)
      }

      // normal match
      let foundMatch = do_match(val, match);

      // try convert a punycode domain to match
      if (!foundMatch && !args.by_title) {
        foundMatch = do_match(punyEquivalent(val), match);
        if (foundMatch) {
          unicode_warning.style.display = "inline";
        }
      }

      if (foundMatch) {
        if (t.pinned)
          args.pinned_match_count += 1;
        if (!args.n_pinned || !t.pinned) {
          let isCurrent = currentTab && (t.active && t.id == currentTab.id);
          if (! args.n_current || !isCurrent) {
            matched.push(t);
          }
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

  let n_pinned;
  if (pinned_policy == "preserve")
    n_pinned = true;
  else if (pinned_policy == "close_them")
    n_pinned = false;
  else
    n_pinned = not_pinned.checked;

  return {
    match: matching.value,
    n_pinned: n_pinned,
    n_current: not_current.checked,
    all_windows: all_windows.checked,
    by_title: by_title,
    by_duplicate: by_duplicate,
    sensitive: by_title ? (case_sensitive.checked || use_regex.checked) : true,
    regex: use_regex.checked,
    pinned_match_count: 0,
  };
}

// the main closer
function close_matched() {
  let args = get_args();
  if (args.match || args.by_duplicate) {
    match_tabs(args).then((matched) => {
      let ids = matched.map((t) => {
        if (debug_mode) {
          console.log("closed tab: " + t.url);
        }
        return t.id;
      });
      if (!debug_mode) {
        browser.tabs.remove(ids).then(function(t) {
          update_summary();
        });
      }
      matching.value = "";
      matching.focus();
      update_summary();
    });
  }
}

function move_tabs(ids, window_id = null) {
  if (ids.length > 0) {
    if (!debug_mode) {
      let window_args = {index: -1}
      if (window_id)
        window_args.windowId = window_id
      let result = browser.tabs.move(ids, window_args)
      result.then((t) => {
        update_summary();
      });
    }
  }
}

function gather_matched(new_window = false) {
  let args = get_args();
  if (args.match || args.by_duplicate) {
    args.n_pinned = true // don't gather pinned tabs
    args.n_current = false // move current tab if it matches
    match_tabs(args).then((matched) => {
      let ids = matched.map((t) => {
        if (debug_mode) {
          console.log("gathered tab: " + t.url);
        }
        return t.id;
      });
      if (new_window) {
        let first = ids[0]
        ids = ids.slice(1)
        browser.windows.create({tabId: first}).then((w) => {
          move_tabs(ids, w.id)
        })
      } else {
        if (args.all_windows) {
          browser.windows.getCurrent().then((w) => {
            move_tabs(ids, w.id)
          })
        } else {
          move_tabs(ids)
        }
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

function focusTab(tab) {
  browser.windows.get(tab.windowId, {populate: false}).then((window) => {
    if (!window.focused) {
      browser.windows.update(tab.windowId, {'focused': true}).then((window) => {
        browser.tabs.update(tab.id, {active: true})
      })
    } else {
      browser.tabs.update(tab.id, {active: true})
    }
  })
}

function summaryRow(tab, args) {
  let tr = document.createElement("div");
  tr.setAttribute('class', 'summary-row');

  let ico_parent = document.createElement('div');
  ico_parent.setAttribute('class', 'summary-close-icon-switcher summary-cell')

  let ico = document.createElement("img");
  let favIconUrl = tab.favIconUrl ? tab.favIconUrl : empty_icon;
  // avoid security warning accessing this tab favicon
  if (favIconUrl == 'chrome://mozapps/skin/extensions/extension.svg')
    favIconUrl = empty_icon;
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
  close_ico.setAttribute('title', browser.i18n.getMessage('closeButtonTooltip'))
  ico_parent.appendChild(close_ico);

  let entry = document.createElement('span');
  if (args.by_title) {
    applyHighlights(args.regex
                    ? util.splitReMatchForHighlight(tab.title, args.match)
                    : util.splitSimpleMatchForHighlight(tab.title, args.match, args.sensitive), entry);
  } else {
    entry.appendChild(document.createTextNode(tab.title));
  }
  entry.setAttribute('title', tab.url)
  entry.ondblclick = () => { focusTab(tab) }
  entry.setAttribute('class', 'summary-cell')
  tr.appendChild(entry)
  return tr;
}

function notFoundRow() {
  let tr = document.createElement("div");
  tr.setAttribute('class', 'summary-row summary-row-not-found');
  tr.appendChild(document.createTextNode(browser.i18n.getMessage('notFoundAlert')));
  return tr;
}

function update_summary_immediate() {
  case_sensitive.disabled = use_regex.checked;

  let args = get_args();
  if (args.match || args.by_duplicate) {
    summary.style.display = "inline";
    no_duplicates.style.display = "none";
    setSuggestions([])

    match_tabs(args).then((matched) => {
      close_button.disabled = matched.length == 0;

      let gather_key = args.all_windows ?  "gather-to-this-window-button" : "gather-to-end-button"
      gather_button.innerText = browser.i18n.getMessage(gather_key);
      gather_button.disabled = matched.length == 0;

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
          no_duplicates.style.display = null;
        } else {
          no_duplicates.style.display = "none";
        }
      }

      if (args.pinned_match_count == 0 || (pinned_policy == "ask" && not_pinned.checked)) {
        pinned_policy_warning.style.display = 'none';
      } else {
        pinned_policy_warning.classList.remove("highlight");
        if (pinned_policy == "preserve") {
          pinned_policy_warning.innerText = browser.i18n.getMessage("pinnedTabsNote");
        } else if (pinned_policy == "close_them" || (pinned_policy == "ask" && !not_pinned.checked)) {
          pinned_policy_warning.innerText = browser.i18n.getMessage("pinnedTabsWarning");
          pinned_policy_warning.classList.add("highlight");
        }
        pinned_policy_warning.style.display = "inline";
      }

    });
  } else {
    summary.style.display = "none";
    close_button.disabled = true;
    gather_button.disabled = true;
    no_duplicates.style.display = "none";

    if (args.by_duplicate) {
      setSuggestions(null);
    } else {
      setURLSuggestions(args.by_title);
    }
  }
}

// debounce update_summary so we can call it aggresively without
// chugging
let update_summary_timer = null;
function update_summary() {
  clearTimeout(update_summary_timer);
  update_summary_timer = setTimeout(() => {
    update_summary_immediate()
  }, 100);
}

// initialise state
update_summary_immediate();
// update summary on all input updates
[matching, case_sensitive, use_regex, not_pinned, not_current, all_windows].forEach((inp) => {
  // load checkboxes from storage
  if (inp.type == 'checkbox') {
    browser.storage.local.get({[inp.id]: inp.checked}).then((result) => {
      let update = inp.checked != result[inp.id];
      inp.checked = result[inp.id];
      if (update)
        update_summary();
    });
  }
  inp.addEventListener("input", (e) => {
    // save updates to checkboxes to storage
    if (e.target.type == 'checkbox') {
      browser.storage.local.set({[e.target.id]: e.target.checked})
    }
    update_summary();
  })
});

close_button.addEventListener("click", (e) => {
  close_matched();
});

gather_button.addEventListener("click", (e) => {
  gather_matched();
});


function setSuggestions(hints) {
  if (hints != null && hints.length) {
    let suggestions = document.querySelector('#autofill-suggestions');
    suggestions.innerHTML = '';
    let count = 0;

    hints.forEach(s => {
      let span = document.createElement('span');
      span.classList.add('avoidwrap')
      let section = document.createElement('a');
      section.setAttribute('href', '#');
      section.addEventListener("click", function() {
        matching.value = s;
        matching.dispatchEvent(new Event('input'));
      });
      section.textContent = s;
      span.appendChild(section);
      if (count + 1 < hints.length) {
        span.appendChild(document.createTextNode(', '));
      }
      suggestions.appendChild(span);
      ++count;
    })
    suggestions_panel.style.display = null;
  } else {
    suggestions_panel.style.display = "none";
  }
}

function setURLSuggestions(title) {
  withCurrentTab().then((tab) => {
    if (tab != null) {
      if (title) {
        // split suggestions into chunks based on separator like chars
        let parts = tab.title.split(/\s*[-|:,;+\u00B7\t\n\r&()\[\]]\s*/);
        setSuggestions(parts.filter(x => {
          return x && x.length > 0;
        }))
        return;
      } else {
        let domain = util.domainForUrl(tab.url, document)
        if (domain) {
          let suggestions = [domain];
          let decodedDomain = punycode.toUnicode(domain)
          if (decodedDomain != domain) {
            suggestions.push(decodedDomain)
            unicode_warning.style.display = "inline";
          }
          setSuggestions(suggestions)
          return;
        }
      }
    }
    setSuggestions([]);
  })
}

matching.addEventListener("keyup", (e) => {
  if (e.key == "Enter" && matching.value)
    close_button.click();
});

browser.tabs.onUpdated.addListener(update_summary);

let values = {'pinned-tab-handling-selection': pinned_policy};
browser.storage.local.get(values).then((result) => {
  pinned_policy = result['pinned-tab-handling-selection'];
  document.querySelector("#pinned-panel").style.display = pinned_policy == "ask" ? null : "none";
  update_summary();
});
