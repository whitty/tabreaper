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

  // more palaver
})(typeof exports === 'undefined'? this['util']={}: exports);
