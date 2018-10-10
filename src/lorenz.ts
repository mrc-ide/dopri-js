export function rhs(t: number, y: number[], dydt: number[]) {
    const sigma = 10.0;
    const R     = 28.0;
    const b     =  8.0 / 3.0;
    const y1 = y[0];
    const y2 = y[1];
    const y3 = y[2];

    dydt[0] = sigma * (y2 - y1);
    dydt[1] = R * y1 - y2 - y1 * y3;
    dydt[2] = -b * y3 + y1 * y2;
}
