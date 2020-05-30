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
