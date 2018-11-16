import {HistoryElement, Stepper} from "./types";

export function interpolator(history: HistoryElement[], stepper: Stepper) {
    return (t: number[]) => interpolate(t, history, stepper);
}

function interpolate(t: number[], history: HistoryElement[], stepper: Stepper) {
    const y: number[][] = [];
    // TODO: validate that 't' is increasing and fits within
    // integration time.

    const h = history;
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
        y.push(stepper.interpolate(tj, h[i]));
    }
    return y;
}
