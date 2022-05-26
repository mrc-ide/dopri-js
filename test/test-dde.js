'use strict';
var expect = require('chai').expect;
var dde = require('../lib/dde.js');
var dopri = require('../lib/dopri.js');
var examples = require('../lib/examples.js');
var utils = require("../lib/utils.js");

describe('Can lag variables in output', () => {
    it("Agrees for trivial case", () => {
        var y0 = [1], r = 0.5, K = 100;
        var rhs = examples.logisticRhs(r, K);
        var out = (t, y, solution) => solution(t - 1);

        var solver = new dde.DDE(rhs, y0.length, {}, out);
        solver.initialise(0, y0);
        var sol = solver.run(10);

        var t = utils.seqLen(0, 10, 11);
        var y = sol(t);

        var yReal = y.slice(0, 10).map(el => el[0]);
        var yLag = y.slice(1, 11).map(el => el[1]);
        expect(utils.approxEqualArray(yLag, yReal)).to.eql(true);
    });
});


describe('Interface', () => {
    it('Agrees with ODE for ODE systems', () => {
        var y0 = [1], r = 0.5, K = 100;
        var rhs = examples.logisticRhs(r, K);
        var t = utils.seqLen(0, 10, 11);
        var solDDE = new dde.DDE(rhs, 1);
        var solODE = new dopri.Dopri(rhs, 1);
        var yDDE = solDDE.initialise(0, y0).run(10)(t);
        var yODE = solODE.initialise(0, y0).run(10)(t);
        expect(yDDE).to.deep.eql(yODE);
    });

    it('Agrees with ODE for ODE systems with simple interface', () => {
        var y0 = [1], r = 0.5, K = 100;
        var rhs = examples.logisticRhs(r, K);
        var t = utils.seqLen(0, 10, 11);
        var yODE = dopri.integrate(rhs, y0, 0, 10)(t);
        var yDDE = dde.integrate(rhs, y0, 0, 10)(t);
        expect(yDDE).to.deep.eql(yODE);
    });


    it('Agrees with ODE for ODE systems with simple interface', () => {
        var y0 = [1], r = 0.5, K = 100;
        var rhs = examples.logisticRhs(r, K);
        var out = (t, y) => [y[0] / 2];
        var t = utils.seqLen(0, 10, 11);
        var ctl = {atol: 1e-3, rtol: 1e-3};
        var yODE = dopri.integrate(rhs, y0, 0, 10, ctl, out)(t);
        var yDDE = dde.integrate(rhs, y0, 0, 10, ctl, out)(t);
        expect(yDDE).to.deep.eql(yODE);
    });
});


describe('Delay differential equations', () => {
    it("Can solve a system of ddes", () => {
        var y0 = [0, 0];
        var rhsDDE = function(t, y, dydt, solution) {
            dydt[0] = 1;
            dydt[1] = solution(t - 1)[0];
        }
        var rhsODE = function(t, y, dydt) {
            dydt[0] = 1;
            dydt[1] = t > 1 ? t - 1 : 0;
        }
        var t = utils.seqLen(0, 5, 11);
        var y = dde.integrate(rhsDDE, y0, 0, 5, {}, null)(t);
        var cmp = dde.integrate(rhsODE, y0, 0, 5, {}, null)(t);

        var extract = function(v, i) {
            return v.map((el) => el[i])
        }
        expect(utils.approxEqualArray(extract(y, 0), extract(cmp, 0)))
            .to.eql(true);
        expect(utils.approxEqualArray(extract(y, 1), extract(cmp, 1)))
            .to.eql(true);
    });
})
