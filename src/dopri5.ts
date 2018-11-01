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

class Dopri5StepControl implements types.DopriStepControl {
    // Essentially unlimited step size
    public readonly sizeMin = 1e-8; // should be Number.EPSILON, really
    public readonly sizeMax = Number.MAX_VALUE;
    // For scaling during adaptive stepping
    public readonly factorSafe = 0.9;
    public readonly factorMin = 0.2;  // from dopri5.f:276, retard.f:328
    public readonly factorMax = 10.0; // from dopri5.f:281, retard.f:333
    public readonly beta = 0.04;
    public readonly constant = 0.2 - this.beta * 0.75;
}

// This is what we actually want
export class Dopri5 implements types.Stepper {
    public readonly rhs: types.RhsFn;
    public readonly n: number;
    public readonly order: number = 5;
    public readonly stepControl = new Dopri5StepControl();

    // The variables at the beginning of the step
    public y: number[];
    // The variables at the end of the step
    public yNext: number[];
    // Array used for detecting stiffness
    public yStiff: number[];

    // Work arrays:
    public k1: number[];
    public k2: number[];
    public k3: number[];
    public k4: number[];
    public k5: number[];
    public k6: number[];

    public history: number[];

    public nEval: number = 0;

    constructor(rhs: types.RhsFn, n: number) {
        this.rhs = rhs;
        this.n = n;

        this.y = new Array<number>(n);
        this.yNext = new Array<number>(n);
        this.yStiff = new Array<number>(n);
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
    public step(t: number, h: number): void {
        const n = this.n;

        const y = this.y;
        const yNext = this.yNext;
        const k1 = this.k1;
        const k2 = this.k2;
        const k3 = this.k3;
        const k4 = this.k4;
        const k5 = this.k5;
        const k6 = this.k6;
        const history = this.history;

        let i = 0;
        for (i = 0; i < n; ++i) { // 22
            yNext[i] = y[i] + h * A21 * k1[i];
        }
        this.rhs(t + C2 * h, yNext, k2);
        for (i = 0; i < n; ++i) { // 23
            yNext[i] = y[i] + h * (A31 * k1[i] + A32 * k2[i]);
        }
        this.rhs(t + C3 * h, yNext, k3);
        for (i = 0; i < n; ++i) { // 24
            yNext[i] = y[i] + h * (A41 * k1[i] + A42 * k2[i] + A43 * k3[i]);
        }
        this.rhs(t + C4 * h, yNext, k4);
        for (i = 0; i < n; ++i) { // 25
            yNext[i] = y[i] + h * (A51 * k1[i] + A52 * k2[i] + A53 * k3[i] +
                                    A54 * k4[i]);
        }
        this.rhs(t + C5 * h, yNext, k5);
        for (i = 0; i < n; ++i) { // 26
            this.yStiff[i] = y[i] + h * (A61 * k1[i] + A62 * k2[i] +
                                          A63 * k3[i] + A64 * k4[i] +
                                          A65 * k5[i]);
        }
        const tNext = t + h;
        this.rhs(tNext, this.yStiff, k6);
        for (i = 0; i < n; ++i) { // 27
            yNext[i] = y[i] + h * (A71 * k1[i] + A73 * k3[i] + A74 * k4[i] +
                                    A75 * k5[i] + A76 * k6[i]);
        }
        this.rhs(tNext, yNext, k2);

        let j = 4 * n;
        for (i = 0; i < n; ++i) {
            history[j++] = h * (D1 * k1[i] + D3 * k3[i] + D4 * k4[i] +
                                D5 * k5[i] + D6 * k6[i] + D7 * k2[i]);
        }

        for (i = 0; i < n; ++i) {
            k4[i] = h * (E1 * k1[i] + E3 * k3[i] + E4 * k4[i] +
                         E5 * k5[i] + E6 * k6[i] + E7 * k2[i]);
        }
        this.nEval += 6;
    }

    public stepComplete(t: number, h: number): void {
        this.saveHistory(t, h);
        utils.copyArray(this.k1, this.k2);   // k1 <== k2
        utils.copyArray(this.y, this.yNext); // y  <== yNext
    }

    public saveHistory(t: number, h: number): void {
        const history = this.history;
        const n = this.n;
        for (let i = 0; i < n; ++i) {
            const ydiff = this.yNext[i] - this.y[i];
            const bspl = h * this.k1[i] - ydiff;
            history[        i] = this.y[i];
            history[    n + i] = ydiff;
            history[2 * n + i] = bspl;
            history[3 * n + i] = -h * this.k2[i] + ydiff - bspl;
        }
        history[this.order * n    ] = t;
        history[this.order * n + 1] = h;
    }

    public error(atol: number, rtol: number): number {
        let err = 0.0;
        let i = 0;
        for (i = 0; i < this.n; ++i) {
            const sk = atol + rtol *
                Math.max(Math.abs(this.y[i]), Math.abs(this.yNext[i]));
            err += utils.square(this.k4[i] / sk);
        }
        return Math.sqrt(err / this.n);
    }

    // It might be worth doing an optional argument history and then
    // pulling in this.history if it's not present
    public interpolate(t: number, history: number[]): number[] {
        const n = this.n;
        const tStep = history[this.order * n    ];
        const hStep = history[this.order * n + 1];
        const theta = (t - tStep) / hStep;
        const theta1 = 1 - theta;

        const ret = new Array<number>(n);
        for (let i = 0; i < n; ++i) {
            ret[i] =
                history[i] + theta *
                (history[n + i] + theta1 *
                 (history[2 * n + i] + theta *
                  (history[3 * n + i] + theta1 *
                   history[4 * n + i])));
        }
        return ret;
    }

    public isStiff(h: number): boolean {
        let stnum = 0.0;
        let stden = 0.0;
        for (let i = 0; i < this.n; ++i) {
            stnum += utils.square(this.k2[i] - this.k6[i]);
            stden += utils.square(this.yNext[i] - this.yStiff[i]);
        }
        return stden > 0 && Math.abs(h) * Math.sqrt(stnum / stden) > 3.25;
    }

    public initialStepSize(t: number, atol: number, rtol: number): number {
        const stepSizeMax = this.stepControl.sizeMax;
        // NOTE: This is destructive with respect to most of the information
        // in the dataect; in particular k2, k3 will be modified.
        const f0 = this.k1;
        const f1 = this.k2;
        const y1 = this.k3;

        // Compute a first guess for explicit Euler as
        //   h = 0.01 * norm (y0) / norm (f0)
        // the increment for explicit euler is small compared to the solution
        this.rhs(t, this.y, f0);
        this.nEval++;

        let normF = 0.0;
        let normY = 0.0;
        let i = 0;
        for (i = 0; i < this.n; ++i) {
            const sk = atol + rtol * Math.abs(this.y[i]);
            normF += utils.square(f0[i] / sk);
            normY += utils.square(this.y[i]  / sk);
        }
        let h = (normF <= 1e-10 || normF <= 1e-10) ?
            1e-6 : Math.sqrt(normY / normF) * 0.01;
        h = Math.min(h, stepSizeMax);

        // Perform an explicit Euler step
        for (i = 0; i < this.n; ++i) {
            y1[i] = this.y[i] + h * f0[i];
        }
        this.rhs(t + h, y1, f1);
        this.nEval++;

        // Estimate the second derivative of the solution:
        let der2 = 0.0;
        for (i = 0; i < this.n; ++i) {
            const sk = atol + rtol * Math.abs(this.y[i]);
            der2 += utils.square((f1[i] - f0[i]) / sk);
        }
        der2 = Math.sqrt(der2) / h;

        // Step size is computed such that
        //   h^order * max(norm(f0), norm(der2)) = 0.01
        const der12 = Math.max(Math.abs(der2), Math.sqrt(normF));
        const h1 = (der12 <= 1e-15) ?
            Math.max(1e-6, Math.abs(h) * 1e-3) :
            Math.pow(0.01 / der12, 1.0 / this.order);
        h = Math.min(Math.min(100 * Math.abs(h), h1), stepSizeMax);
        return h;
    }

    public reset(y: number[]): void {
        this.nEval = 0;
        for (let i = 0; i < this.n; ++i) {
            this.y[i] = y[i];
        }
        this.nEval = 0;
    }
}
