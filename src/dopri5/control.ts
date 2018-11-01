import * as types from "../types";

export class Dopri5StepControl implements types.DopriStepControl {
    // Essentially unlimited step size
    public readonly sizeMin = 1e-8; // should be Number.EPSILON, really
    public readonly sizeMax = Number.MAX_VALUE;
    // For scaling during adaptive stepping
    public readonly factorSafe = 0.9;
    public readonly factorMin = 0.2;  // from dopri5.f:276, retard.f:328
    public readonly factorMax = 10.0; // from dopri5.f:281, retard.f:333
    public readonly beta = 0.04;
    public readonly constant = 0.2 - this.beta * 0.75;
}
