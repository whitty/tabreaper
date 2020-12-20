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
