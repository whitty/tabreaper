const assert = require('assert');
const util = require('../util.js');
const jsdom = require('jsdom')

assert.deepEqual([['', false], ['a', true], ['bcd', false], ['a', true], ['', false]],
                 util.splitSimpleMatchForHighlight('abcda', 'a'));
assert.deepEqual([['', false], ['a', true], ['bcdA', false]],
                 util.splitSimpleMatchForHighlight('abcdA', 'a'));

assert.deepEqual([['The r', false],
                  ['ain', true],
                  [' in Sp', false],
                  ['ain', true],
                  [' falls m', false],
                  ['ain', true],
                  ['ly on the pl', false],
                  ['ain', true],
                  ['.', false]],
             util.splitSimpleMatchForHighlight('The rain in Spain falls mainly on the plain.', 'ain'));

assert.deepEqual([['The r', false],
                  ['ain', true],
                  [' in Sp', false],
                  ['ain', true],
                  [' falls m', false],
                  ['ain', true],
                  ['ly on the pl', false],
                  ['ain', true],
                  ['.', false]],
             util.splitReMatchForHighlight('The rain in Spain falls mainly on the plain.', 'ain'));

assert.deepEqual([['The r', false],
                  ['ain', true],
                  [' in Sp', false],
                  ['ain', true],
                  [' falls m', false],
                  ['ain', true],
                  ['ly on the pl', false],
                  ['ain', true],
                  ['.', false]],
             util.splitReMatchForHighlight('The rain in Spain falls mainly on the plain.', 'a.n'));

// Special case where match is empty just return
assert.deepEqual([['The rain in Spain falls mainly on the plain.', false]],
                 util.splitReMatchForHighlight('The rain in Spain falls mainly on the plain.', ' *'));

assert.deepEqual([['The', false], [' ', true ],
                  ['rain', false], [' ', true ],
                  ['in', false], [' ', true ],
                  ['Spain', false], [' ', true ],
                  ['falls', false], [' ', true ],
                  ['mainly', false], [' ', true ],
                  ['on', false], [' ', true ],
                  ['the', false], [' ', true ],
                  ['plain.', false]],
                 util.splitReMatchForHighlight('The rain in Spain falls mainly on the plain.', ' +'));

// case sensitivity
assert.deepEqual([['', false], ['a', true], ['bcdA', false]],
                 util.splitSimpleMatchForHighlight('abcdA', 'a', true));
assert.deepEqual([['', false], ['a', true], ['bcd', false ], ['A', true], ['', false]],
                 util.splitSimpleMatchForHighlight('abcdA', 'a', false));

function referenceUrl(url) {
  let dom = new jsdom.JSDOM;
  return util.referenceUrl(url, dom.window.document)
}

assert.deepEqual(referenceUrl("http://www.bom.gov.au/products/IDV60901/IDV60901.94870.shtml#other_formats"),
                 'http://www.bom.gov.au/products/IDV60901/IDV60901.94870.shtml')

assert.deepEqual(referenceUrl("https://www.google.com/search?client=firefox-b-d&q=javascript+string+replace+last+instance#last"),
                 "https://www.google.com/search?client=firefox-b-d&q=javascript+string+replace+last+instance")
