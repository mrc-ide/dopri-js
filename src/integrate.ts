import {DopriControlParam} from "./control";
import {integrate as integrate_dde} from "./dde";
import {integrate as integrate_dopri} from "./dopri";
import {OutputFn, OutputFnDelayed, RhsFn, RhsFnDelayed} from "./types";

function isRhsFn(rhs: RhsFn | RhsFnDelayed): rhs is RhsFn {
    //        rhsFn: t, y, dy
    // rhsFnDelayed: t, y, dy, solution
    return rhs.length === 3;
}

function isOutputFn(output: OutputFn | OutputFnDelayed): output is OutputFn {
    return output === null || output.length === 2;
}

function isRhsFnDelayed(rhs: RhsFn | RhsFnDelayed): rhs is RhsFnDelayed {
    //        rhsFn: t, y, dy
    // rhsFnDelayed: t, y, dy, solution
    return rhs.length === 4;
}

function isOutputFnDelayed(output: OutputFn | OutputFnDelayed):
output is OutputFnDelayed {
    return output === null || output.length === 3;
}

export function integrate(rhs: RhsFn | RhsFnDelayed, y: number[],
                          t0: number, t1: number,
                          control: Partial<DopriControlParam> = {},
                          output: OutputFn | OutputFnDelayed = null) {
    if (isRhsFn(rhs)) {
        if (!isOutputFn(output)) {
            throw new Error("Can't used delayed output with non-delayed rhs");
        }
        return integrate_dopri(rhs, y, t0, t1, control, output);
    } else {
        if (!isOutputFnDelayed(output)) {
            throw new Error("Can't used non-delayed output with delayed rhs");
        }
        return integrate_dde(rhs, y, t0, t1, control, output);
    }
}
