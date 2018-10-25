// This should go into an "ambient module" I believe

export type rhs_fn = (t: number, y: number[], dy: number[]) => void;


export interface dopri_step_control {
    size_min: number;
    size_max: number;
    factor_safe: number;
    factor_min: number;
    factor_max: number;
    constant: number;
}


export interface stepper {
    step(t: number, h: number) : void;
    step_complete(t: number, h: number) : void;

    save_history(t: number, h: number) : void;
    error(atol: number, rtol: number) : number;
    interpolate(t: number, history: number[]) : number[];
    is_stiff(t: number) : boolean;
    initial_step_size(t: number, atol: number, rtol: number) : number;
    reset(y: number[]) : void;

    readonly n: number;
    readonly order: number;
    readonly y_next: number[];
    readonly step_control: dopri_step_control;
}
