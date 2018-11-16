'use strict';
var fs = require('fs');
var expect = require('chai').expect;
var dopri = require('../lib/dopri.js');
var examples = require('../lib/examples.js');
var utils = require("../lib/utils.js");

describe('validate initial conditions', () => {
    var solver = new dopri.Dopri(examples.lorenzRhs(), 3);
    it ('rejects invalid input', () => {
        expect(() => { solver.initialise(0, [1]); }).to.throw(
            "Invalid size 'y' - expected a length 3 array");
    });
    it ('accepts valid input', () => {
        expect(() => { solver.initialise(0, [1, 1, 1]); }).to.not.throw();
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
        expect(utils.approxEqualArray(y1, y2, 1e-6)).to.eql(true);
    });

    it ('works for multidimensional problems', () => {
        var r = [-0.5, 0, 0.5];
        var y0 = [1, 1, 1];
        var sol = dopri.integrate(examples.exponentialRhs(r), y0, 0, 25);

        var t = utils.seqLen(0, 25, 101);
        var y1 = sol(t);
        var y2 = examples.exponentialSolution(r, y0, t);

        expect(utils.approxEqualArray(
            y1.map(el => el[0]), y2.map(el => el[0]), 1e-6)).to.eql(true);
        expect(utils.approxEqualArray(
            y1.map(el => el[1]), y2.map(el => el[1]), 1e-16)).to.eql(true);
        expect(utils.approxEqualArray(
            y1.map(el => el[2]), y2.map(el => el[2]), 3e-6)).to.eql(true);
    });

    it ('works for zero derivatives', () => {
        var y0 = [0];
        var r = [0];
        var t = utils.seqLen(0, 25, 101);
        var sol = dopri.integrate(examples.exponentialRhs(r), y0, 0, 25);
        var y1 = sol(t);
        var y2 = examples.exponentialSolution(r, y0, t);
        expect(utils.approxEqualArray(y1, y2, 1e-6)).to.eql(true);
    });
});


describe('integrate logistic', () => {
    it ('agrees with solution', () => {
        var y0 = [1], r = 0.5, K = 100;
        var t = utils.seqLen(0, 25, 101);
        var sol = dopri.integrate(examples.logisticRhs(r, K), y0, 0, 25);
        var y1 = sol(t);
        var y2 = examples.logisticSolution(r, K, y0, t);
        expect(utils.approxEqualArray(y1.map(x => x[0]), y2, 1e-6)).
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
    it ('5th order agrees with reference', () => {
        var t = utils.seqLen(0, 25, 101);
        var y0 = [10, 1, 1];

        var sol = dopri.integrate(examples.lorenzRhs(), y0, 0, utils.last(t));
        var y = sol(t);

        var pathRefJs = "test/ref/lorenz_js5.json";
        var pathRefR = "test/ref/lorenz_r5.json";

        if (!fs.existsSync(pathRefJs)) {
            fs.writeFileSync(pathRefJs, JSON.stringify(y));
        }

        var cmpJs = JSON.parse(fs.readFileSync(pathRefJs));
        var cmpR = JSON.parse(fs.readFileSync(pathRefR));

        // This one should just straight up agree:
        expect(y).to.deep.equal(cmpJs);

        // This one is more complicated:
        for (var i = 0; i < t.length - 1; ++i) {
            expect(utils.approxEqualArray(y[i], cmpR[i])).to.eql(true);
        }
        // Last one is due to interpolation error - the R version
        // stops the integrator on the point and the js version allows
        // us to exceed the point at the moment.
        expect(utils.approxEqualArray(y[100], cmpR[100], 1e-6)).
            to.eql(true);
        expect(utils.approxEqualArray(y[100], cmpR[100], 1e-8)).
            to.eql(false);
    });

    it ('8th order agrees with reference', () => {
        var t = utils.seqLen(0, 25, 101);
        var y0 = [10, 1, 1];

        var ctl = {algorithm: dopri.Algorithm.dopri853};
        var sol = dopri.integrate(examples.lorenzRhs(), y0, 0, utils.last(t),
                                  ctl);
        var y = sol(t);

        var pathRefJs = "test/ref/lorenz_js853.json";
        var pathRefR = "test/ref/lorenz_r853.json";

        if (!fs.existsSync(pathRefJs)) {
            fs.writeFileSync(pathRefJs, JSON.stringify(y));
        }

        var cmpJs = JSON.parse(fs.readFileSync(pathRefJs));
        var cmpR = JSON.parse(fs.readFileSync(pathRefR));

        // This one should just straight up agree:
        expect(y).to.deep.equal(cmpJs);

        // This one is more complicated:
        // for (var i = 0; i < t.length - 1; ++i) {
        //     expect(utils.approxEqualArray(y[i], cmpR[i])).to.eql(true);
        // }
        // Last one is due to interpolation error - the R version
        // stops the integrator on the point and the js version allows
        // us to exceed the point at the moment.
        // expect(utils.approxEqualArray(y[100], cmpR[100], 1e-6)).
        //    to.eql(true);
        // expect(utils.approxEqualArray(y[100], cmpR[100], 1e-8)).
        //     to.eql(false);
    });
});


describe('Exceed max steps', () => {
    it('Throws when max steps exceeded', () => {
        var ctl = {maxSteps: 5};
        var solver = new dopri.Dopri(examples.flameRhs, 1, ctl);
        solver.initialise(0, [0.1]);
        expect(() => solver.run(100)).to.throw("too many steps");
    });
});


describe('Step size too small', () => {
    it('Throws when max steps exceeded', () => {
        var solver = new dopri.Dopri(examples.flameRhs, 1);
        solver.initialise(0, [0.1]);
        solver._stepper.stepControl.sizeMin = 0.1;
        expect(() => solver.run(100)).to.throw("step too small");
    });
});


describe('Step size vanished', () => {
    it('Throws when max steps exceeded', () => {
        var solver = new dopri.Dopri(examples.exponentialRhs([0.5]), 1);
        var h = solver._stepper.stepControl.sizeMin;

        solver.initialise(h / 2**(-52), [0.1]);
        solver._h = h;
        expect(() => solver._step()).to.throw("step size vanished");
        solver._h = 2 * h;
        expect(() => solver._step()).to.not.throw();
    });
});


describe('stiff systems', () => {
    it('5th order method can detect stiff problems', () => {
        var delta = 0.001;
        var y0 = [delta];
        var t1 = 2 / delta;
        var ctl = {stiffCheck: 1};
        var solver = new dopri.Dopri(examples.flameRhs, 1, ctl);
        solver.initialise(0, y0);
        expect(() => solver.run(t1)).to.throw("problem became stiff");
    });

    // This flat out just does not work - I think that there's an
    // error in the stiff test code so check this carefully against
    // the C and the Fortran.
    // it('8th order method can detect stiff problems', () => {
    //     var delta = 0.001;
    //     var y0 = [delta];
    //     var t1 = 2 / delta;
    //     var ctl = {stiffCheck: 1, algorithm: dopri.Algorithm.dopri853};
    //     var solver = new dopri.Dopri(examples.flameRhs, 1, ctl);
    //     solver.initialise(0, y0);
    //     expect(() => solver.run(t1)).to.throw("problem became stiff");
    // });
});


describe('reset stiff check', () => {
    it('can detect stiff problems', () => {
        var solver = new dopri.Dopri(examples.exponentialRhs([0.5]), 1);
        solver.initialise(0, [0.1]);
        solver.run(10);

        solver.stiffCheck = 1;
        solver._stiffNStiff = 3;
        for (var i = 0; i < 6; ++i) {
            solver._step();
            expect(solver.statistics().stiffNNonstiff).to.eql(i + 1);
        }
        solver._step();
        expect(solver.statistics().stiffNStiff).to.eql(0);
        expect(solver.statistics().stiffNNonstiff).to.eql(0);
    });
});


describe('statistics', () => {
    var solver = new dopri.Dopri(examples.lorenzRhs(), 3);

    it('is zeroed at first', () => {
        var stats = solver.statistics();
        // All zerod:
        expect(stats.nEval).to.eql(0);
        expect(stats.nSteps).to.eql(0);
        expect(stats.nStepsAccepted).to.eql(0);
        expect(stats.nStepsRejected).to.eql(0);
        expect(stats.stiffNNonstiff).to.eql(0);
        expect(stats.stiffNStiff).to.eql(0);
    });

    it('is all zeroed except nEval after initialisation', () => {
        solver.initialise(0, [10, 1, 1]);
        var stats = solver.statistics();
        expect(stats.nEval).to.eql(3);
        expect(stats.nSteps).to.eql(0);
        expect(stats.nStepsAccepted).to.eql(0);
        expect(stats.nStepsRejected).to.eql(0);
        expect(stats.stiffNNonstiff).to.eql(0);
        expect(stats.stiffNStiff).to.eql(0);
    });

    it('is all over the show after running', () => {
        solver.run(10);
        var stats = solver.statistics();
        expect(stats.nEval).to.eql(2091);
        expect(stats.nSteps).to.eql(348);
        expect(stats.nStepsAccepted).to.eql(340);
        expect(stats.nStepsRejected).to.eql(8);
        expect(stats.stiffNNonstiff).to.eql(0);
        expect(stats.stiffNStiff).to.eql(0);
    });
});


describe('details', () => {
    it('only reject after first successful step', () => {
        var solver = new dopri.Dopri(examples.lorenzRhs(), 3);
        solver.initialise(0, [1, 2, 3]);
        solver._h = 10;
        solver._step();
        var s = solver.statistics();
        expect(s.nStepsAccepted).to.eql(1);
        expect(s.nStepsRejected).to.eql(0);
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
        expect(y2).to.deep.eql(y1);
        expect(y3).to.not.deep.eql(y1);
    });
});

describe('dopri853', () => {
    it('agrees with dopri5', () => {
        var r = [-0.5, 0, 0.5];
        var y0 = [1, 1, 1];
        var c1 = {algorithm: dopri.Algorithm.dopri5};
        var c2 = {algorithm: dopri.Algorithm.dopri853};

        var sol1 = new dopri.Dopri(examples.exponentialRhs(r), 3, c1);
        var sol2 = new dopri.Dopri(examples.exponentialRhs(r), 3, c2);
        var t = utils.seqLen(0, 25, 101);

        var y1 = sol1.initialise(0, y0).run(25)(t);
        var y2 = sol2.initialise(0, y0).run(25)(t);

        // the 3rd case here looks quite different, but we can chase
        // that up with the reference check.  This system covers a lot
        // of orders of magnitude by the end!
        for (var i = 0; i < 3; ++i) {
            expect(utils.approxEqualArray(y1.map(el => el[i]),
                                          y2.map(el => el[i]),
                                          5e-5)).to.eql(true);
        }
        for (var i = 0; i < 3; ++i) {
            expect(utils.approxEqualArray(y1.map(el => el[i]),
                                          y2.map(el => el[i]))).to.eql(i == 1);
        }

        // Fewer steps with the higher order stepper
        expect(sol2.statistics().nSteps < sol1.statistics().nSteps).
            to.eql(true);
    });

    it('accepts control in high level interface', () => {
        var rhs = examples.exponentialRhs([0.1]);
        var c = {algorithm: dopri.Algorithm.dopri853};
        var t = utils.seqLen(0, 25, 15);
        var y0 = [1];
        var solver = new dopri.Dopri(rhs, 1, c);

        var y1 = dopri.integrate(rhs, y0, 0, 25, c)(t);
        var y2 = solver.initialise(0, y0).run(25)(t);
        expect(y1).to.deep.eql(y2);
        expect(y1).to.not.deep.eql(dopri.integrate(rhs, y0, 0, 25)(t));
    });
});
