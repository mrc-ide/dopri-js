import { describe, it, expect } from "vitest";
import {lorenzRhs} from "../src/examples";
import {approxEqualArray} from "../src/utils";

describe("lorenz function", () => {
    it("is correct with known cases", () => {
        const y = [10.0, 1.0, 1.0];
        const dy = [0, 0, 0];
        const lorenz = lorenzRhs();
        lorenz(0, y, dy);
        // This seems hard to get right:
        const ref = [-90.0, 269.0, 22 / 3];
        expect(approxEqualArray(dy, ref)).toBe(true);
    });
});
