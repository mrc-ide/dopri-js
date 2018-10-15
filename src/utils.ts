export function square(x: number) : number{
    return x * x;
}


export function constrain(x: number, min: number, max: number) : number{
    return Math.max(Math.min(x, max), min);
}


export function copy_array(to: number[], from: number[]) : void {
    const n = to.length;
    for (var i = 0; i < n; i++) {
        to[i] = from[i];
    }
}
