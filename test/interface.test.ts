import {Dopri, integrate} from "../src/index";

describe('High level use', () => {
    var rhs = function(t: number, y: number[], dydt: number[]) {
        dydt[0] = 1;
    };

    it('works with Dopri class', () => {
        var solver = new Dopri(rhs, 1);
        solver.initialise(0, [1]);
        var sol = solver.run(4);
        var t = [0, 1, 2, 3];
        expect(sol(t).map(el => el[0])).toEqual([1, 2, 3, 4]);
    });
});

describe('Integrate function', () => {
    it('works for dopri, with no output', () => {
        var rhs = function(t: number, y: number[], dydt: number[]) {
            dydt[0] = 1;
        };
        var sol = integrate(rhs, [1], 0, 3);
        var t = [0, 1, 2, 3];
        var y = sol(t);
        expect(y.map((el: number[]) => el[0])).toEqual([1, 2, 3, 4]);
    });

    it('works for dopri, with output', () => {
        var rhs = function(t: number, y: number[], dydt: number[]) {
            dydt[0] = 1;
        };
        var out = (t: number, y: number[]) => [y[0] + 1];
        var sol = integrate(rhs, [1], 0, 3, {}, out);
        var t = [0, 1, 2, 3];
        var y = sol(t);
        expect(y.map((el: number[]) => el[0])).toEqual([1, 2, 3, 4]);
        expect(y.map((el: number[]) => el[1])).toEqual([2, 3, 4, 5]);
    });

    it('works for dopri, preventing use with incorrect output', () => {
        var rhs = function(t: number, y: number[], dydt: number[]) {
            dydt[0] = 1;
        };
        var out = (t: number, y: number[], solution: any) => [y[0] + 1];
        expect(() => integrate(rhs, [1], 0, 3, {}, out)).toThrow(
            "Can't used delayed output with non-delayed rhs");
    });

    it('works for dde, with no output', () => {
        var rhs = function(t: number, y: number[], dydt: number[], solution: any) {
            dydt[0] = 1;
        };
        var sol = integrate(rhs, [1], 0, 3);
        var t = [0, 1, 2, 3];
        var y = sol(t);
        expect(y.map((el: number[]) => el[0])).toEqual([1, 2, 3, 4]);
    });

    it('works for dde, with output', () => {
        var rhs = function(t: number, y: number[], dydt: number[], solution: any) {
            dydt[0] = 1;
        };
        var out = (t: number, y: number[], solution: any) => solution(t - 1);
        var sol = integrate(rhs, [1], 0, 3, {}, out);
        var t = [0, 1, 2, 3];
        var y = sol(t);
        expect(y.map((el: number[]) => el[0])).toEqual([1, 2, 3, 4]);
        expect(y.map((el: number[]) => el[1])).toEqual([1, 1, 2, 3]);
    });

    it('works for dde, preventing use with incorrect output', () => {
        var rhs = function(t: number, y: number[], dydt: number[], solution: any) {
            dydt[0] = 1;
        };
        var out = (t: number, y: number[]) => [y[0] + 1];
        expect(() => integrate(rhs, [1], 0, 3, {}, out)).toThrow(
            "Can't used non-delayed output with delayed rhs");
    });
});
