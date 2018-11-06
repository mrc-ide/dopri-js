// I don't love this, but it seems to do the job.
//
// These sorts of things end up with quite a few control parameters
// (in our case things like atol and rtol) - they are very annoying to
// provide all of, and in R this is dealt with by having a big pile of
// named optional arguments.
//
// In TS/JS optional arguments are possible, but don't allow access by
// keyword.  To resolve this I've implemented the "optional
// properties" approach suggested in the typescript docs:
// https://www.typescriptlang.org/docs/handbook/interfaces.html
//
// However, I don't really want a plain unclassed object as a return
// value because I also want to _validate_ the parameters, and then to
// set them all as readonly (because they have then just been
// validated).  So this requires a whole extra later of class - here
// 'DopriControl' which is typed, enforces readonlyness, and does the
// validation in the constructor.
//
// This does lead to quite a bit of repetition in names unfortunately.
interface DopriControlParam {
    maxSteps?: number;
    atol?: number;
    rtol?: number;
    stiffCheck?: number;
}

function controlError(nm: string, message: string) {
    return new Error(`Invalid control parameter: '${nm}' ${message}`);
}

export class DopriControl {
    public readonly maxSteps: number;
    public readonly atol: number;
    public readonly rtol: number;
    public readonly stiffCheck: number;

    constructor(maxSteps: number, atol: number, rtol: number,
                stiffCheck: number) {
        if (maxSteps < 1) {
            throw controlError("maxSteps", "must be at least 1");
        }
        this.maxSteps = maxSteps;

        if (atol <= 0) {
            throw controlError("atol", "must be strictly positive");
        }
        this.atol = atol;

        if (rtol <= 0) {
            throw controlError("rtol", "must be strictly positive");
        }
        this.rtol = rtol;
        this.stiffCheck = stiffCheck;
    }
}

export function dopriControl(config: DopriControlParam): DopriControl {
    const ret = {maxSteps: 10000, atol: 1e-6, rtol: 1e-6, stiffCheck: 0};
    if (config.maxSteps != null) {
        ret.maxSteps = config.maxSteps;
    }
    if (config.atol != null) {
        ret.atol = config.atol;
    }
    if (config.rtol != null) {
        ret.rtol = config.rtol;
    }
    if (config.stiffCheck != null) {
        ret.stiffCheck = config.stiffCheck;
    }
    return new DopriControl(ret.maxSteps, ret.atol, ret.rtol, ret.stiffCheck);
}
