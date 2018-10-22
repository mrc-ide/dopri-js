'use strict';
var expect = require('chai').expect;
var utils = require('../dist/utils.js');


describe('square function', () => {
    it('is correct with known cases', () => {
        expect(utils.square(2)).to.equal(4);
        expect(utils.square(-9)).to.equal(81);
    });
});


describe('zeros function', () => {
    it('is correct with known cases', () => {
        expect(utils.zeros(0)).to.eql([]);
        expect(utils.zeros(1)).to.eql([0]);
        expect(utils.zeros(2)).to.eql([0, 0]);
    });
});


describe('approximately equal', () => {
    it('is true with identical values', () => {
        expect(utils.approx_equal(1, 1)).to.eql(true);
        expect(utils.approx_equal(Math.sqrt(3), Math.sqrt(3))).to.eql(true);
        expect(utils.approx_equal(Math.pow(Math.PI, 20),
                                  Math.pow(Math.PI, 20))).to.eql(true);
    });

    it('is false with different values', () => {
        expect(utils.approx_equal(1, 10)).to.eql(false);
        expect(utils.approx_equal(10, 1)).to.eql(false);
    });

    it('can be tuned with tolerance', () => {
        expect(utils.approx_equal(Math.PI, 355/113)).to.eql(false);
        expect(utils.approx_equal(Math.PI, 355/113, 1e-7)).to.eql(true);
    });
});


describe('approximately equal arrays', () => {
    it('is equal only when arrays are the same length', () => {
        expect(utils.approx_equal_array([], [])).to.eql(true);
        expect(utils.approx_equal_array([0], [0])).to.eql(true);
        // for catching errors, need to use a lambda
        expect(() => utils.approx_equal_array([0], [])).to.throw();
    });

    it('allows small differences', () => {
        var x = [2, 3, 5, 7, 11, 13];
        var y = x.map(el => utils.square(Math.sqrt(el)));
        expect(utils.approx_equal_array(x, y)).to.eql(true);
    });

    it('notices large differences', () => {
        expect(utils.approx_equal_array([1, 2, 3], [1, 3, 3])).to.eql(false);
    });

    it('can be tuned', () => {
        var x = [Math.PI, Math.PI];
        var y = [355/113, 355/113];
        expect(utils.approx_equal_array(x, y)).to.eql(false);
        expect(utils.approx_equal_array(x, y, 1e-7)).to.eql(true);
    });
});
