import * as utils from "./utils";

export const hello = () => 'Hello world!';

export function example(x: number) {
    return x + utils.square(x);
}
