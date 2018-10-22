'use strict';
var expect = require('chai').expect;
var lorenz = require('../dist/lorenz.js');
var utils = require('../dist/utils.js');

describe('lorenz function', () => {
    it('is correct with known cases', () => {
        const y = [10.0, 1.0, 1.0];
        const dy = [0,0,0];
        lorenz.rhs(0, y, dy);
        // This seems hard to get right:
        var ref = [-90.0, 269.0, 22 / 3];
        expect(utils.approx_equal_array(dy, ref)).to.eql(true);
    });
});
