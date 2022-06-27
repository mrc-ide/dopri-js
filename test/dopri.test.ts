import * as dopri from "../src/dopri";
import * as examples from "../src/examples";
import * as utils from "../src/utils";
import {flatten} from "./helpers";

describe("validate initial conditions", () => {
    const solver = new dopri.Dopri(examples.lorenzRhs(), 3);
    it("rejects invalid input", () => {
        expect(() => { solver.initialise(0, [1]); }).toThrow(
            "Invalid size 'y' - expected a length 3 array");
    });
    it("accepts valid input", () => {
        expect(() => { solver.initialise(0, [1, 1, 1]); }).not.toThrow();
    });
});

describe("integrate exponential", () => {
    it("works for 1d problems", () => {
        const y0 = [1];
        const r = [-0.5];
        const t = utils.seqLen(0, 25, 101);
        const sol = dopri.integrate(examples.exponentialRhs(r), y0, 0, 25);
        const y1 = sol(t);
        const y2 = examples.exponentialSolution(r, y0, t);
        expect(utils.approxEqualArray(flatten(y1), flatten(y2), 1e-6))
            .toBe(true);
    });

    it("works for multidimensional problems", () => {
        const r = [-0.5, 0, 0.5];
        const y0 = [1, 1, 1];
        const sol = dopri.integrate(examples.exponentialRhs(r), y0, 0, 25);

        const t = utils.seqLen(0, 25, 101);
        const y1 = sol(t);
        const y2 = examples.exponentialSolution(r, y0, t);

        expect(utils.approxEqualArray(flatten(y1, 0), flatten(y2, 0), 1e-6))
            .toEqual(true);
        expect(utils.approxEqualArray(flatten(y1, 1), flatten(y2, 1), 1e-6))
            .toEqual(true);
        expect(utils.approxEqualArray(flatten(y1, 2), flatten(y2, 2), 3e-6))
            .toEqual(true);
    });

    it("works for zero derivatives", () => {
        const y0 = [0];
        const r = [0];
        const t = utils.seqLen(0, 25, 101);
        const sol = dopri.integrate(examples.exponentialRhs(r), y0, 0, 25);
        const y1 = sol(t);
        const y2 = examples.exponentialSolution(r, y0, t);
        expect(utils.approxEqualArray(flatten(y1), flatten(y2), 1e-6))
            .toBe(true);
    });
});


describe("integrate logistic", () => {
    it("agrees with solution", () => {
        const y0 = [1];
        const r = 0.5;
        const K = 100;
        const t = utils.seqLen(0, 25, 101);
        const sol = dopri.integrate(examples.logisticRhs(r, K), y0, 0, 25);
        const y1 = sol(t);
        const y2 = examples.logisticSolution(r, K, y0[0], t);
        expect(utils.approxEqualArray(flatten(y1), y2, 1e-6)).toBe(true);
    });
});


describe("Exceed max steps", () => {
    it("Throws when max steps exceeded", () => {
        const ctl = {maxSteps: 5};
        const solver = new dopri.Dopri(examples.flameRhs, 1, ctl);
        solver.initialise(0, [0.1]);
        expect(() => solver.run(100)).toThrow("too many steps");
    });
});


describe("Step size too small", () => {
    it("Throws when step size becomes too small", () => {
        const ctl = {stepSizeMin: 0.1};
        const solver = new dopri.Dopri(examples.flameRhs, 1, ctl);
        solver.initialise(0, [0.1]);
        expect(() => solver.run(100)).toThrow("step too small");
    });

    // This is easier to verify with Lorenz than flame
    it("Can continue if told that is ok", () => {
        const ctl = {stepSizeMin: 0.01, stepSizeMinAllow: true};
        const solver = new dopri.Dopri(examples.lorenzRhs(), 3, ctl);
        solver.initialise(0, [10, 1, 1]);
        solver.run(1);

        let minDiff = Infinity;
        const history = solver["_history"];
        for (let i = 1; i < history.length; ++i) {
            minDiff = Math.min(minDiff, history[i].t - history[i - 1].t);
        }
        expect(minDiff).toEqual(0.01);
    });
});


describe("Step size vanished", () => {
    it("Throws when step size vanishes", () => {
        const solver = new dopri.Dopri(examples.exponentialRhs([0.5]), 1);
        const h = solver["_control"].stepSizeMin;

        solver.initialise(h / 2**(-52), [0.1]);
        solver["_h"] = h;
        expect(() => solver["_step"]()).toThrow("step size vanished");
        solver["_h"] = 2 * h;
        expect(() => solver["_step"]()).not.toThrow();
    });
});


describe("stiff systems", () => {
    it("can detect stiff problems", () => {
        const delta = 0.001;
        const y0 = [delta];
        const t1 = 2 / delta;
        const ctl = {stiffCheck: 1};
        const solver = new dopri.Dopri(examples.flameRhs, 1, ctl);
        solver.initialise(0, y0);
        expect(() => solver.run(t1)).toThrow("problem became stiff");
    });
});


describe("reset stiff check", () => {
    it("can detect stiff problems", () => {
        const solver = new dopri.Dopri(examples.exponentialRhs([0.5]), 1);
        solver.initialise(0, [0.1]);
        solver.run(10);

        solver["_control"].stiffCheck = 1;
        solver["_stiffNStiff"] = 3;
        for (let i = 0; i < 6; ++i) {
            solver["_step"]();
            expect(solver.statistics().stiffNNonstiff).toEqual(i + 1);
        }
        solver["_step"]();
        expect(solver.statistics().stiffNStiff).toEqual(0);
        expect(solver.statistics().stiffNNonstiff).toEqual(0);
    });
});


describe("statistics", () => {
    const solver = new dopri.Dopri(examples.lorenzRhs(), 3);

    it("is zeroed at first", () => {
        const stats = solver.statistics();
        // All zerod:
        expect(stats.nEval).toEqual(0);
        expect(stats.nSteps).toEqual(0);
        expect(stats.nStepsAccepted).toEqual(0);
        expect(stats.nStepsRejected).toEqual(0);
        expect(stats.stiffNNonstiff).toEqual(0);
        expect(stats.stiffNStiff).toEqual(0);
    });

    it("is all zeroed except nEval after initialisation", () => {
        solver.initialise(0, [10, 1, 1]);
        const stats = solver.statistics();
        expect(stats.nEval).toEqual(3);
        expect(stats.nSteps).toEqual(0);
        expect(stats.nStepsAccepted).toEqual(0);
        expect(stats.nStepsRejected).toEqual(0);
        expect(stats.stiffNNonstiff).toEqual(0);
        expect(stats.stiffNStiff).toEqual(0);
    });

    it("is all over the show after running", () => {
        solver.run(10);
        const stats = solver.statistics();
        expect(stats.nEval).toEqual(2091);
        expect(stats.nSteps).toEqual(348);
        expect(stats.nStepsAccepted).toEqual(340);
        expect(stats.nStepsRejected).toEqual(8);
        expect(stats.stiffNNonstiff).toEqual(0);
        expect(stats.stiffNStiff).toEqual(0);
    });
});


describe("details", () => {
    it("only reject after first successful step", () => {
        const solver = new dopri.Dopri(examples.lorenzRhs(), 3);
        solver.initialise(0, [1, 2, 3]);
        solver["_h"] = 10;
        solver["_step"]();
        const s = solver.statistics();
        expect(s.nStepsAccepted).toEqual(1);
        expect(s.nStepsRejected).toEqual(0);
    });
});


describe("no absolute error", () => {
    it("can start integration with no absolute error", () => {
        const rhs = function(t: number, y: number[], dydt: number[]) {
            dydt[0] = 1;
        };
        const sol = dopri.integrate(rhs, [0], 0, 1);
        const y = sol([1])[0];
        expect(utils.approxEqualArray(y, [1], 1e-6)).toEqual(true);
    });
});


describe("interface", () => {
    it("accepts control in high-level interface", () => {
        const ctl = {atol: 1e-4, rtol: 1e-4};
        const t = utils.seqLen(0, 25, 101);
        const y0 = [10, 1, 1];
        const rhs = examples.lorenzRhs();
        const solver = new dopri.Dopri(rhs, 3, ctl);
        const y1 = solver.initialise(0, y0).run(25)(t);
        const y2 = dopri.integrate(rhs, y0, 0, 25, ctl)(t);
        const y3 = dopri.integrate(rhs, y0, 0, 25)(t);
        expect(y2).toEqual(y1);
        expect(y3).not.toEqual(y1);
    });
});

describe("output", () => {
    it("is computed correctly", () => {
        const out = (t: number, y: number[]) =>
            [y.reduce((a: number, b: number) => a + b, 0)];
        const r = [-0.5, 0, 0.5];
        const y0 = [1, 1, 1];
        const rhs = examples.exponentialRhs(r);

        const solver = new dopri.Dopri(rhs, r.length, {}, out);
        solver.initialise(0, y0);
        const sol = solver.run(25);

        const t = utils.seqLen(0, 10, 11);

        const y = sol(t);
        y.forEach((el: number[]) => expect(el[0] + el[1] + el[2])
                  .toEqual(el[3]));

        const sol2 = dopri.integrate(rhs, y0, 0, 10, {}, out);
        const y2 = sol2(t);
        expect(y2).toEqual(y);
    });
});

describe("tcrit", () => {
    const ctl = {tcrit: 1}
    const rhs = function(t: number, y: number[], dydt: number[]) {
        dydt[0] = 1;
    };

    it("can stop in time", () => {
        const solver = new dopri.Dopri(rhs, 1, ctl);
        solver.initialise(0, [1]);
        solver.run(1);
        expect(solver["_t"]).toEqual(1);
    });

    it("skips over times if left alone", () => {
        const solver = new dopri.Dopri(rhs, 1);
        solver.initialise(0, [1]);
        solver.run(1);
        expect(solver["_t"]).toBeGreaterThan(1);
    })
});
