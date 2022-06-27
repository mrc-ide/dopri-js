export function flatten(y: number[][], i: number = 0) {
    return y.map((el: number[]) => el[i]);
}
