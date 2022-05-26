import * as dde from "../src/dde";
import * as dopri from "../src/dopri";
import * as utils from "../src/utils";
import {logisticRhs} from "../src/examples";

describe('Can lag variables in output', () => {
    it("Agrees for trivial case", () => {
        var y0 = [1], r = 0.5, K = 100;
        var rhs = logisticRhs(r, K);
        var out = (t: number, y: number[], solution: any) =>
            solution(t - 1);

        var solver = new dde.DDE(rhs, y0.length, {}, out);
        solver.initialise(0, y0);
        var sol = solver.run(10);

        var t = utils.seqLen(0, 10, 11);
        var y = sol(t);

        var yReal = y.slice(0, 10).map((el: number[]) => el[0]);
        var yLag = y.slice(1, 11).map((el: number[]) => el[1]);
        expect(utils.approxEqualArray(yLag, yReal)).toEqual(true);
    });
});


describe('Interface', () => {
    it('Agrees with ODE for ODE systems', () => {
        var y0 = [1], r = 0.5, K = 100;
        var rhs = logisticRhs(r, K);
        var t = utils.seqLen(0, 10, 11);
        var solDDE = new dde.DDE(rhs, 1);
        var solODE = new dopri.Dopri(rhs, 1);
        var yDDE = solDDE.initialise(0, y0).run(10)(t);
        var yODE = solODE.initialise(0, y0).run(10)(t);
        expect(yDDE).toEqual(yODE);
    });

    it('Agrees with ODE for ODE systems with simple interface', () => {
        var y0 = [1], r = 0.5, K = 100;
        var rhs = logisticRhs(r, K);
        var t = utils.seqLen(0, 10, 11);
        var yODE = dopri.integrate(rhs, y0, 0, 10)(t);
        var yDDE = dde.integrate(rhs, y0, 0, 10)(t);
        expect(yDDE).toEqual(yODE);
    });


    it('Agrees with ODE for ODE systems with simple interface', () => {
        var y0 = [1], r = 0.5, K = 100;
        var rhs = logisticRhs(r, K);
        var out = (t: number, y: number[]) => [y[0] / 2];
        var t = utils.seqLen(0, 10, 11);
        var ctl = {atol: 1e-3, rtol: 1e-3};
        var yODE = dopri.integrate(rhs, y0, 0, 10, ctl, out)(t);
        var yDDE = dde.integrate(rhs, y0, 0, 10, ctl, out)(t);
        expect(yDDE).toEqual(yODE);
    });
});


describe('Delay differential equations', () => {
    it("Can solve a system of ddes", () => {
        var y0 = [0, 0];
        var rhsDDE = function(t: number, y: number[], dydt: number[],
                              solution: any) {
            dydt[0] = 1;
            dydt[1] = solution(t - 1)[0];
        }
        var rhsODE = function(t: number, y: number[], dydt: number[]) {
            dydt[0] = 1;
            dydt[1] = t > 1 ? t - 1 : 0;
        }
        var t = utils.seqLen(0, 5, 11);
        var y = dde.integrate(rhsDDE, y0, 0, 5, {}, null)(t);
        var cmp = dde.integrate(rhsODE, y0, 0, 5, {}, null)(t);

        var extract = function(v: number[][], i: number) {
            return v.map((el: number[]) => el[i])
        }
        expect(utils.approxEqualArray(extract(y, 0), extract(cmp, 0)))
            .toEqual(true);
        expect(utils.approxEqualArray(extract(y, 1), extract(cmp, 1)))
            .toEqual(true);
    });
})
