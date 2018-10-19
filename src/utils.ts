import * as fs from "fs";

export function square(x: number) : number{
    return x * x;
}


export function constrain(x: number, min: number, max: number) : number {
    return Math.max(Math.min(x, max), min);
}


export function copy_array(to: number[], from: number[]) : void {
    const n = to.length;
    for (var i = 0; i < n; i++) {
        to[i] = from[i];
    }
}


export function zeros(n: number) : number[] {
    const ret = Array<number>(n);
    for (var i = 0; i < n; ++i) {
        ret[i] = 0.0;
    }
    return ret;
}


// need to install node types for this to work...
export function write_csv(arr: Array<number[]>, path: string) : void {
    var str = arr.map(x => x.join(',') + '\n').join('');
    fs.writeFile(path, str, function(err) {
        if(err) {
            return console.log(err);
        }
    });}
