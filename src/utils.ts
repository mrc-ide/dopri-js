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

// See richfitz/ring:inst/include/ring/ring.c - this is closely based
// off of this; that code was written for the same purpose.
//
// For the integration this is the problem.  We are looking for some
// history element that has a time that is at most the start time of
// our target time (i.e., element <= target).  If no element satisfies
// this, then we return -1
//
// Consider first an array of numbers.  Here we have a comparison
// function
//
//   compare = (el: number): boolean => el > target
//
// We'll have input like the following
//
//   [0, 1, 2, 3]
//
// for a target of 1.5 we're looking for '1' here as the last element
// smaller than this.
//
//   compare(0) => false
//   compare(3) => true
export function search<T>(x: T[], compare: (el: T) => boolean): number {
    let i0 = 0;
    let i1 = x.length - 1;

    if (x.length === 0 || compare(x[i0])) {
        return -1;
    }
    if (!compare(x[i1])) {
        // I'm not sure here if this should be x.length or i1
        return i1;
    }

    // from this point, we will always have:
    //
    //   compare(x[i0]) => false
    //   compare(x[i1]) => true
    while (i1 - i0 > 1) {
        const i2 = Math.floor((i0 + i1) / 2);
        if (compare(x[i2])) {
            i1 = i2;
        } else {
            i0 = i2;
        }
    }

    return i0;
}
