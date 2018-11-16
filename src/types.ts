import {HistoryElement} from "./history";
import * as interpolator from "./interpolator";
export {HistoryElement};

export type RhsFn = (t: number, y: number[], dy: number[]) => void;

export interface DopriStepControl {
    beta: number;
    sizeMin: number;
    sizeMax: number;
    factorSafe: number;
    factorMin: number;
    factorMax: number;
    constant: number;
}

export interface Stepper {
    readonly n: number;
    readonly order: number;
    readonly yNext: number[];
    readonly stepControl: DopriStepControl;
    readonly rhs: RhsFn;
    history: HistoryElement;
    nEval: number;

    step(t: number, h: number): void;
    stepComplete(t: number, h: number): void;

    error(atol: number, rtol: number): number;
    interpolate(t: number, history: HistoryElement): number[];
    isStiff(t: number): boolean;
    reset(t: number, y: number[]): void;
}

export interface Integrator {
    initialise(t: number, y: number[]): Integrator;
    run(tEnd: number): (t: number[]) => number[][];
    statistics(): object;
}
