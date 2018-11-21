import {dopriControl, DopriControlParam} from "./control";
import * as dopri5 from "./dopri5/stepper";
import {interpolator} from "./interpolator";
import {History, Integrator, OutputFn, RhsFn, Stepper} from "./types";
import * as utils from "./utils";

// needed for ES5 - will be ~= Number.EPSILON in ES6
const DBL_EPSILON = Math.pow(2, -52); // = 2.220446049250313e-16
const STEP_FACTOR_MIN = 1e-4;

export function integrate(rhs: RhsFn, y: number[],
                          t0: number, t1: number,
                          control: Partial<DopriControlParam> = {},
                          output: OutputFn = null) {
    const solver = new Dopri(rhs, y.length, control, output);
    solver.initialise(t0, y);
    return solver.run(t1);
}

function integrationError(message: string, t: number) {
    return new Error(`Integration failure: ${message} at ${t}`);
}

export class Dopri implements Integrator {
    protected _stepper: Stepper;
    protected _history: History = [];

    private _control: DopriControlParam;
    private _output: OutputFn;
    private _t: number = 0.0;
    private _h: number = 0.0;

    // state
    private _nSteps: number = 0;
    private _nStepsAccepted: number = 0;
    private _nStepsRejected: number = 0;

    private _stiffNStiff: number = 0;
    private _stiffNNonstiff: number = 0;
    private _lastError: number = 0;

    constructor(rhs: RhsFn, n: number,
                control: Partial<DopriControlParam> = {},
                output: OutputFn = null) {
        this._stepper = new dopri5.Dopri5(rhs, n);
        this._control = dopriControl(control);
        this._output = output;
    }

    public initialise(t: number, y: number[]): Dopri {
        const n = this._stepper.n;
        if (y.length !== n) {
            throw Error(`Invalid size 'y' - expected a length ${n} array`);
        }
        this._stepper.reset(t, y);
        this._reset();
        this._h = initialStepSize(this._stepper, t, y,
                                  this._control.atol, this._control.rtol);
        this._t = t;
        this._history = [];
        return this;
    }

    public run(tEnd: number) {
        while (this._t < tEnd) {
            this._step();
            this._history.push(this._stepper.history.clone());
        }
        return interpolator(this._history.slice(0), this._stepper,
                            this._output);
    }

    public statistics() {
        return {
            lastError: this._lastError,
            nEval: this._stepper.nEval,
            nSteps: this._nSteps,
            nStepsAccepted: this._nStepsAccepted,
            nStepsRejected: this._nStepsRejected,
            stiffNNonstiff: this._stiffNNonstiff,
            stiffNStiff: this._stiffNStiff,
        };
    }

    private _reset() {
        this._nSteps = 0;
        this._nStepsAccepted = 0;
        this._nStepsRejected = 0;
        this._stiffNStiff = 0;
        this._stiffNNonstiff = 0;
        this._lastError = 0;
    }

    private _step() {
        const t = this._t;
        let h = this._h;
        let success = false;
        let reject = false;
        const facOld = Math.max(this._lastError, 1e-4);
        const stepControl = this._stepper.stepControl;

        while (!success) {
            if (this._nSteps > this._control.maxSteps) {
                throw integrationError("too many steps", t);
            }
            if (h < this._stepper.stepControl.sizeMin) {
                throw integrationError("step too small", t);
            }
            if (h <= Math.abs(t) * DBL_EPSILON) {
                throw integrationError("step size vanished", t);
            }

            // Carry out the step
            this._stepper.step(t, h);
            this._nSteps++;

            // Error estimation
            const err = this._stepper.error(this._control.atol,
                                            this._control.rtol);

            const fac11 = Math.pow(err, stepControl.constant);
            const facc1 = 1.0 / stepControl.factorMin;
            const facc2 = 1.0 / stepControl.factorMax;

            if (err <= 1) {
                success = true;
                this._nStepsAccepted++;

                if (this._isStiff(h)) {
                    throw integrationError("problem became stiff", t);
                }

                this._stepper.stepComplete(t, h);

                let fac = fac11 / Math.pow(facOld, stepControl.beta);
                fac = utils.constrain(fac / stepControl.factorSafe,
                                      facc2, facc1);
                const hNew = h / fac;

                this._t += h;
                this._h = reject ? Math.min(hNew, h) : hNew;
                this._lastError = err;
            } else {
                reject = true;
                if (this._nStepsAccepted >= 1) {
                    this._nStepsRejected++;
                }
                h /= Math.min(facc1, fac11 / stepControl.factorSafe);
            }
        }
        return this._t;
    }

    private _isStiff(h: number) {
        const check = this._stiffNStiff > 0 ||
            this._nStepsAccepted % this._control.stiffCheck === 0;
        if (check) {
            if (this._stepper.isStiff(h)) {
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
}

function initialStepSize(stepper: Stepper, t: number, y: number[],
                         atol: number, rtol: number) {
    const stepSizeMax = stepper.stepControl.sizeMax;
    // NOTE: This is destructive with respect to most of the information
    // in the object; in particular k2, k3 will be modified.
    const f0 = new Array<number>(stepper.n);
    const f1 = new Array<number>(stepper.n);
    const y1 = new Array<number>(stepper.n);

    // Compute a first guess for explicit Euler as
    //   h = 0.01 * norm (y0) / norm (f0)
    // the increment for explicit euler is small compared to the solution
    stepper.rhs(t, y, f0);
    stepper.nEval++;

    let normF = 0.0;
    let normY = 0.0;
    let i = 0;
    for (i = 0; i < stepper.n; ++i) {
        const sk = atol + rtol * Math.abs(y[i]);
        normF += utils.square(f0[i] / sk);
        normY += utils.square(y[i]  / sk);
    }
    let h = (normF <= 1e-10 || normY <= 1e-10) ?
        1e-6 : Math.sqrt(normY / normF) * 0.01;
    h = Math.min(h, stepSizeMax);

    // Perform an explicit Euler step
    for (i = 0; i < stepper.n; ++i) {
        y1[i] = y[i] + h * f0[i];
    }
    stepper.rhs(t + h, y1, f1);
    stepper.nEval++;

    // Estimate the second derivative of the solution:
    let der2 = 0.0;
    for (i = 0; i < stepper.n; ++i) {
        const sk = atol + rtol * Math.abs(y[i]);
        der2 += utils.square((f1[i] - f0[i]) / sk);
    }
    der2 = Math.sqrt(der2) / h;

    // Step size is computed such that
    //   h^order * max(norm(f0), norm(der2)) = 0.01
    const der12 = Math.max(Math.abs(der2), Math.sqrt(normF));
    const h1 = (der12 <= 1e-15) ?
        Math.max(1e-6, Math.abs(h) * 1e-3) :
        Math.pow(0.01 / der12, 1.0 / stepper.order);
    h = Math.min(Math.min(100 * Math.abs(h), h1), stepSizeMax);
    return h;
}
