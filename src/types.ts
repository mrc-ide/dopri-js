import { History, HistoryElement } from "./history";
export type { History };
export { HistoryElement };

/**
 * The function type for ODE right-hand-side functions, passed through
 * to {@link Dopri}
 *
 * @see {@link OutputFn} and {@link RhsFnDelayed}
 *
 * @param t The time that the derivative is requested at
 *
 * @param y The values at time `t`
 *
 * @param dydt A vector the same length as `y` that will be written
 * into containing the derivative of `y` with respect to time at time
 * `t`
 */
export type RhsFn = (t: number, y: number[], dy: number[]) => void;

/**
 * The function type for computing additional quantities based on the
 * solution, but which are not expressed in terms of derivatives. This
 * may be `null`, in which case no calculation will be done. Note that
 * unlike {@link RhsFn}, `OutputFn` returns the output rather than
 * writing to an array in-place.
 *
 * @see {@link RhsFn} and {@link OutputFnDelayed}
 *
 * @param t The time
 *
 * @param y The solution at this point in time
 */
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

/**
 * Abstract integrator interface
 */
export interface Integrator {
    /**
     * Initialise the solver
     *
     * @param t The time to start integrating from
     *
     * @param y The initial conditions
     */
    initialise(t: number, y: number[]): Integrator;

    /**
     * Integrate the solution through to some time
     *
     * @param tEnd End time of the integration
     */
    run(tEnd: number): (t: number[]) => number[][];

    /**
     * Return statistics about the integration so far
     */
    statistics(): object;
}

/**
 * Interpolated solution to a set of differential equations, which can
 * be used to look up value of the variables at any point in the past.
 *
 * @param t The time to request the solution at
 *
 * @return A vector of variables at time `t`
 *
 * @see {@link RhsFnDelayed} and {@link OutputFnDelayed} which accept
 * a `solution` argument of this type.
 */
export type InterpolatedSolution = (t: number) => number[];

/**
 * The function type for ODE right-hand-side functions, passed through
 * to {@link DDE}
 *
 * @see {@link OutputFnDelayed} and {@link RhsFn}
 *
 * @param t The time that the derivative is requested at
 *
 * @param y The values at time `t`
 *
 * @param dydt A vector the same length as `y` that will be written
 * into containing the derivative of `y` with respect to time at time
 * `t`
 *
 * @param solution The interpolated solution, as a function. You can
 * use this function to look up the solution at some point in the
 * past.
 */
export type RhsFnDelayed = (t: number, y: number[], dy: number[], solution: InterpolatedSolution) => void;

/**
 * The function type for computing additional quantities based on the
 * solution, but which are not expressed in terms of derivatives. This
 * may be `null`, in which case no calculation will be done. Note that
 * unlike {@link RhsFn}, `OutputFn` returns the output rather than
 * writing to an array in-place.
 *
 * @see {@link RhsFnDelayed} and {@link OutputFn}
 *
 * @param t The time
 *
 * @param y The solution at this point in time
 *
 * @param solution The interpolated solution, as a function. You can
 * use this function to look up the solution at some point in the
 * past.
 */
export type OutputFnDelayed = null | ((t: number, y: number[], solution: InterpolatedSolution) => number[]);
