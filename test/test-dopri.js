'use strict';
var fs = require('fs');
var expect = require('chai').expect;
var dopri = require('../dist/dopri.js');
var examples = require('../dist/examples.js');
var utils = require("../dist/utils.js");

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
    it ('agrees with reference', () => {
        var t = utils.seqLen(0, 25, 101);
        var y0 = [10, 1, 1];

        var sol = dopri.integrate(examples.lorenzRhs(), y0, 0, utils.last(t));
        var y = sol(t);

        var pathRefJs = "test/ref/lorenz_js.json";
        var pathRefR = "test/ref/lorenz_r.json";

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
});


describe('Exceed max steps', () => {
    it('Throws when max steps exceeded', () => {
        var solver = new dopri.Dopri(examples.flameRhs, 1);
        solver.initialise(0, [0.1]);
        solver.maxSteps = 5;
        expect(() => solver.run(100)).to.throw("too many steps");
    });
});


describe('Step size too small', () => {
    it('Throws when max steps exceeded', () => {
        var solver = new dopri.Dopri(examples.flameRhs, 1);
        solver.initialise(0, [0.1]);
        solver.stepper.stepControl.sizeMin = 0.1;
        expect(() => solver.run(100)).to.throw("step too small");
    });
});


describe('Step size vanished', () => {
    it('Throws when max steps exceeded', () => {
        var solver = new dopri.Dopri(examples.exponentialRhs([0.5]), 1);
        var h = solver.stepper.stepControl.sizeMin;

        solver.initialise(h / 2**(-52), [0.1]);
        solver.h = h;
        expect(() => solver.step()).to.throw("step size vanished");
        solver.h = 2 * h;
        expect(() => solver.step()).to.not.throw();
    });
});


describe('stiff systems', () => {
    it('can detect stiff problems', () => {
        var delta = 0.001;
        var y0 = [delta];
        var t1 = 2 / delta;
        var solver = new dopri.Dopri(examples.flameRhs, 1);
        solver.initialise(0, y0);
        solver.stiffCheck = 1;
        expect(() => solver.run(t1)).to.throw("problem became stiff");
    });
});


describe('reset stiff check', () => {
    it('can detect stiff problems', () => {
        var solver = new dopri.Dopri(examples.exponentialRhs([0.5]), 1);
        solver.initialise(0, [0.1]);
        solver.run(10);

        solver.stiffCheck = 1;
        solver.stiffNStiff = 3;
        for (var i = 0; i < 6; ++i) {
            solver.step();
            expect(solver.stiffNNonstiff).to.eql(i + 1);
        }
        solver.step();
        expect(solver.stiffNStiff).to.eql(0);
        expect(solver.stiffNNonstiff).to.eql(0);
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
        expect(stats.nEval).to.eql(2);
        expect(stats.nSteps).to.eql(0);
        expect(stats.nStepsAccepted).to.eql(0);
        expect(stats.nStepsRejected).to.eql(0);
        expect(stats.stiffNNonstiff).to.eql(0);
        expect(stats.stiffNStiff).to.eql(0);
    });

    it('is all over the show after running', () => {
        solver.run(10);
        var stats = solver.statistics();
        expect(stats.nEval).to.eql(2090);
        expect(stats.nSteps).to.eql(348);
        expect(stats.nStepsAccepted).to.eql(340);
        expect(stats.nStepsRejected).to.eql(8);
        expect(stats.stiffNNonstiff).to.eql(0);
        expect(stats.stiffNStiff).to.eql(0);
    });
});