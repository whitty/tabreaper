var matching = document.querySelector('#matching-url');
var not_pinned = document.querySelector('#not-pinned');
var button = document.querySelector('button');

// set to true to skip closing - just print what we'd doo
var debug_mode = true;

// set default and update value
button.disabled = !matching.value;
matching.addEventListener("input", (e) => {
  button.disabled = !matching.value;
});

button.addEventListener("click", (e) => {
  let match = matching.value;
  if (match) {
    let n_pinned = not_pinned.checked;
    let by_title = document.querySelector('#match-title').checked;

    // get current window with tabs
    browser.windows.getCurrent({populate: true}).then((window) => {

      for (var i = 0; i < window.tabs.length; i++) {
        let t = window.tabs[i];
        let val = by_title ? t.title : t.url; // TODO - title should be case insensitive

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
