import * as types from "./types";
// until interface constructor is done
import * as dopri5 from "./dopri5";

export class dopri {
    constructor(rhs: types.rhs_fn, n: number) {
        this.integrator = new dopri5.dopri5(rhs, n);
    }

    integrator: dopri5.dopri5;
}
