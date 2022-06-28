import {DopriControlParam} from "./control";
import {integrateDDE} from "./dde";
import {integrateDopri} from "./dopri";
import {OutputFn, OutputFnDelayed, RhsFn, RhsFnDelayed} from "./types";

function isRhsFn(rhs: RhsFn | RhsFnDelayed): rhs is RhsFn {
    //        rhsFn: t, y, dy
    // rhsFnDelayed: t, y, dy, solution
    return rhs.length === 3;
}

function isOutputFn(output: OutputFn | OutputFnDelayed): output is OutputFn {
    return output === null || output.length === 2;
}

function isOutputFnDelayed(output: OutputFn | OutputFnDelayed): output is OutputFnDelayed {
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
        return integrateDopri(rhs, y, t0, t1, control, output);
    } else {
        if (!isOutputFnDelayed(output)) {
            throw new Error("Can't used non-delayed output with delayed rhs");
        }
        return integrateDDE(rhs, y, t0, t1, control, output);
    }
}
