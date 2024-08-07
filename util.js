// Palaver to allow testing via node.js and import into browser
(function(exports) {

  function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }

  function reForMatch(match, caseSensitive) {
    let opts = 'g';
    if (!caseSensitive)
      opts += 'i';
    return new RegExp('('+escapeRegExp(match)+')', opts);
  }

  // this only works for dumb straight text matches, not regex
  exports.splitSimpleMatchForHighlight = function(text, match, caseSensitive = true) {
    let re = reForMatch(match, caseSensitive);
    return text.split(re).map(function(x) {
      return [x, x.match(re) != null];
    });
  }

  // Try to work with regexes
  exports.splitReMatchForHighlight = function(text, match) {
    let re = RegExp(match, 'g');

    let ret = [];

    let m;
    let last = 0;
    let count = 0;
    while ((m = re.exec(text)) !== null) {

      if (m.index > last) {
        ret.push([m.input.slice(last, m.index), false]);
      }

      let matched = m.toString();
      // if we match an empty fragment exec won't move on
      if (matched.length == 0) {
        break;
      }

      ret.push([matched, true]);
      last = m.index + matched.length;

      // Ensure we can't accidentally loop forever loop no more than
      // the length of the input string (optional matching could cause problems)
      if (++count > text.length)
        break;
    }

    if (last < text.length) {
      ret.push([text.slice(last), false]);
    }

    return ret;
  }

  function removeLastSubstring(s, substr) {
    let pos = s.lastIndexOf(substr)
    if (pos >= 0) {
      return s.substring(0, pos) + s.substring(pos + substr.length);
    }
    return s;
  }
  exports.removeLastSubstring = removeLastSubstring;

  // prepare a url for duplicate comparison
  exports.referenceUrl = function(url, document) {
    let a = document.createElement('a');
    a.href = url;
    // remove the anchor portion (a.hash)
    return removeLastSubstring(url, a.hash);
  }

  exports.domainForUrl = function(url, document) {
    let a = document.createElement('a');
    a.href = url;
    return a.hostname;
  }

  exports.applyI18N = function(document) {
    for (elem of document.querySelectorAll("*[i18n-key]")) {
      let key = elem.getAttribute("i18n-key");
      elem.innerText = browser.i18n.getMessage(key);
    }
  }

  // more palaver
})(typeof exports === 'undefined'? this['util']={}: exports);
