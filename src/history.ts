export class HistoryElement {
    public t: number;
    public h: number;
    public data: number[];

    constructor(len: number) {
        this.t = 0;
        this.h = 0;
        this.data = new Array<number>(len);
    }

    public clone(): HistoryElement {
        const h = new HistoryElement(this.data.length);
        h.t = this.t;
        h.h = this.h;
        h.data = this.data.slice(0);
        return h;
    }
}
