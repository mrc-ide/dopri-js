import * as dde from "../src/dde";
import * as dopri from "../src/dopri";
import * as utils from "../src/utils";

import {logisticRhs} from "../src/examples";

describe("Can lag variables in output", () => {
    it("Agrees for trivial case", () => {
        const y0 = [1];
        const r = 0.5;
        const K = 100;
        const rhs = logisticRhs(r, K);
        const out = (t: number, y: number[], solution: any) =>
            solution(t - 1);

        const solver = new dde.DDE(rhs, y0.length, {}, out);
        solver.initialise(0, y0);
        const sol = solver.run(10);

        const tSol = utils.seqLen(0, 10, 11);
        const ySol = sol(tSol);

        const yReal = ySol.slice(0, 10).map((el: number[]) => el[0]);
        const yLag = ySol.slice(1, 11).map((el: number[]) => el[1]);
        expect(utils.approxEqualArray(yLag, yReal)).toEqual(true);
    });
});

describe("Interface", () => {
    it("Agrees with ODE for ODE systems", () => {
        const y0 = [1];
        const r = 0.5;
        const K = 100;
        const rhs = logisticRhs(r, K);
        const t = utils.seqLen(0, 10, 11);
        const solDDE = new dde.DDE(rhs, 1);
        const solODE = new dopri.Dopri(rhs, 1);
        const yDDE = solDDE.initialise(0, y0).run(10)(t);
        const yODE = solODE.initialise(0, y0).run(10)(t);
        expect(yDDE).toEqual(yODE);
    });

    it("Agrees with ODE for ODE systems with simple interface", () => {
        const y0 = [1];
        const r = 0.5;
        const K = 100;
        const rhs = logisticRhs(r, K);
        const t = utils.seqLen(0, 10, 11);
        const yODE = dopri.integrateDopri(rhs, y0, 0, 10)(t);
        const yDDE = dde.integrateDDE(rhs, y0, 0, 10)(t);
        expect(yDDE).toEqual(yODE);
    });

    it("Agrees with ODE for ODE systems with simple interface", () => {
        const y0 = [1];
        const r = 0.5;
        const K = 100;
        const rhs = logisticRhs(r, K);
        const out = (t: number, y: number[]) => [y[0] / 2];
        const tSol = utils.seqLen(0, 10, 11);
        const ctl = {atol: 1e-3, rtol: 1e-3};
        const yODE = dopri.integrateDopri(rhs, y0, 0, 10, ctl, out)(tSol);
        const yDDE = dde.integrateDDE(rhs, y0, 0, 10, ctl, out)(tSol);
        expect(yDDE).toEqual(yODE);
    });
});

describe("Delay differential equations", () => {
    it("Can solve a system of ddes", () => {
        const y0 = [0, 0];
        const rhsDDE = function(t: number, y: number[], dydt: number[],
                                solution: any) {
            dydt[0] = 1;
            dydt[1] = solution(t - 1)[0];
        };
        const rhsODE = function(t: number, y: number[], dydt: number[]) {
            dydt[0] = 1;
            dydt[1] = t > 1 ? t - 1 : 0;
        };
        const tSol = utils.seqLen(0, 5, 11);
        const ySol = dde.integrateDDE(rhsDDE, y0, 0, 5, {}, null)(tSol);
        const cmp = dde.integrateDDE(rhsODE, y0, 0, 5, {}, null)(tSol);

        const extract = (v: number[][], i: number) =>
            v.map((el: number[]) => el[i]);
        expect(utils.approxEqualArray(extract(ySol, 0), extract(cmp, 0)))
            .toEqual(true);
        expect(utils.approxEqualArray(extract(ySol, 1), extract(cmp, 1)))
            .toEqual(true);
    });
});
