'use strict';
var fs = require('fs');
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


describe('integrate logistic', () => {
    it ('agrees with solution', () => {
        var y0 = [1], r = 0.5, K = 100;
        var t = utils.seq_len(0, 25, 101);
        var sol = dopri.integrate(examples.logistic_rhs(r, K), y0, 0, 25);
        var y1 = sol(t);
        var y2 = examples.logistic_solution(r, K, y0, t);
        expect(utils.approx_equal_array(y1.map(x => x[0]), y2, 1e-6)).
            to.eql(true);
    });
});


// The issue here is that jsonlite is not saving *all* the precision,
// in the same way that node is saving.  That makes it impossible to
// compare as exactly as I can going the other way.
//
// actually, things are quite different after 7 steps (the first
// discrepency creeps in for the first two values.  Then things settle
// in ok and we get the departure of accuracy at t between 2.25 and
// 2.5 - after that the differences of 1e-15 or so persist.  The
// rejected steps are at 0.13 and 6.67 so I don't think that's the
// problem either.
describe('integrate lorenz', () => {
    it ('agrees with reference', () => {
        var t = utils.seq_len(0, 25, 101);
        var y0 = [10, 1, 1];

        var sol = dopri.integrate(examples.lorenz_rhs(), y0, 0, utils.last(t));
        var y = sol(t);

        var path_ref_js = "test/ref/lorenz_js.json";
        var path_ref_r = "test/ref/lorenz_r.json";

        if (!fs.existsSync(path_ref_js)) {
            fs.writeFileSync(path_ref_js, JSON.stringify(y));
        }

        var cmp_js = JSON.parse(fs.readFileSync(path_ref_js));
        var cmp_r = JSON.parse(fs.readFileSync(path_ref_r));

        // This one should just straight up agree:
        expect(y).to.deep.equal(cmp_js);

        // This one is more complicated:
        for (var i = 0; i < t.length - 1; ++i) {
            expect(utils.approx_equal_array(y[i], cmp_r[i])).to.eql(true);
        }
        // Last one is due to interpolation error - the R version
        // stops the integrator on the point and the js version allows
        // us to exceed the point at the moment.
        expect(utils.approx_equal_array(y[100], cmp_r[100], 1e-6)).
            to.eql(true);
        expect(utils.approx_equal_array(y[100], cmp_r[100], 1e-8)).
            to.eql(false);
    });
});
