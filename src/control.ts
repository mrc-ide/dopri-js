/**
 * Control over the integration, passed into {@link Dopri} or {@link
 * DDE}
 */
export interface DopriControlParam {
    /** Maximum number of steps to take before refusing to integrate
     *  further. The default of 10000 may need increasing for some
     *  large problems or long integrations
     */
    maxSteps: number;
    /** Per-step absolute tolerance. Reducing this (or `rtol`) will
     *  decrease the step size taken by the solver and increase the
     *  number of steps taken, while inreasing the accuracy of the
     *  solution.
     */
    atol: number;
    /** Per-step relative tolerance. Reducing this (or `atol`) will
     *  decrease the step size taken by the solver and increase the
     *  number of steps taken, while inreasing the accuracy of the
     *  solution.
     */
    rtol: number;
    /** How often to perform the check for the system becoming stiff,
     *  in terms of steps
     */
    stiffCheck: number;
    /** A critical time that the solver must stop at. Use this if your
     *  system has a singularity that it must not step past (typically
     *  at the end of the simulation).
     */
    tcrit: number;
    /** The minimum allowed step size. If not given then we allow
     *  steps to reduce close to the limit of machine precision. If
     *  the integration attempts to make a step smaller than this, it
     *  will throw an error by default, stopping the integration. See
     *  `stepSizeMinAllow` to change this behaviour.
     */
    stepSizeMin: number;
    /** The maximum allowed step size. If not given we allow
     * arbitrarily large step sizes. For some problems it may be
     * useful to prevent overly large steps as even when the accuracy
     * criteria are satisfied (`atol` and `rtol`) too-large steps can
     * result in variables that must be positive going negative and
     * causing problems with the solution.
     */
    stepSizeMax: number;
    /** Allow the integration to continue even where the step size has
     *  reduced to `stepSizeMin`? If we continue then the accuracy
     *  requested by `atol` and `rtol` is not likely to be satisfied.
     */
    stepSizeMinAllow: boolean;
}

export function dopriControl(control: Partial<DopriControlParam> = {}) {
    const defaults = {atol: 1e-6,
                      maxSteps: 10000,
                      rtol: 1e-6,
                      stepSizeMax: Infinity,
                      stepSizeMin: 1e-8,
                      stepSizeMinAllow: false,
                      stiffCheck: 0,
                      tcrit: Infinity,
                     };
    const ret = {
        atol: withDefault(control.atol, defaults.atol),
        maxSteps: withDefault(control.maxSteps, defaults.maxSteps),
        rtol: withDefault(control.rtol, defaults.rtol),
        stepSizeMax: withDefault(control.stepSizeMax, defaults.stepSizeMax),
        stepSizeMin: withDefault(control.stepSizeMin, defaults.stepSizeMin),
        stepSizeMinAllow: withDefault(control.stepSizeMinAllow,
                                      defaults.stepSizeMinAllow),
        stiffCheck: withDefault(control.stiffCheck, defaults.stiffCheck),
        tcrit: withDefault(control.tcrit, defaults.tcrit),
    };

    if (ret.maxSteps < 1) {
        throw controlError("maxSteps", "must be at least 1");
    }
    if (ret.atol <= 0) {
        throw controlError("atol", "must be strictly positive");
    }
    if (ret.rtol <= 0) {
        throw controlError("rtol", "must be strictly positive");
    }
    return ret;
}

function controlError(nm: string, message: string) {
    return new Error(`Invalid control parameter: '${nm}' ${message}`);
}

function withDefault<T>(x: T | undefined, y: T) {
    return x === undefined ? y : x;
}
