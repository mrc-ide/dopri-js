export interface DopriControlParam {
    maxSteps: number;
    atol: number;
    rtol: number;
    stiffCheck: number;
}

export function dopriControl(control: Partial<DopriControlParam> = {}) {
    const defaults = {atol: 1e-6, maxSteps: 10000, rtol: 1e-6,
                      stiffCheck: 0};
    const ret = {
        atol: withDefault(control.atol, defaults.atol),
        maxSteps: withDefault(control.maxSteps, defaults.maxSteps),
        rtol: withDefault(control.rtol, defaults.rtol),
        stiffCheck: withDefault(control.stiffCheck, defaults.stiffCheck),
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
