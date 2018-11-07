'use strict';
var dopri = require("../lib/index.js");
var expect = require('chai').expect;

describe('High level use', () => {
    var rhs = function(t, y, dydt) {
        dydt[0] = 1;
    };
    it('works with integrate function', () => {
        var sol = dopri.integrate(rhs, [1], 0, 3);
        var t = [0, 1, 2, 3];
        var y = sol(t);
        expect(y.map(el => el[0])).to.deep.eql([1, 2, 3, 4]);
    });

    it('works with Dopri class', () => {
        var solver = new dopri.Dopri(rhs, 1);
        solver.initialise(0, [1]);
        var sol = solver.run(4);
        var t = [0, 1, 2, 3];
        expect(sol(t).map(el => el[0])).to.deep.eql([1, 2, 3, 4]);
    });
});
