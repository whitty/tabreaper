const assert = require('assert');
const util = require('../util.js');

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
