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
});
