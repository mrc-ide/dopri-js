'use strict';
var expect = require('chai').expect;
var index = require('../dist/index.js');


describe('basic test', () => {
    it('should return Boys', () => {
        var result = index.hello();
        expect(result).to.equal('Hello world!');
    });
});
