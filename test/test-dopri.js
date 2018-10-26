'use strict';
var expect = require('chai').expect;
var dopri = require('../dist/dopri.js');
var examples = require('../dist/examples.js');
var utils = require("../dist/utils.js");

describe('integrate exponential', () => {
    it ('works for 1d problems', () => {
        var y0 = [1];
        var r = [-0.5];
        var t = utils.seq_len(0, 25, 101);
        var sol = dopri.integrate(examples.exponential_rhs(r), y0, 0, 25);
        var y1 = sol(t);
        var y2 = examples.exponential_solution(r, y0, t);
        expect(utils.approx_equal_array(y1, y2, 1e-6)).to.eql(true);
    });

    it ('works for multidimensional problems', () => {
        var r = [-0.5, 0, 0.5];
        var y0 = [1, 1, 1];
        var sol = dopri.integrate(examples.exponential_rhs(r), y0, 0, 25);

        var t = utils.seq_len(0, 25, 101);
        var y1 = sol(t);
        var y2 = examples.exponential_solution(r, y0, t);

        expect(utils.approx_equal_array(
            y1.map(el => el[0]), y2.map(el => el[0]), 1e-6)).to.eql(true);
        expect(utils.approx_equal_array(
            y1.map(el => el[1]), y2.map(el => el[1]), 1e-16)).to.eql(true);
        expect(utils.approx_equal_array(
            y1.map(el => el[2]), y2.map(el => el[2]), 3e-6)).to.eql(true);
    });
});
