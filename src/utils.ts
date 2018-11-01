import * as fs from "fs";

const SQRT_DBL_EPSILON = Math.pow(2, -52 / 2);

export function square(x: number): number {
    return x * x;
}

// constrain x to lie in [min, max]
export function constrain(x: number, min: number, max: number): number {
    return Math.max(Math.min(x, max), min);
}

export function copyArray(to: number[], from: number[]): void {
    const n = to.length;
    for (let i = 0; i < n; i++) {
        to[i] = from[i];
    }
}

export function zeros(n: number): number[] {
    const ret = Array<number>(n);
    for (let i = 0; i < n; ++i) {
        ret[i] = 0.0;
    }
    return ret;
}

export function approxEqual(x: number, y: number,
                            tolerance = SQRT_DBL_EPSILON) {
    let xy = Math.abs(x - y);
    const xn = Math.abs(x);
    if (xn > tolerance) {
        xy /= xn;
    }
    return xy < tolerance;
}

export function approxEqualArray(x: number[], y: number[],
                                 tolerance = SQRT_DBL_EPSILON) {
    if (y.length !== x.length) {
        throw Error("Incompatible arrays");
    }
    let scale = 0;
    let xy = 0;
    let n = 0;
    for (let i = 0; i < x.length; ++i) {
        if (x[i] !== y[i]) {
            scale += Math.abs(x[i]);
            xy += Math.abs(x[i] - y[i]);
            n++;
        }
    }
    if (n === 0) {
        return true;
    }

    scale /= n;
    xy /= n;

    if (scale > tolerance) {
        xy /= scale;
    }
    return xy < tolerance;
}

export function seqLen(a: number, b: number, len: number): number[] {
    const d = (a - b) / (len - 1);
    const ret = [];
    for (let i = 0; i < len; ++i) {
        const p = i / (len - 1);
        ret.push((1 - p) * a + p * b);
    }
    return ret;
}

export function last<T>(x: T[]): T {
    return x[x.length - 1];
}
