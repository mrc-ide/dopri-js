import * as types from "./types";

// We could take either a stepper or the interpolation function here.
// The advantage of the former is that we can sensibly implement
// interpolation of single variables eventually.

// We could also take responsibility for doing the actual collection
// of times - that would be possibly worth doing, as then we could
// find indexes with a binary search e.g., z.find(x => x > 2.2)
// export type interpolate = (t: number, y: number[]) => number[];

// This is going to need some work if we ever want to support
// extending a history and continuing.

export class interpolator {
    constructor(stepper: types.stepper) {
        this.stepper = stepper;
        this.history = [];
    }

    add(h: number[]) {
        this.history.push(h.slice(0));
    }

    interpolate(t: number[]) {
        var y: number[][] = [];
        // TODO: validate that 't' is increasing and fits within
        // integration time.

        const h = this.history;
        // TODO: Time is currently saved into the second to last
        // element but this would be far better as a small structure
        // probably. e.g., {t0, h, t1, history}.  It's also possible
        // that we could do better with some sort of "history
        // container" object.
        //
        // Probably hold off doing most of that until (a) this is
        // known to work and (b) I work out how the delay lookup will
        // work as that needs to feed into the derivative function in
        // odd ways.
        //
        // TODO: need to protect us from walking off the end of the
        // array (or starting within it).
        //
        // TODO: don't allow anything to happen with a zero-length
        // history.
        const it = h[0].length - 2;
        var i = 0;
        for (var j = 0; j < t.length; ++j) {
            var tj = t[j];
            // This bit of calculation is not that nice - we're better
            // off holding both start and end times than doing this.
            while (h[i][it] + h[i][it + 1] < tj) {
                i++;
            }
            y.push(this.stepper.interpolate(tj, h[i]));
        }
        return y;
    }

    readonly stepper: types.stepper;
    history: number[][];
}
