import {dopriControl, DopriControlParam} from "./control";
import * as dopri5 from "./dopri5/stepper";
import {interpolator} from "./interpolator";
import {History, Integrator, OutputFn, RhsFn, Stepper} from "./types";
import * as utils from "./utils";

// needed for ES5 - will be ~= Number.EPSILON in ES6
const DBL_EPSILON = Math.pow(2, -52); // = 2.220446049250313e-16
const STEP_FACTOR_MIN = 1e-4;

/**
 * High-level convenience interface. Use this to create an integrator
 * and immediately use it once to solve a system over some time range.
 *
 * @param rhs The right hand side function to integrate
 *
 * @param y The initial conditions for the system
 *
 * @param t0 The start time of the integration
 *
 * @param t1 The end time of the integration
 *
 * @param control Optional control parameters to tune the integration
 *
 * @param output Optional output function, to compute additional
 * quantities related to the integration alongside the solution
 */
export function integrateDopri(rhs: RhsFn, y: number[],
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

/**
 * Basic Dormand–Prince integrator class for solving ordinary
 * differential equations. For delay differential equations, see
 * {@link DDE}.
 *
 * @example
 * ```typescript
 * function lorenz(t: number, y: number[], dydt: number[]) {
 *     const y1 = y[0];
 *     const y2 = y[1];
 *     const y3 = y[2];
 *     dydt[0] = 10 * (y2 - y1);
 *     dydt[1] = 28 * y1 - y2 - y1 * y3;
 *     dydt[2] = -8 / 3 * y3 + y1 * y2;
 * };
 *
 * const solver = new Dopri(lorenz, 3);
 * solver.initialise(0, [10, 1, 1]);
 * const solution = solver.run(10);
 * const t = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10];
 * const y = solution(t);
 * ```
 */
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

    /**
     * @param rhs The right hand side function to be integrated
     *
     * @param n The number of variables in the system to be integrated
     *
     * @param control Optional control parameters to tune the integration
     *
     * @param output Optional output function, to compute additional
     * quantities related to the integration alongside the solution
     */
    constructor(rhs: RhsFn, n: number,
                control: Partial<DopriControlParam> = {},
                output: OutputFn = null) {
        this._stepper = new dopri5.Dopri5(rhs, n);
        this._control = dopriControl(control);
        this._output = output;
    }

    /**
     * Initialise the solver
     *
     * @param t The time to start integrating from
     *
     * @param y The initial conditions
     */
    public initialise(t: number, y: number[]): Dopri {
        const n = this._stepper.n;
        if (y.length !== n) {
            throw Error(`Invalid size 'y' - expected a length ${n} array`);
        }
        this._stepper.reset(t, y);
        this._reset();
        this._h = initialStepSize(this._stepper, t, y,
                                  this._control.atol, this._control.rtol,
                                  this._control.stepSizeMax);
        this._t = t;
        this._history = [];
        return this;
    }

    /**
     * Integrate the solution through to some time
     *
     * @param tEnd End time of the integration
     */
    public run(tEnd: number) {
        while (this._t < tEnd) {
            this._step();
            this._history.push(this._stepper.history.clone());
        }
        return interpolator(this._history.slice(0), this._stepper,
                            this._output);
    }

    /**
     * Return statistics about the integration so far
     */
    public statistics() {
        return {
            /** The last estimated error in the solution */
            lastError: this._lastError,
            /** The number of evaluations of the rhs function */
            nEval: this._stepper.nEval,
            /** The number of steps attempted */
            nSteps: this._nSteps,
            /** The number of steps accepted */
            nStepsAccepted: this._nStepsAccepted,
            /** The number of steps rejected */
            nStepsRejected: this._nStepsRejected,
            /** The number of stiff checks that were non-stiff */
            stiffNNonstiff: this._stiffNNonstiff,
            /** The number of stiff checks that were stiff */
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
        const control = this._control;
        const tcrit = control.tcrit;
        let tcritIdx = 0;
        let tcritNext = tcrit.length <= tcritIdx ? Infinity : tcrit[tcritIdx];

        while (!success) {
            let forceThisStep = false;
            if (this._nSteps > control.maxSteps) {
                throw integrationError("too many steps", t);
            }
            if (h < control.stepSizeMin) {
                if (control.stepSizeMinAllow) {
                    h = control.stepSizeMin;
                    forceThisStep = true;
                } else {
                    throw integrationError("step too small", t);
                }
            }
            if (h <= Math.abs(t) * DBL_EPSILON) {
                throw integrationError("step size vanished", t);
            }
            if (t >= tcritNext) {
                tcritIdx++;
                tcritNext = tcrit.length <= tcritIdx ? Infinity : tcrit[tcritIdx];
            }
            if (t + h > tcritNext) {
                h = tcritNext - t;
            }

            // Carry out the step
            this._stepper.step(t, h);
            this._nSteps++;

            // Error estimation
            const err = this._stepper.error(control.atol, control.rtol);

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
                if (reject) {
                    this._h = Math.min(hNew, h);
                } else {
                    this._h = Math.min(hNew, control.stepSizeMax);
                }
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
                         atol: number, rtol: number, stepSizeMax: number) {
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
