'use strict';
var dopri = require("../lib/index.js");
var expect = require('chai').expect;

describe('High level use', () => {
    var rhs = function(t, y, dydt) {
        dydt[0] = 1;
    };

    it('works with Dopri class', () => {
        var solver = new dopri.Dopri(rhs, 1);
        solver.initialise(0, [1]);
        var sol = solver.run(4);
        var t = [0, 1, 2, 3];
        expect(sol(t).map(el => el[0])).to.deep.eql([1, 2, 3, 4]);
    });
});

describe('Integrate function', () => {
    it('works for dopri, with no output', () => {
        var rhs = function(t, y, dydt) {
            dydt[0] = 1;
        };
        var sol = dopri.integrate(rhs, [1], 0, 3);
        var t = [0, 1, 2, 3];
        var y = sol(t);
        expect(y.map(el => el[0])).to.deep.eql([1, 2, 3, 4]);
    });

    it('works for dopri, with output', () => {
        var rhs = function(t, y, dydt) {
            dydt[0] = 1;
        };
        var out = (t, y) => [y[0] + 1];
        var sol = dopri.integrate(rhs, [1], 0, 3, {}, out);
        var t = [0, 1, 2, 3];
        var y = sol(t);
        expect(y.map(el => el[0])).to.deep.eql([1, 2, 3, 4]);
        expect(y.map(el => el[1])).to.deep.eql([2, 3, 4, 5]);
    });

    it('works for dopri, preventing use with incorrect output', () => {
        var rhs = function(t, y, dydt) {
            dydt[0] = 1;
        };
        var out = (t, y, solution) => [y[0] + 1];
        expect(() => dopri.integrate(rhs, [1], 0, 3, {}, out)).to.throw(
            "Can't used delayed output with non-delayed rhs");
    });

    it('works for dde, with no output', () => {
        var rhs = function(t, y, dydt, solution) {
            dydt[0] = 1;
        };
        var sol = dopri.integrate(rhs, [1], 0, 3);
        var t = [0, 1, 2, 3];
        var y = sol(t);
        expect(y.map(el => el[0])).to.deep.eql([1, 2, 3, 4]);
    });

    it('works for dde, with output', () => {
        var rhs = function(t, y, dydt, solution) {
            dydt[0] = 1;
        };
        var out = (t, y, solution) => solution(t - 1);
        var sol = dopri.integrate(rhs, [1], 0, 3, {}, out);
        var t = [0, 1, 2, 3];
        var y = sol(t);
        expect(y.map(el => el[0])).to.deep.eql([1, 2, 3, 4]);
        expect(y.map(el => el[1])).to.deep.eql([1, 1, 2, 3]);
    });

    it('works for dde, preventing use with incorrect output', () => {
        var rhs = function(t, y, dydt, solution) {
            dydt[0] = 1;
        };
        var out = (t, y) => [y[0] + 1];
        expect(() => dopri.integrate(rhs, [1], 0, 3, {}, out)).to.throw(
            "Can't used non-delayed output with delayed rhs");
    });
});
