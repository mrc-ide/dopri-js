import { DopriControlParam } from "./control";
import { Dopri } from "./dopri";
import { HistoryElement, OutputFnDelayed, RhsFnDelayed } from "./types";
import { search } from "./utils";

/** {@inheritDoc integrateDopri} */
export function integrateDDE(
    rhs: RhsFnDelayed,
    y: number[],
    t0: number,
    t1: number,
    control: Partial<DopriControlParam> = {},
    output: OutputFnDelayed = null
) {
    const solver = new DDE(rhs, y.length, control, output);
    solver.initialise(t0, y);
    return solver.run(t1);
}

/**
 * Integrator for delay differential equations. For integrating
 * ordinary differential equations, see {@link Dopri}.
 */
export class DDE extends Dopri {
    private _y0: number[];
    constructor(
        rhs: RhsFnDelayed,
        n: number,
        control: Partial<DopriControlParam> = {},
        output: OutputFnDelayed = null
    ) {
        const solution = (t: number) => this._interpolate(t);
        const rhsUse = (t: number, y: number[], dy: number[]) => rhs(t, y, dy, solution);
        const outputUse = output === null ? null : (t: number, y: number[]) => output(t, y, solution);
        super(rhsUse, n, control, outputUse);
        this._y0 = new Array<number>(n);
    }

    public initialise(t: number, y: number[]): DDE {
        this._y0 = y;
        super.initialise(t, y);
        return this;
    }

    private _interpolate(t: number): number[] {
        const i = this._findHistory(t);
        if (i < 0) {
            return this._y0.slice(0);
        } else {
            return this._stepper.interpolate(t, this._history[i]);
        }
    }

    private _findHistory(t: number): number {
        return search(this._history, (el: HistoryElement) => el.t > t);
    }
}
