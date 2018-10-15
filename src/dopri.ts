import * as types from "./types";
// until interface constructor is done
import * as dopri5 from "./dopri5";
import * as utils from "./utils";

// needed for ES5 - will be ~= Number.EPSILON in ES6
const DBL_EPSILON = 2**(-52); // = 2.220446049250313e-16
const STEP_FACTOR_MIN = 1e-4;

export class dopri {
    constructor(rhs: types.rhs_fn, n: number) {
        this.stepper = new dopri5.dopri5(rhs, n);
    }

    initialise(t: number, y: number[]) : dopri {
        // why does both the the stepper and the integrator need to
        // know the time?
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
    }

    step() {
        var t = this.t, h = this.h;
        var success = false, reject = false;
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

            if (err <= 1) {
                success = true;
                this.n_steps_accepted++;
                // TODO: Add stiffness check here.

                this.stepper.step_complete(t, h);

                let h_new = this.next_step_size(h, err);

                this.t += h
                this.h = reject ? Math.min(h_new, h) : h_new;
            } else {
                reject = true;
                let step_control = this.stepper.step_control;
                let fac11 = Math.pow(err, step_control.constant);
                let h_new = h / Math.min(1 / step_control.factor_min,
                                         fac11 / step_control.factor_safe);
                if (this.n_steps_accepted >= 1) {
                    this.n_steps_rejected++;
                }
                h = h_new;
            }
        }
        return this.t;
    }

    // This section really needs comparison with the original Fortran;
    next_step_size(h: number, err: number) : number {
        let fac_old = Math.max(err, STEP_FACTOR_MIN);
        let step_control = this.stepper.step_control;
        let fac11 = Math.pow(err, step_control.constant);
        // Lund-stabilisation
        var fac = fac11 / Math.pow(fac_old, step_control.beta);
        fac = utils.constrain(fac / step_control.factor_safe,
                              1.0 / step_control.factor_max,
                              1.0 / step_control.factor_min)
        let h_new = h / fac;
        return Math.min(h_new, step_control.size_max);
    }

    stepper: dopri5.dopri5;
    t: number = 0.0;
    h: number = 0.0;

    // state
    n_steps: number = 0;
    n_steps_accepted: number = 0;
    n_steps_rejected: number = 0;

    stiff_check: number  = 0;
    stiff_n_stiff: number = 0;
    stiff_n_nonstiff: number = 0;

    // Stuff to tune
    max_steps: number = 10000;
    atol: number = 1e-6;
    rtol: number = 1e-6;
}
