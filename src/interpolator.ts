import {HistoryElement, Stepper} from "./types";

// We could take either a stepper or the interpolation function here.
// The advantage of the former is that we can sensibly implement
// interpolation of single variables eventually.

// We could also take responsibility for doing the actual collection
// of times - that would be possibly worth doing, as then we could
// find indexes with a binary search e.g., z.find(x => x > 2.2)
// export type interpolate = (t: number, y: number[]) => number[];

// This is going to need some work if we ever want to support
// extending a history and continuing.

export class Interpolator {
    public readonly stepper: Stepper;
    public history: HistoryElement[];

    constructor(stepper: Stepper) {
        this.stepper = stepper;
        this.history = [];
    }

    public add(h: HistoryElement) {
        this.history.push(h.clone());
    }

    public interpolate(t: number[]) {
        const y: number[][] = [];
        // TODO: validate that 't' is increasing and fits within
        // integration time.

        const h = this.history;
        // TODO: need to protect us from walking off the end of the
        // array (or starting within it).
        //
        // TODO: don't allow anything to happen with a zero-length
        // history.
        let i = 0;
        for (const tj of t) {
            // This bit of calculation is not that nice - we're better
            // off holding both start and end times than doing this.
            while (h[i].t + h[i].h < tj) {
                i++;
            }
            y.push(this.stepper.interpolate(tj, h[i]));
        }
        return y;
    }
}
