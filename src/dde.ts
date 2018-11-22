import {DopriControlParam} from "./control";
import {Dopri} from "./dopri";
import {HistoryElement, OutputFnDelayed, RhsFnDelayed} from "./types";
import {search} from "./utils";

export class DDE extends Dopri {
    private _y0: number[];
    constructor(rhs: RhsFnDelayed, n: number,
                control: Partial<DopriControlParam> = {},
                output: OutputFnDelayed = null) {
        const solution = (t: number) => this._interpolate(t);
        const rhsUse = (t: number, y: number[], dy: number[]) =>
            rhs(t, y, dy, solution);
        const outputUse = output === null ? null :
            (t: number, y: number[]) => output(t, y, solution);
        super(rhsUse, n, control, outputUse);
        this._y0 = new Array<number>(n);
    }

    public initialise(t: number, y: number[]): DDE {
        super.initialise(t, y);
        this._y0 = y;
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
