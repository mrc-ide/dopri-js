const r = 0.5;
const K = 100;

export function rhs(t: number, y: number[], dydt: number[]) {
    const n = y[0];
    dydt[0] = r * n * (1 - n / K);
}

export function initial() {
    return [1];
}
