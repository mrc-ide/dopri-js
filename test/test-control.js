"use strict";
var expect = require("chai").expect;
var utils = require("../dist/utils.js");
var control = require("../dist/control.js");

describe("control parameters", () => {
    it("has sensible defaults", () => {
        var x = control.dopriControl({});
        expect(x.maxSteps).to.eql(10000);
    });

    it("accepts one new parameter", () => {
        var x = control.dopriControl({maxSteps: 20});
        expect(x.maxSteps).to.eql(20);
        expect(x.stiffCheck).to.eql(0);
    });


    it("accepts several parameters", () => {
        var x = control.dopriControl({atol: 1e-5, stiffCheck: 20});
        expect(x.maxSteps).to.eql(10000);
        expect(x.atol).to.eql(1e-5);
        expect(x.rtol).to.eql(1e-6);
        expect(x.stiffCheck).to.eql(20);
    });
});

describe("validate inputs", () => {
    it("requires positive maxSteps", () => {
        expect(() => {control.dopriControl({maxSteps: -1});}).
            to.throw("'maxSteps' must be at least 1");
        expect(() => {control.dopriControl({maxSteps: 0});}).
            to.throw("'maxSteps' must be at least 1");
    });

    it("requires positive atol", () => {
        expect(() => {control.dopriControl({atol: -1});}).
            to.throw("'atol' must be strictly positive");
        expect(() => {control.dopriControl({atol: 0});}).
            to.throw("'atol' must be strictly positive");
    });

    it("requires positive rtol", () => {
        expect(() => {control.dopriControl({rtol: -1});}).
            to.throw("'rtol' must be strictly positive");
        expect(() => {control.dopriControl({rtol: 0});}).
            to.throw("'rtol' must be strictly positive");
    });
});
