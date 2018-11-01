'use strict';
var expect = require('chai').expect;
var examples = require('../dist/examples.js');
var utils = require('../dist/utils.js');

describe('lorenz function', () => {
    it('is correct with known cases', () => {
        const y = [10.0, 1.0, 1.0];
        const dy = [0,0,0];
        var lorenz = examples.lorenzRhs();
        lorenz(0, y, dy);
        // This seems hard to get right:
        var ref = [-90.0, 269.0, 22 / 3];
        expect(utils.approxEqualArray(dy, ref)).to.eql(true);
    });
});
