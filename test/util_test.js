const assert = require('assert');
var util = require('../util.js');

assert.equal('<span class="highlight">a</span>bcd', util.highlightSimpleMatch('abcd', 'a'));
assert.equal('<span class="highlight">a</span>bcd<span class="highlight">a</span>bcd',
             util.highlightSimpleMatch('abcdabcd', 'a'));
assert.equal('The r<span class="highlight">ain</span> in Sp<span class="highlight">ain</span> falls m<span class="highlight">ain</span>ly on the pl<span class="highlight">ain</span>.',
             util.highlightSimpleMatch('The rain in Spain falls mainly on the plain.', 'ain'));

// case sensitivity
assert.equal('<span class="highlight">a</span>bcdA', util.highlightSimpleMatch('abcdA', 'a', true));
assert.equal('<span class="highlight">a</span>bcd<span class="highlight">A</span>', util.highlightSimpleMatch('abcdA', 'a', false));
