import * as types from "./types";
import * as utils from "./utils";

// Heaps of constants!
const C2 = 0.2;
const C3 = 0.3;
const C4 = 0.8;
const C5 = 8.0 / 9.0;
const A21 = 0.2;
const A31 = 3.0 / 40.0;
const A32 = 9.0 / 40.0;
const A41 = 44.0 / 45.0;
const A42 = -56.0 / 15.0;
const A43 = 32.0 / 9.0;
const A51 = 19372.0 / 6561.0;
const A52 = -25360.0 / 2187.0;
const A53 = 64448.0 / 6561.0;
const A54 = -212.0 / 729.0;
const A61 = 9017.0 / 3168.0;
const A62 = -355.0 / 33.0;
const A63 = 46732.0 / 5247.0;
const A64 = 49.0 / 176.0;
const A65 = -5103.0 / 18656.0;
const A71 = 35.0 / 384.0;
const A73 = 500.0 / 1113.0;
const A74 = 125.0 / 192.0;
const A75 = -2187.0 / 6784.0;
const A76 = 11.0 / 84.0;
const E1 = 71.0 / 57600.0;
const E3 = -71.0 / 16695.0;
const E4 = 71.0 / 1920.0;
const E5 = -17253.0 / 339200.0;
const E6 = 22.0 / 525.0;
const E7 = -1.0 / 40.0;
// ---- DENSE OUTPUT OF SHAMPINE (1986)
const D1 = -12715105075.0 / 11282082432.0;
const D3 = 87487479700.0 / 32700410799.0;
const D4 = -10690763975.0 / 1880347072.0;
const D5 = 701980252875.0 / 199316789632.0;
const D6 = -1453857185.0 / 822651844.0;
const D7 = 69997945.0 / 29380423.0;


export class dopri5_step_control implements types.dopri_step_control {
    // Essentially unlimited step size
    readonly size_min = 1e-8; // should be Number.EPSILON, really
    readonly size_max = Number.MAX_VALUE;
    // For scaling during adaptive stepping
    readonly factor_safe = 0.9;
    readonly factor_min = 0.2;  // from dopri5.f:276, retard.f:328
    readonly factor_max = 10.0; // from dopri5.f:281, retard.f:333
    readonly beta = 0.04;
    readonly constant = 0.2 - this.beta * 0.75;
}


// This is what we actually want
export class dopri5 implements types.stepper {
    constructor(rhs: types.rhs_fn, n: number) {
        this.rhs = rhs
        this.n = n;

        this.y = new Array<number>(n);
        this.y_next = new Array<number>(n);
        this.y_stiff = new Array<number>(n);
        this.k1 = new Array<number>(n);
        this.k2 = new Array<number>(n);
        this.k3 = new Array<number>(n);
        this.k4 = new Array<number>(n);
        this.k5 = new Array<number>(n);
        this.k6 = new Array<number>(n);
        this.history = new Array<number>(this.order * n + 2);
    }

    // This is the ugliest function - quite a lot goes on in here to
    // do the full step
    step(t: number, h: number) : void {
        const n = this.n;

        let y = this.y;
        let y1 = this.y_next;
        let k1 = this.k1;
        let k2 = this.k2;
        let k3 = this.k3;
        let k4 = this.k4;
        let k5 = this.k5;
        let k6 = this.k6;
        let history = this.history;

        var i = 0;
        for (i = 0; i < n; ++i) { // 22
            y1[i] = y[i] + h * A21 * k1[i];
        }
        this.rhs(t + C2 * h, y1, k2);
        for (i = 0; i < n; ++i) { // 23
            y1[i] = y[i] + h * (A31 * k1[i] + A32 * k2[i]);
        }
        this.rhs(t + C3 * h, y1, k3);
        for (i = 0; i < n; ++i) { // 24
            y1[i] = y[i] + h * (A41 * k1[i] + A42 * k2[i] + A43 * k3[i]);
        }
        this.rhs(t + C4 * h, y1, k4);
        for (i = 0; i < n; ++i) { // 25
            y1[i] = y[i] + h * (A51 * k1[i] + A52 * k2[i] + A53 * k3[i] +
                                A54 * k4[i]);
        }
        this.rhs(t + C5 * h, y1, k5);
        for (i = 0; i < n; ++i) { // 26
            this.y_stiff[i] = y[i] + h * (A61 * k1[i] + A62 * k2[i] +
                                          A63 * k3[i] + A64 * k4[i] +
                                          A65 * k5[i]);
        }
        const t_next = t + h;
        this.rhs(t_next, this.y_stiff, k6);
        for (i = 0; i < n; ++i) { // 27
            y1[i] = y[i] + h * (A71 * k1[i] + A73 * k3[i] + A74 * k4[i] +
                                A75 * k5[i] + A76 * k6[i]);
        }
        this.rhs(t_next, y1, k2);

        var j = 4 * n;
        for (i = 0; i < n; ++i) {
            history[j++] = h * (D1 * k1[i] + D3 * k3[i] + D4 * k4[i] +
                                D5 * k5[i] + D6 * k6[i] + D7 * k2[i]);
        }

        for (i = 0; i < n; ++i) {
            k4[i] = h * (E1 * k1[i] + E3 * k3[i] + E4 * k4[i] +
                         E5 * k5[i] + E6 * k6[i] + E7 * k2[i]);
        }
        this.n_eval += 6;
        this.t = t;
        this.h = h;
    }

    save_history() : void {
        let history = this.history;
        const n = this.n;
        for (var i = 0; i < n; ++i) {
            let ydiff = this.y_next[i] - this.y[i];
            let bspl = this.h * this.k1[i] - ydiff;
            history[             i] = this.y[i];
            history[    n + i] = ydiff;
            history[2 * n + i] = bspl;
            history[3 * n + i] = -this.h * this.k2[i] + ydiff - bspl;
        }
        history[this.order * n    ] = this.t;
        history[this.order * n + 1] = this.h;
    }

    error(atol: number, rtol : number) : number {
        var err = 0.0;
        var i = 0;
        for (i = 0; i < this.n; ++i) {
            let sk = atol + rtol *
                Math.max(Math.abs(this.y[i]), Math.abs(this.y_next[i]));
            err += utils.square(this.k4[i] / sk);
        }
        return Math.sqrt(err / this.n);
    }

    interpolate(t: number) : number[] {
        let theta = (t - this.t) / this.h;
        let theta1 = 1 - theta;
        const n = this.n;

        var ret = new Array<number>(n);
        for (var i = 0; i < n; ++i) {
            ret[i] =
                this.history[i] + theta *
                (this.history[n + i] + theta1 *
                 (this.history[2 * n + i] + theta *
                  (this.history[3 * n + i] + theta1 *
                   this.history[4 * n + i])));
        }
        return ret;
    }

    is_stiff() : boolean {
        var stnum = 0.0, stden = 0.0;
        for (var i = 0; i < this.n; ++i) {
            stnum += utils.square(this.k2[i] - this.k6[i]);
            stden += utils.square(this.y_next[i] - this.y_stiff[i]);
        }
        return stden > 0 && Math.abs(this.h) * Math.sqrt(stnum / stden) > 3.25;
    }

    initial_step_size(atol: number, rtol: number) : number {
        const step_size_max = this.step_control.size_max;
        // NOTE: This is destructive with respect to most of the information
        // in the dataect; in particular k2, k3 will be modified.
        var f0 = this.k1, f1 = this.k2, y1 = this.k3;

        // Compute a first guess for explicit Euler as
        //   h = 0.01 * norm (y0) / norm (f0)
        // the increment for explicit euler is small compared to the solution
        var norm_f = 0.0, norm_y = 0.0, i = 0;
        for (i = 0; i < this.n; ++i) {
            let sk = atol + rtol * Math.abs(this.y[i]);
            norm_f += utils.square(f0[i] / sk);
            norm_y += utils.square(this.y[i]  / sk);
        }
        var h = (norm_f <= 1e-10 || norm_f <= 1e-10) ?
            1e-6 : Math.sqrt(norm_y / norm_f) * 0.01;
        h = Math.min(h, step_size_max);

        // Perform an explicit Euler step
        for (i = 0; i < this.n; ++i) {
            y1[i] = this.y[i] + h * f0[i];
        }
        this.rhs(this.t + h, y1, f1);
        this.n_eval++;

        // Estimate the second derivative of the solution:
        var der2 = 0.0;
        for (i = 0; i < this.n; ++i) {
            let sk = atol + rtol * Math.abs(this.y[i]);
            der2 += utils.square((f1[i] - f0[i]) / sk);
        }
        der2 = Math.sqrt(der2) / h;

        // Step size is computed such that
        //   h^order * Math.max(norm(f0), norm(der2)) = 0.01
        var der12 = Math.max(Math.abs(der2), Math.sqrt(norm_f));
        var h1 = (der12 <= 1e-15) ?
            Math.max(1e-6, Math.abs(h) * 1e-3) :
            Math.pow(0.01 / der12, 1.0 / this.order);
        h = Math.min(Math.min(100 * Math.abs(h), h1), step_size_max);
        return h;
    }

    reset(y: number[]): void {
        this.t = 0;
        this.h = 0;
        this.n_eval = 0;
        for (var i = 0; i < this.n; ++i) {
            this.y[i] = y[i];
        }
    }

    readonly rhs: types.rhs_fn;
    readonly n: number;
    readonly order: number = 5;
    readonly step_control = new dopri5_step_control;

    // The variables at the beginning of the step
    y: number[];
    // The variables at the end of the step
    y_next: number[];
    // Array used for detecting stiffness
    y_stiff: number[];

    // Work arrays:
    k1: number[];
    k2: number[];
    k3: number[];
    k4: number[];
    k5: number[];
    k6: number[];

    history: number[];

    // Last step size and origin
    t: number = 0.0;
    h: number = 0;

    n_eval: number = 0;
};
