import * as dopri5 from "./dopri5/stepper";
import * as interpolator from "./interpolator";
import {Integrator, RhsFn, Stepper} from "./types";
import {dopriControl, DopriControl} from "./control";
import * as utils from "./utils";

// needed for ES5 - will be ~= Number.EPSILON in ES6
const DBL_EPSILON = Math.pow(2, -52); // = 2.220446049250313e-16
const STEP_FACTOR_MIN = 1e-4;

export function integrate(rhs: RhsFn, y: number[],
                          t0: number, t1: number) {
    const solver = new Dopri(rhs, y.length);
    solver.initialise(t0, y);
    return solver.run(t1);
}

function integrationError(message: string, t: number) {
    return new Error(`Integration failure: ${message} at ${t}`);
}

export class Dopri implements Integrator {
    public stepper: Stepper;
    public t: number = 0.0;
    public h: number = 0.0;

    public readonly control: DopriControl;

    // state
    private _nSteps: number = 0;
    private _nStepsAccepted: number = 0;
    private _nStepsRejected: number = 0;

    private _stiffNStiff: number = 0;
    private _stiffNNonstiff: number = 0;
    private _lastError: number = 0;

    constructor(rhs: RhsFn, n: number, control = dopriControl({})) {
        this.stepper = new dopri5.Dopri5(rhs, n);
        this.control = control;
    }

    public initialise(t: number, y: number[]): Dopri {
        const n = this.stepper.n;
        if (y.length !== n) {
            throw Error(`Invalid size 'y' - expected a length ${n} array`);
        }
        this.stepper.reset(y);
        this.reset();
        this.h = this.stepper.initialStepSize(t, this.control.atol,
                                              this.control.rtol);
        this.t = t;
        return this;
    }

    public reset() {
        this._nSteps = 0;
        this._nStepsAccepted = 0;
        this._nStepsRejected = 0;
        this._stiffNStiff = 0;
        this._stiffNNonstiff = 0;
        this._lastError = 0;
    }

    public step() {
        const t = this.t;
        let h = this.h;
        let success = false;
        let reject = false;
        const facOld = Math.max(this._lastError, 1e-4);
        const stepControl = this.stepper.stepControl;

        while (!success) {
            if (this._nSteps > this.control.maxSteps) {
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
            this._nSteps++;

            // Error estimation
            const err = this.stepper.error(this.control.atol,
                                           this.control.rtol);

            const fac11 = Math.pow(err, stepControl.constant);
            const facc1 = 1.0 / stepControl.factorMin;
            const facc2 = 1.0 / stepControl.factorMax;

            if (err <= 1) {
                success = true;
                this._nStepsAccepted++;

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
                this._lastError = err;
            } else {
                reject = true;
                if (this._nStepsAccepted >= 1) {
                    this._nStepsRejected++;
                }
                h /= Math.min(facc1, fac11 / stepControl.factorSafe);
            }
        }
        return this.t;
    }

    public isStiff(h: number) {
        const check = this._stiffNStiff > 0 ||
            this._nStepsAccepted % this.control.stiffCheck === 0;
        if (check) {
            if (this.stepper.isStiff(h)) {
                this._stiffNNonstiff = 0;
                if (this._stiffNStiff++ >= 15) {
                    return true;
                }
            } else if (this._stiffNStiff > 0) {
                if (this._stiffNNonstiff++ >= 6) {
                    this._stiffNStiff = 0;
                    this._stiffNNonstiff = 0;
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

    public statistics() {
        return {
            lastError: this._lastError,
            nEval: this.stepper.nEval,
            nSteps: this._nSteps,
            nStepsAccepted: this._nStepsAccepted,
            nStepsRejected: this._nStepsRejected,
            stiffNNonstiff: this._stiffNNonstiff,
            stiffNStiff: this._stiffNStiff,
        };
    }
}
