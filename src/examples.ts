export function exponential_rhs(r: number[]) {
    return function(t: number, y: number[], dydt: number[]) {
        for (var i = 0; i < y.length; ++i) {
            dydt[i] = y[i] * r[i];
        }
    }
}


export function exponential_solution(r: number[], y: number[], t: number[]) {
    var ret = [];
    for (var i = 0; i < t.length; ++i) {
        var el = [];
        for (var j = 0; j < y.length; ++j) {
            el.push(y[j] * Math.exp(r[j] * t[i]));
        }
        ret.push(el);
    }
    return ret;
}


export function logistic_rhs(r: number, K: number) {
    return function(t: number, y: number[], dydt: number[]) {
        const n = y[0];
        dydt[0] = r * n * (1 - n / K);
    }
}


export function logistic_solution(r: number, K: number, y: number,
                                  t: number[]) {
    return t.map(t =>  K / (1 + (K / y - 1) * Math.exp(-r * t)));
}


export function lorenz_rhs() {
    const sigma = 10.0;
    const R = 28.0;
    const b = 8.0 / 3.0;

    return function(t: number, y: number[], dydt: number[]) {
        const y1 = y[0];
        const y2 = y[1];
        const y3 = y[2];

        dydt[0] = sigma * (y2 - y1);
        dydt[1] = R * y1 - y2 - y1 * y3;
        dydt[2] = -b * y3 + y1 * y2;
    }
}
