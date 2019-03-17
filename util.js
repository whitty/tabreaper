// Palaver to allow testing via node.js and import into browser
(function(exports) {

  // this only works for dumb straight text matches, not regex
  exports.highlightSimpleMatch = function(text, match) {
    return text.split(match).join('<span class="highlight">' + match + '</span>');
  }

  // more palaver
})(typeof exports === 'undefined'? this['util']={}: exports);
