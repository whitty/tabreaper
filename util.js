// Palaver to allow testing via node.js and import into browser
(function(exports) {

  function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }

  // this only works for dumb straight text matches, not regex
  exports.highlightSimpleMatch = function(text, match, caseSensitive = true) {
    let opts = 'g';
    if (!caseSensitive)
      opts += 'i';
    return text.replace(new RegExp('('+escapeRegExp(match)+')', opts), '<span class="highlight">$1</span>');
  }

  // more palaver
})(typeof exports === 'undefined'? this['util']={}: exports);
