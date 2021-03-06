import {History, HistoryElement} from "./history";
import * as interpolator from "./interpolator";
export {History, HistoryElement};

export type RhsFn = (t: number, y: number[], dy: number[]) => void;
export type OutputFn = null | ((t: number, y: number[]) => number[]);

export interface DopriStepControl {
    beta: number;
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

export type InterpolatedSolution = (t: number) => number[];
export type RhsFnDelayed = (t: number, y: number[], dy: number[],
                            solution: InterpolatedSolution) => void;
export type OutputFnDelayed =
    null |
    ((t: number, y: number[], solution: InterpolatedSolution) => number[]);
