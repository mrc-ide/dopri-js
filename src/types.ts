// This should go into an "ambient module" I believe

export type RhsFn = (t: number, y: number[], dy: number[]) => void;

export interface DopriStepControl {
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

    step(t: number, h: number): void;
    stepComplete(t: number, h: number): void;

    saveHistory(t: number, h: number): void;
    error(atol: number, rtol: number): number;
    interpolate(t: number, history: number[]): number[];
    isStiff(t: number): boolean;
    initialStepSize(t: number, atol: number, rtol: number): number;
    reset(y: number[]): void;
}
