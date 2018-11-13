import {DopriStepControl, Stepper} from "../types";
import * as utils from "../utils";

export class Dopri853StepControl implements DopriStepControl {
    // Essentially unlimited step size
    public readonly sizeMin = 1e-8; // should be Number.EPSILON, really
    public readonly sizeMax = Number.MAX_VALUE;
    // For scaling during adaptive stepping
    public readonly factorSafe = 0.9;
    public readonly factorMin = 0.333; // from dopri853.f:285
    public readonly factorMax = 6.0;   // from dopri853.f:290
    public readonly beta = 0.0;        // from dopri853.f:296
    public readonly constant = 0.2 - this.beta * 0.75;
}
