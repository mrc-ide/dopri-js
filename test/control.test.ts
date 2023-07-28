import {dopriControl} from "../src/control";

describe("control parameters", () => {
    it("has sensible defaults", () => {
        const x = dopriControl();
        expect(x.maxSteps).toEqual(10000);
        expect(x.stiffCheck).toEqual(0);
        expect(x.atol).toEqual(1e-6);
        expect(x.rtol).toEqual(1e-6);
    });

    it("accepts one new parameter", () => {
        const x = dopriControl({maxSteps: 20});
        expect(x.maxSteps).toEqual(20);
        expect(x.stiffCheck).toEqual(0);
    });

    it("accepts several parameters", () => {
        const x = dopriControl({atol: 1e-5, stiffCheck: 20});
        expect(x.maxSteps).toEqual(10000);
        expect(x.atol).toEqual(1e-5);
        expect(x.rtol).toEqual(1e-6);
        expect(x.stiffCheck).toEqual(20);
    });
});

describe("validate inputs", () => {
    it("requires positive maxSteps", () => {
        expect(() => {dopriControl({maxSteps: -1});}).
            toThrow("'maxSteps' must be at least 1");
        expect(() => {dopriControl({maxSteps: 0});}).
            toThrow("'maxSteps' must be at least 1");
    });

    it("requires positive atol", () => {
        expect(() => {dopriControl({atol: -1});}).
            toThrow("'atol' must be strictly positive");
        expect(() => {dopriControl({atol: 0});}).
            toThrow("'atol' must be strictly positive");
    });

    it("requires positive rtol", () => {
        expect(() => {dopriControl({rtol: -1});}).
            toThrow("'rtol' must be strictly positive");
        expect(() => {dopriControl({rtol: 0});}).
            toThrow("'rtol' must be strictly positive");
    });

    it("accepts and sorts critical times", () => {
        expect(dopriControl({tcrit: []}).tcrit).toStrictEqual([]);
        expect(dopriControl({tcrit: [1]}).tcrit).toStrictEqual([1]);
        expect(dopriControl({tcrit: [1, 2]}).tcrit).toStrictEqual([1, 2]);
        expect(dopriControl({tcrit: [2, 1]}).tcrit).toStrictEqual([1, 2]);
    });
});
