import * as fs from "fs";

const SQRT_DBL_EPSILON = Math.sqrt(2**(-52));

export function square(x: number) : number{
    return x * x;
}


export function constrain(x: number, min: number, max: number) : number {
    return Math.max(Math.min(x, max), min);
}


export function copy_array(to: number[], from: number[]) : void {
    const n = to.length;
    for (var i = 0; i < n; i++) {
        to[i] = from[i];
    }
}


export function zeros(n: number) : number[] {
    const ret = Array<number>(n);
    for (var i = 0; i < n; ++i) {
        ret[i] = 0.0;
    }
    return ret;
}


// need to install node types for this to work...
export function write_csv(arr: Array<number[]>, path: string) : void {
    var str = arr.map(x => x.join(',') + '\n').join('');
    fs.writeFile(path, str, function(err) {
        if(err) {
            return console.log(err);
        }
    });
}


export function approx_equal(x: number, y: number,
                             tolerance = SQRT_DBL_EPSILON) {
    var xy = Math.abs(x - y);
    const xn = Math.abs(x);
    if (xn > tolerance) {
        xy /= xn;
    }
    return xy < tolerance;
}


export function approx_equal_array(x: number[], y: number[],
                                   tolerance = SQRT_DBL_EPSILON) {
    if (y.length != x.length) {
        throw "Incompatible arrays";
    }
    var scale = 0, xy = 0, n = 0;
    for (var i = 0; i < x.length; ++i) {
        if (x[i] != y[i]) {
            scale += Math.abs(x[i]);
            xy += Math.abs(x[i] - y[i]);
            n++;
        }
    }
    if (n == 0) {
        return true;
    }

    scale /= n;
    xy /= n;

    if (scale > tolerance) {
        xy /= scale;
    }
    return xy < tolerance;
}


export function seq_len(a: number, b: number, len: number) : number[] {
    const d = (a - b) / (len - 1);
    const ret = [];
    for (var i = 0; i < len; ++i) {
        const p = i / (len - 1);
        ret.push((1 - p) * a + p * b);
    }
    return ret;
}
