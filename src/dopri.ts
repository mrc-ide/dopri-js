import * as types from "./types";
// until interface constructor is done
import * as dopri5 from "./dopri5";
import * as utils from "./utils";
import * as interpolator from "./interpolator";

// needed for ES5 - will be ~= Number.EPSILON in ES6
const DBL_EPSILON = 2**(-52); // = 2.220446049250313e-16
const STEP_FACTOR_MIN = 1e-4;

export function integrate(rhs: types.rhs_fn, y: number[],
                          t0: number, t1: number) {
    const solver = new dopri(rhs, y.length);
    solver.initialise(t0, y);
    return solver.run(t1);
}


export class dopri {
    constructor(rhs: types.rhs_fn, n: number) {
        this.stepper = new dopri5.dopri5(rhs, n);
        this.reset();
    }

    initialise(t: number, y: number[]) : dopri {
        this.stepper.reset(y);
        this.h = this.stepper.initial_step_size(t, this.atol, this.rtol);
        return this;
    }

    reset() {
        this.n_steps = 0;
        this.n_steps_accepted = 0;
        this.n_steps_rejected = 0;
        this.stiff_n_stiff = 0;
        this.stiff_n_nonstiff = 0;
        this.last_error = 0;
    }

    step() {
        var t = this.t, h = this.h;
        var success = false, reject = false;
        var fac_old = Math.max(this.last_error, 1e-4);
        let step_control = this.stepper.step_control;

        while (!success) {
            if (this.n_steps > this.max_steps) {
                throw "too many steps";
            }
            if (h < this.stepper.step_control.size_min) {
                throw "step too small";
            }
            if (h <= Math.abs(t) * DBL_EPSILON) {
                throw "step size vanished";
            }

            // Carry out the step
            this.stepper.step(t, h);
            this.n_steps++;

            // Error estimation
            let err = this.stepper.error(this.atol, this.rtol);

            let fac11 = Math.pow(err, step_control.constant);
            let facc1 = 1.0 / step_control.factor_min;
            let facc2 = 1.0 / step_control.factor_max;

            if (err <= 1) {
                success = true;
                this.n_steps_accepted++;

                if (this.is_stiff(h)) {
                    throw "Integration failure: problem became stiff";
                }

                this.stepper.step_complete(t, h);

                var fac = fac11 / fac_old**step_control.beta;
                fac = utils.constrain(fac / step_control.factor_safe,
                                      facc2, facc1)
                let h_new = h / fac;

                this.t += h
                // this.h = (reject && fac > 1) ? h else h / fac
                this.h = reject ? Math.min(h_new, h) : h_new;
                this.last_error = err;
            } else {
                reject = true;
                if (this.n_steps_accepted >= 1) {
                    this.n_steps_rejected++;
                }
                h /= Math.min(facc1, fac11 / step_control.factor_safe);
            }
        }
        return this.t;
    }

    is_stiff(h: number) {
        var ret = false;
        const check = this.stiff_n_stiff > 0 ||
            this.n_steps_accepted % this.stiff_check == 0;
        if (check) {
            if (this.stepper.is_stiff(h)) {
                this.stiff_n_nonstiff = 0;
                if (this.stiff_n_stiff++ >= 15) {
                    ret = true;
                }
            } else if (this.stiff_n_stiff > 0) {
                if (this.stiff_n_nonstiff++ >= 6) {
                    this.stiff_n_stiff = 0;
                }
            }
        }
        return ret;
    }

    run(t: number) {
        var ret = new interpolator.interpolator(this.stepper);
        while (this.t < t) {
            this.step();
            ret.add(this.stepper.history);
        }
        return (t: number[]) => ret.interpolate(t);
    }


    stepper: dopri5.dopri5;
    t: number = 0.0;
    h: number = 0.0;

    // state
    n_steps: number = 0;
    n_steps_accepted: number = 0;
    n_steps_rejected: number = 0;

    stiff_n_stiff: number = 0;
    stiff_n_nonstiff: number = 0;
    last_error: number = 0;

    // Stuff to tune
    max_steps: number = 10000;
    atol: number = 1e-6;
    rtol: number = 1e-6;
    stiff_check: number = 0;
}
