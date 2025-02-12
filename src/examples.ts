export function exponentialRhs(r: number[]) {
    return (t: number, y: number[], dydt: number[]) => {
        for (let i = 0; i < y.length; ++i) {
            dydt[i] = y[i] * r[i];
        }
    };
}

export function exponentialSolution(r: number[], y: number[], t: number[]) {
    const ret = [];
    for (const ti of t) {
        const el = [];
        for (let j = 0; j < y.length; ++j) {
            el.push(y[j] * Math.exp(r[j] * ti));
        }
        ret.push(el);
    }
    return ret;
}

export function logisticRhs(r: number, K: number) {
    return (t: number, y: number[], dydt: number[]) => {
        const n = y[0];
        dydt[0] = r * n * (1 - n / K);
    };
}

export function logisticSolution(r: number, K: number, y: number, t: number[]) {
    return t.map((ti: number) => K / (1 + (K / y - 1) * Math.exp(-r * ti)));
}

export function lorenzRhs() {
    const sigma = 10.0;
    const R = 28.0;
    const b = 8.0 / 3.0;

    return (t: number, y: number[], dydt: number[]) => {
        const y1 = y[0];
        const y2 = y[1];
        const y3 = y[2];

        dydt[0] = sigma * (y2 - y1);
        dydt[1] = R * y1 - y2 - y1 * y3;
        dydt[2] = -b * y3 + y1 * y2;
    };
}

// https://www.mathworks.com/company/newsletters/articles/stiff-differential-equations.html
export function flameRhs(t: number, y: number[], dydt: number[]) {
    dydt[0] = Math.pow(y[0], 2) - Math.pow(y[0], 3);
}
