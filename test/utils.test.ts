import { describe, it, expect } from "vitest";
import * as utils from "../src/utils";

describe("square function", () => {
    it("is correct with known cases", () => {
        expect(utils.square(2)).toEqual(4);
        expect(utils.square(-9)).toEqual(81);
    });
});

describe("zeros function", () => {
    it("is correct with known cases", () => {
        expect(utils.zeros(0)).toEqual([]);
        expect(utils.zeros(1)).toEqual([0]);
        expect(utils.zeros(2)).toEqual([0, 0]);
    });
});

describe("approximately equal", () => {
    it("is true with identical values", () => {
        expect(utils.approxEqual(1, 1)).toBe(true);
        expect(utils.approxEqual(Math.sqrt(3), Math.sqrt(3))).toBe(true);
        expect(utils.approxEqual(Math.pow(Math.PI, 20), Math.pow(Math.PI, 20))).toBe(true);
    });

    it("is false with different values", () => {
        expect(utils.approxEqual(1, 10)).toBe(false);
        expect(utils.approxEqual(10, 1)).toBe(false);
    });

    it("can be tuned with tolerance", () => {
        expect(utils.approxEqual(Math.PI, 355 / 113)).toBe(false);
        expect(utils.approxEqual(Math.PI, 355 / 113, 1e-7)).toBe(true);
    });

    it("works for very small numbers", () => {
        expect(utils.approxEqual(1e-10, 1e-10)).toBe(true);
        expect(utils.approxEqual(1e-10, 1e-11)).toBe(true);
    });
});

describe("approximately equal arrays", () => {
    it("is equal only when arrays are the same length", () => {
        expect(utils.approxEqualArray([], [])).toBe(true);
        expect(utils.approxEqualArray([0], [0])).toBe(true);
        // for catching errors, need to use a lambda
        expect(() => utils.approxEqualArray([0], [])).toThrow();
    });

    it("allows small differences", () => {
        const x = [2, 3, 5, 7, 11, 13];
        const y = x.map((el: number) => utils.square(Math.sqrt(el)));
        expect(utils.approxEqualArray(x, y)).toBe(true);
    });

    it("notices large differences", () => {
        expect(utils.approxEqualArray([1, 2, 3], [1, 3, 3])).toBe(false);
    });

    it("can be tuned", () => {
        const x = [Math.PI, Math.PI];
        const y = [355 / 113, 355 / 113];
        expect(utils.approxEqualArray(x, y)).toBe(false);
        expect(utils.approxEqualArray(x, y, 1e-7)).toBe(true);
    });
});

describe("binary search", () => {
    it("works with simple data", () => {
        const x = utils.seqLen(0, 5, 6);

        const makeCompare = (target: number) => (el: number) => el > target;

        expect(utils.search(x, makeCompare(1.5))).toEqual(1);
        expect(utils.search(x, makeCompare(1 + 1e-10))).toEqual(1);
        expect(utils.search(x, makeCompare(1))).toEqual(1);

        for (let i = 0; i < x.length; ++i) {
            expect(utils.search(x, makeCompare(i + 0.5))).toEqual(i);
        }

        expect(utils.search(x, makeCompare(-0.5))).toEqual(-1);
        expect(utils.search(x, makeCompare(x.length + 1))).toEqual(x.length - 1);
    });

    it("works with complex data", () => {
        const x = utils.seqLen(0, 5, 6).map((el) => ({ t: el, h: {} }));
        const makeCompare = (target: any) => (el: any) => el.t > target;
        expect(utils.search(x, makeCompare(1.5))).toEqual(1);
    });
});
