import * as dopri5 from "./dopri5";
import * as interpolator from "./interpolator";
import * as types from "./types";
import * as utils from "./utils";

// needed for ES5 - will be ~= Number.EPSILON in ES6
const DBL_EPSILON = Math.pow(2, -52); // = 2.220446049250313e-16
const STEP_FACTOR_MIN = 1e-4;

export function integrate(rhs: types.RhsFn, y: number[],
                          t0: number, t1: number) {
    const solver = new Dopri(rhs, y.length);
    solver.initialise(t0, y);
    return solver.run(t1);
}

function integrationError(message: string, t: number) {
    return new Error(`Integration failure: ${message} at ${t}`);
}

export class Dopri {
    // public stepper: types.Stepper;
    public stepper: dopri5.Dopri5;
    public t: number = 0.0;
    public h: number = 0.0;

    // state
    public nSteps: number = 0;
    public nStepsAccepted: number = 0;
    public nStepsRejected: number = 0;

    public stiffNStiff: number = 0;
    public stiffNNonstiff: number = 0;
    public lastError: number = 0;

    // Stuff to tune
    public maxSteps: number = 10000;
    public atol: number = 1e-6;
    public rtol: number = 1e-6;
    public stiffCheck: number = 0;

    constructor(rhs: types.RhsFn, n: number) {
        this.stepper = new dopri5.Dopri5(rhs, n);
        this.reset();
    }

    public initialise(t: number, y: number[]): Dopri {
        this.stepper.reset(y);
        this.h = this.stepper.initialStepSize(t, this.atol, this.rtol);
        this.t = t;
        return this;
    }

    public reset() {
        this.nSteps = 0;
        this.nStepsAccepted = 0;
        this.nStepsRejected = 0;
        this.stiffNStiff = 0;
        this.stiffNNonstiff = 0;
        this.lastError = 0;
    }

    public step() {
        const t = this.t;
        let h = this.h;
        let success = false;
        let reject = false;
        const facOld = Math.max(this.lastError, 1e-4);
        const stepControl = this.stepper.stepControl;

        while (!success) {
            if (this.nSteps > this.maxSteps) {
                throw integrationError("too many steps", t);
            }
            if (h < this.stepper.stepControl.sizeMin) {
                throw integrationError("step too small", t);
            }
            if (h <= Math.abs(t) * DBL_EPSILON) {
                throw integrationError("step size vanished", t);
            }

            // Carry out the step
            this.stepper.step(t, h);
            this.nSteps++;

            // Error estimation
            const err = this.stepper.error(this.atol, this.rtol);

            const fac11 = Math.pow(err, stepControl.constant);
            const facc1 = 1.0 / stepControl.factorMin;
            const facc2 = 1.0 / stepControl.factorMax;

            if (err <= 1) {
                success = true;
                this.nStepsAccepted++;

                if (this.isStiff(h)) {
                    throw integrationError("problem became stiff", t);
                }

                this.stepper.stepComplete(t, h);

                let fac = fac11 / Math.pow(facOld, stepControl.beta);
                fac = utils.constrain(fac / stepControl.factorSafe,
                                      facc2, facc1);
                const hNew = h / fac;

                this.t += h;
                // this.h = (reject && fac > 1) ? h else h / fac
                this.h = reject ? Math.min(hNew, h) : hNew;
                this.lastError = err;
            } else {
                reject = true;
                if (this.nStepsAccepted >= 1) {
                    this.nStepsRejected++;
                }
                h /= Math.min(facc1, fac11 / stepControl.factorSafe);
            }
        }
        return this.t;
    }

    public isStiff(h: number) {
        const check = this.stiffNStiff > 0 ||
            this.nStepsAccepted % this.stiffCheck === 0;
        if (check) {
            if (this.stepper.isStiff(h)) {
                this.stiffNNonstiff = 0;
                if (this.stiffNStiff++ >= 15) {
                    return true;
                }
            } else if (this.stiffNStiff > 0) {
                if (this.stiffNNonstiff++ >= 6) {
                    this.stiffNStiff = 0;
                    this.stiffNNonstiff = 0;
                }
            }
        }
        return false;
    }

    public run(tEnd: number) {
        const ret = new interpolator.Interpolator(this.stepper);
        while (this.t < tEnd) {
            this.step();
            ret.add(this.stepper.history);
        }
        return (t: number[]) => ret.interpolate(t);
    }
}
