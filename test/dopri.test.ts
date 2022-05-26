import * as dopri from "../src/dopri";
import * as examples from "../src/examples";
import * as utils from "../src/utils";

describe('validate initial conditions', () => {
    var solver = new dopri.Dopri(examples.lorenzRhs(), 3);
    it ('rejects invalid input', () => {
        expect(() => { solver.initialise(0, [1]); }).toThrow(
            "Invalid size 'y' - expected a length 3 array");
    });
    it ('accepts valid input', () => {
        expect(() => { solver.initialise(0, [1, 1, 1]); }).not.toThrow();
    });
});

describe('integrate exponential', () => {
    it ('works for 1d problems', () => {
        var y0 = [1];
        var r = [-0.5];
        var t = utils.seqLen(0, 25, 101);
        var sol = dopri.integrate(examples.exponentialRhs(r), y0, 0, 25);
        var y1 = sol(t);
        var y2 = examples.exponentialSolution(r, y0, t);
        // expect(utils.approxEqualArray(y1, y2, 1e-6)).toEqual(true);
    });

    it ('works for multidimensional problems', () => {
        var r = [-0.5, 0, 0.5];
        var y0 = [1, 1, 1];
        var sol = dopri.integrate(examples.exponentialRhs(r), y0, 0, 25);

        var t = utils.seqLen(0, 25, 101);
        var y1 = sol(t);
        var y2 = examples.exponentialSolution(r, y0, t);

        // expect(utils.approxEqualArray(
        //     y1.map((el: number) => el[0]),
        //     y2.map((el: number) => el[0]), 1e-6)).toEqual(true);
        // expect(utils.approxEqualArray(
        //     y1.map((el: number) => el[1]),
        //     y2.map((el: number) => el[1]), 1e-16)).toEqual(true);
        // expect(utils.approxEqualArray(
        //     y1.map((el: number) => el[2]),
        //     y2.map((el: number) => el[2]), 3e-6)).toEqual(true);
    });

    it ('works for zero derivatives', () => {
        var y0 = [0];
        var r = [0];
        var t = utils.seqLen(0, 25, 101);
        var sol = dopri.integrate(examples.exponentialRhs(r), y0, 0, 25);
        var y1 = sol(t);
        var y2 = examples.exponentialSolution(r, y0, t);
        // expect(utils.approxEqualArray(y1, y2, 1e-6)).toEqual(true);
    });
});


describe('integrate logistic', () => {
    it ('agrees with solution', () => {
        var y0 = [1], r = 0.5, K = 100;
        var t = utils.seqLen(0, 25, 101);
        var sol = dopri.integrate(examples.logisticRhs(r, K), y0, 0, 25);
        var y1 = sol(t);
        // var y2 = examples.logisticSolution(r, K, y0, t);
        // expect(utils.approxEqualArray(y1.map((x: number) => x[0]), y2, 1e-6)).
        //     to.eql(true);
    });
});


describe('Exceed max steps', () => {
    it('Throws when max steps exceeded', () => {
        var ctl = {maxSteps: 5};
        var solver = new dopri.Dopri(examples.flameRhs, 1, ctl);
        solver.initialise(0, [0.1]);
        expect(() => solver.run(100)).toThrow("too many steps");
    });
});


describe('Step size too small', () => {
    it('Throws when step size becomes too small', () => {
        var ctl = {stepSizeMin: 0.1};
        var solver = new dopri.Dopri(examples.flameRhs, 1, ctl);
        solver.initialise(0, [0.1]);
        expect(() => solver.run(100)).toThrow("step too small");
    });

    // This is easier to verify with Lorenz than flame
    it('Can continue if told that is ok', () => {
        var ctl = {stepSizeMin: 0.01, stepSizeMinAllow: true};
        var solver = new dopri.Dopri(examples.lorenzRhs(), 3, ctl);
        solver.initialise(0, [10, 1, 1]);
        solver.run(1);

        var min_diff = Infinity;
        var history = solver["_history"];
        for (var i = 1; i < history.length; ++i) {
            min_diff = Math.min(min_diff, history[i].t - history[i - 1].t);
        }
        expect(min_diff).toEqual(0.01);
    });
});


describe('Step size vanished', () => {
    it('Throws when step size vanishes', () => {
        var solver = new dopri.Dopri(examples.exponentialRhs([0.5]), 1);
        var h = solver["_control"].stepSizeMin;

        solver.initialise(h / 2**(-52), [0.1]);
        solver["_h"] = h;
        expect(() => solver["_step"]()).toThrow("step size vanished");
        solver["_h"] = 2 * h;
        expect(() => solver["_step"]()).not.toThrow();
    });
});


describe('stiff systems', () => {
    it('can detect stiff problems', () => {
        var delta = 0.001;
        var y0 = [delta];
        var t1 = 2 / delta;
        var ctl = {stiffCheck: 1};
        var solver = new dopri.Dopri(examples.flameRhs, 1, ctl);
        solver.initialise(0, y0);
        expect(() => solver.run(t1)).toThrow("problem became stiff");
    });
});


describe('reset stiff check', () => {
    it('can detect stiff problems', () => {
        var solver = new dopri.Dopri(examples.exponentialRhs([0.5]), 1);
        solver.initialise(0, [0.1]);
        solver.run(10);

        solver["_control"].stiffCheck = 1;
        solver["_stiffNStiff"] = 3;
        for (var i = 0; i < 6; ++i) {
            solver["_step"]();
            expect(solver.statistics().stiffNNonstiff).toEqual(i + 1);
        }
        solver["_step"]();
        expect(solver.statistics().stiffNStiff).toEqual(0);
        expect(solver.statistics().stiffNNonstiff).toEqual(0);
    });
});


describe('statistics', () => {
    var solver = new dopri.Dopri(examples.lorenzRhs(), 3);

    it('is zeroed at first', () => {
        var stats = solver.statistics();
        // All zerod:
        expect(stats.nEval).toEqual(0);
        expect(stats.nSteps).toEqual(0);
        expect(stats.nStepsAccepted).toEqual(0);
        expect(stats.nStepsRejected).toEqual(0);
        expect(stats.stiffNNonstiff).toEqual(0);
        expect(stats.stiffNStiff).toEqual(0);
    });

    it('is all zeroed except nEval after initialisation', () => {
        solver.initialise(0, [10, 1, 1]);
        var stats = solver.statistics();
        expect(stats.nEval).toEqual(3);
        expect(stats.nSteps).toEqual(0);
        expect(stats.nStepsAccepted).toEqual(0);
        expect(stats.nStepsRejected).toEqual(0);
        expect(stats.stiffNNonstiff).toEqual(0);
        expect(stats.stiffNStiff).toEqual(0);
    });

    it('is all over the show after running', () => {
        solver.run(10);
        var stats = solver.statistics();
        expect(stats.nEval).toEqual(2091);
        expect(stats.nSteps).toEqual(348);
        expect(stats.nStepsAccepted).toEqual(340);
        expect(stats.nStepsRejected).toEqual(8);
        expect(stats.stiffNNonstiff).toEqual(0);
        expect(stats.stiffNStiff).toEqual(0);
    });
});


describe('details', () => {
    it('only reject after first successful step', () => {
        var solver = new dopri.Dopri(examples.lorenzRhs(), 3);
        solver.initialise(0, [1, 2, 3]);
        solver["_h"] = 10;
        solver["_step"]();
        var s = solver.statistics();
        expect(s.nStepsAccepted).toEqual(1);
        expect(s.nStepsRejected).toEqual(0);
    });
});


describe('no absolute error', () => {
    it ('can start integration with no absolute error', () => {
        var rhs = function(t: number, y: number[], dydt: number[]) {
            dydt[0] = 1;
        };
        var sol = dopri.integrate(rhs, [0], 0, 1);
        var y = sol([1])[0];
        expect(utils.approxEqualArray(y, [1], 1e-6)).toEqual(true);
    });
});


describe('interface', () => {
    it('accepts control in high-level interface', () => {
        var ctl = {atol: 1e-4, rtol: 1e-4};
        var t = utils.seqLen(0, 25, 101);
        var y0 = [10, 1, 1];
        var rhs = examples.lorenzRhs();
        var solver = new dopri.Dopri(rhs, 3, ctl);
        var y1 = solver.initialise(0, y0).run(25)(t);
        var y2 = dopri.integrate(rhs, y0, 0, 25, ctl)(t);
        var y3 = dopri.integrate(rhs, y0, 0, 25)(t);
        expect(y2).toEqual(y1);
        // expect(y3).to.not.deep.eql(y1); // TODO
    });
});

describe('output', () => {
    it('is computed correctly', () => {
        var out = (t: number, y: number[]) =>
            [y.reduce((a: number, b: number) => a + b, 0)];
        var r = [-0.5, 0, 0.5];
        var y0 = [1, 1, 1];
        var rhs = examples.exponentialRhs(r);

        var solver = new dopri.Dopri(rhs, r.length, {}, out);
        solver.initialise(0, y0);
        var sol = solver.run(25);

        var t = utils.seqLen(0, 10, 11);

        var y = sol(t);
        y.forEach((el: number[]) => expect(el[0] + el[1] + el[2])
                  .toEqual(el[3]));

        var sol2 = dopri.integrate(rhs, y0, 0, 10, {}, out);
        var y2 = sol2(t);
        expect(y2).toEqual(y);
    });
});

describe('tcrit', () => {
    it('can stop in time', () => {
        var ctl = {tcrit: 1}
        var rhs = function(t: number, y: number[], dydt: number[]) {
            dydt[0] = 1;
        };
        var solver = new dopri.Dopri(rhs, 1, ctl);
        solver.initialise(0, [1]);
        solver.run(1);
        expect(solver["_t"]).toEqual(1);

        solver = new dopri.Dopri(rhs, 1);
        solver.initialise(0, [1]);
        solver.run(1);
        expect(solver["_t"]).toBeGreaterThan(1);
    })
});
