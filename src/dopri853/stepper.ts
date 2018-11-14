import * as utils from "../utils";
import * as control from "./control";

import {HistoryElement, RhsFn, Stepper} from "../types";

// Even more constants than dopri5
const C2    =  0.526001519587677318785587544488e-01;
const C3    =  0.789002279381515978178381316732e-01;
const C4    =  0.118350341907227396726757197510;
const C5    =  0.281649658092772603273242802490;
const C6    =  0.333333333333333333333333333333;
const C7    =  0.25;
const C8    =  0.307692307692307692307692307692;
const C9    =  0.651282051282051282051282051282;
const C10   =  0.6;
const C11   =  0.857142857142857142857142857142;
const C14   =  0.1;
const C15   =  0.2;
const C16   =  0.777777777777777777777777777778;
const B1    =  5.42937341165687622380535766363e-02;
const B6    =  4.45031289275240888144113950566;
const B7    =  1.89151789931450038304281599044;
const B8    = -5.8012039600105847814672114227;
const B9    =  3.1116436695781989440891606237e-01;
const B10   = -1.52160949662516078556178806805e-01;
const B11   =  2.01365400804030348374776537501e-01;
const B12   =  4.47106157277725905176885569043e-02;
const BHH1  =  0.244094488188976377952755905512;
const BHH2  =  0.733846688281611857341361741547;
const BHH3  =  0.220588235294117647058823529412e-01;
const ER1   =  0.1312004499419488073250102996e-01;
const ER6   = -0.1225156446376204440720569753e+01;
const ER7   = -0.4957589496572501915214079952;
const ER8   =  0.1664377182454986536961530415e+01;
const ER9   = -0.3503288487499736816886487290;
const ER10  =  0.3341791187130174790297318841;
const ER11  =  0.8192320648511571246570742613e-01;
const ER12  = -0.2235530786388629525884427845e-01;
const A21   =  5.26001519587677318785587544488e-02;
const A31   =  1.97250569845378994544595329183e-02;
const A32   =  5.91751709536136983633785987549e-02;
const A41   =  2.95875854768068491816892993775e-02;
const A43   =  8.87627564304205475450678981324e-02;
const A51   =  2.41365134159266685502369798665e-01;
const A53   = -8.84549479328286085344864962717e-01;
const A54   =  9.24834003261792003115737966543e-01;
const A61   =  3.7037037037037037037037037037e-02;
const A64   =  1.70828608729473871279604482173e-01;
const A65   =  1.25467687566822425016691814123e-01;
const A71   =  3.7109375e-02;
const A74   =  1.70252211019544039314978060272e-01;
const A75   =  6.02165389804559606850219397283e-02;
const A76   = -1.7578125e-02;
const A81   =  3.70920001185047927108779319836e-02;
const A84   =  1.70383925712239993810214054705e-01;
const A85   =  1.07262030446373284651809199168e-01;
const A86   = -1.53194377486244017527936158236e-02;
const A87   =  8.27378916381402288758473766002e-03;
const A91   =  6.24110958716075717114429577812e-01;
const A94   = -3.36089262944694129406857109825;
const A95   = -8.68219346841726006818189891453e-01;
const A96   =  2.75920996994467083049415600797e+01;
const A97   =  2.01540675504778934086186788979e+01;
const A98   = -4.34898841810699588477366255144e+01;
const A101  =  4.77662536438264365890433908527e-01;
const A104  = -2.48811461997166764192642586468;
const A105  = -5.90290826836842996371446475743e-01;
const A106  =  2.12300514481811942347288949897e+01;
const A107  =  1.52792336328824235832596922938e+01;
const A108  = -3.32882109689848629194453265587e+01;
const A109  = -2.03312017085086261358222928593e-02;
const A111  = -9.3714243008598732571704021658e-01;
const A114  =  5.18637242884406370830023853209;
const A115  =  1.09143734899672957818500254654;
const A116  = -8.14978701074692612513997267357;
const A117  = -1.85200656599969598641566180701e+01;
const A118  =  2.27394870993505042818970056734e+01;
const A119  =  2.49360555267965238987089396762;
const A1110 = -3.0467644718982195003823669022;
const A121  =  2.27331014751653820792359768449;
const A124  = -1.05344954667372501984066689879e+01;
const A125  = -2.00087205822486249909675718444;
const A126  = -1.79589318631187989172765950534e+01;
const A127  =  2.79488845294199600508499808837e+01;
const A128  = -2.85899827713502369474065508674;
const A129  = -8.87285693353062954433549289258;
const A1210 =  1.23605671757943030647266201528e+01;
const A1211 =  6.43392746015763530355970484046e-01;
const A141  =  5.61675022830479523392909219681e-02;
const A147  =  2.53500210216624811088794765333e-01;
const A148  = -2.46239037470802489917441475441e-01;
const A149  = -1.24191423263816360469010140626e-01;
const A1410 =  1.5329179827876569731206322685e-01;
const A1411 =  8.20105229563468988491666602057e-03;
const A1412 =  7.56789766054569976138603589584e-03;
const A1413 = -8.298e-03;
const A151  =  3.18346481635021405060768473261e-02;
const A156  =  2.83009096723667755288322961402e-02;
const A157  =  5.35419883074385676223797384372e-02;
const A158  = -5.49237485713909884646569340306e-02;
const A1511 = -1.08347328697249322858509316994e-04;
const A1512 =  3.82571090835658412954920192323e-04;
const A1513 = -3.40465008687404560802977114492e-04;
const A1514 =  1.41312443674632500278074618366e-01;
const A161  = -4.28896301583791923408573538692e-01;
const A166  = -4.69762141536116384314449447206;
const A167  =  7.68342119606259904184240953878;
const A168  =  4.06898981839711007970213554331;
const A169  =  3.56727187455281109270669543021e-01;
const A1613 = -1.39902416515901462129418009734e-03;
const A1614 =  2.9475147891527723389556272149;
const A1615 = -9.15095847217987001081870187138;
const D41   = -0.84289382761090128651353491142e+01;
const D46   =  0.56671495351937776962531783590;
const D47   = -0.30689499459498916912797304727e+01;
const D48   =  0.23846676565120698287728149680e+01;
const D49   =  0.21170345824450282767155149946e+01;
const D410  = -0.87139158377797299206789907490;
const D411  =  0.22404374302607882758541771650e+01;
const D412  =  0.63157877876946881815570249290;
const D413  = -0.88990336451333310820698117400e-01;
const D414  =  0.18148505520854727256656404962e+02;
const D415  = -0.91946323924783554000451984436e+01;
const D416  = -0.44360363875948939664310572000e+01;
const D51   =  0.10427508642579134603413151009e+02;
const D56   =  0.24228349177525818288430175319e+03;
const D57   =  0.16520045171727028198505394887e+03;
const D58   = -0.37454675472269020279518312152e+03;
const D59   = -0.22113666853125306036270938578e+02;
const D510  =  0.77334326684722638389603898808e+01;
const D511  = -0.30674084731089398182061213626e+02;
const D512  = -0.93321305264302278729567221706e+01;
const D513  =  0.15697238121770843886131091075e+02;
const D514  = -0.31139403219565177677282850411e+02;
const D515  = -0.93529243588444783865713862664e+01;
const D516  =  0.35816841486394083752465898540e+02;
const D61   =  0.19985053242002433820987653617e+02;
const D66   = -0.38703730874935176555105901742e+03;
const D67   = -0.18917813819516756882830838328e+03;
const D68   =  0.52780815920542364900561016686e+03;
const D69   = -0.11573902539959630126141871134e+02;
const D610  =  0.68812326946963000169666922661e+01;
const D611  = -0.10006050966910838403183860980e+01;
const D612  =  0.77771377980534432092869265740;
const D613  = -0.27782057523535084065932004339e+01;
const D614  = -0.60196695231264120758267380846e+02;
const D615  =  0.84320405506677161018159903784e+02;
const D616  =  0.11992291136182789328035130030e+02;
const D71   = -0.25693933462703749003312586129e+02;
const D76   = -0.15418974869023643374053993627e+03;
const D77   = -0.23152937917604549567536039109e+03;
const D78   =  0.35763911791061412378285349910e+03;
const D79   =  0.93405324183624310003907691704e+02;
const D710  = -0.37458323136451633156875139351e+02;
const D711  =  0.10409964950896230045147246184e+03;
const D712  =  0.29840293426660503123344363579e+02;
const D713  = -0.43533456590011143754432175058e+02;
const D714  =  0.96324553959188282948394950600e+02;
const D715  = -0.39177261675615439165231486172e+02;
const D716  = -0.14972683625798562581422125276e+03;

export class Dopri853 implements Stepper {
    public readonly rhs: RhsFn;
    public readonly n: number;
    public readonly order: number = 8;
    public readonly stepControl = new control.Dopri853StepControl();

    // The variables at the beginning of the step
    public y: number[];
    // TODO: this can be renamed as it's incorrect at the moment, but
    // it requires adjusting the Interface type.
    public yNext: number[];

    // Work arrays:
    public k1: number[];
    public k2: number[];
    public k3: number[];
    public k4: number[];
    public k5: number[];
    public k6: number[];
    public k7: number[];
    public k8: number[];
    public k9: number[];
    public k10: number[];

    public history: HistoryElement;

    public nEval: number = 0;

    constructor(rhs: RhsFn, n: number) {
        this.rhs = rhs;
        this.n = n;

        this.y = new Array<number>(n);
        this.yNext = new Array<number>(n);
        this.k1 = new Array<number>(n);
        this.k2 = new Array<number>(n);
        this.k3 = new Array<number>(n);
        this.k4 = new Array<number>(n);
        this.k5 = new Array<number>(n);
        this.k6 = new Array<number>(n);
        this.k7 = new Array<number>(n);
        this.k8 = new Array<number>(n);
        this.k9 = new Array<number>(n);
        this.k10 = new Array<number>(n);
        this.history = new HistoryElement(this.order * n);
    }

    // This is the ugliest function - quite a lot goes on in here to
    // do the full step
    public step(t: number, h: number): void {
        const n = this.n;

        const y = this.y;
        const yNext = this.yNext;
        const k1 = this.k1;
        const k2 = this.k2;
        const k3 = this.k3;
        const k4 = this.k4;
        const k5 = this.k5;
        const k6 = this.k6;
        const k7 = this.k7;
        const k8 = this.k8;
        const k9 = this.k9;
        const k10 = this.k10;
        const history = this.history;

        let i = 0;

        for (i = 0; i < n; ++i) { // 22
            yNext[i] = y[i] + h * A21 * k1[i];
        }
        this.rhs(t + C2 * h, yNext, k2);

        for (i = 0; i < n; ++i) { // 23
            yNext[i] = y[i] + h * (A31 * k1[i] + A32 * k2[i]);
        }
        this.rhs(t + C3 * h, yNext, k3);

        for (i = 0; i < n; ++i) { // 24
            yNext[i] = y[i] + h * (A41 * k1[i] + A43 * k3[i]);
        }
        this.rhs(t + C4 * h, yNext, k4);

        for (i = 0; i < n; ++i) { // 25
            yNext[i] = y[i] + h * (A51 * k1[i] + A53 * k3[i] + A54 * k4[i]);
        }
        this.rhs(t + C5 * h, yNext, k5);

        for (i = 0; i < n; ++i) { // 26
            yNext[i] = y[i] + h * (A61 * k1[i] + A64 * k4[i] + A65 * k5[i]);
        }
        this.rhs(t + C6 * h, yNext, k6);

        for (i = 0; i < n; ++i) { // 27
            yNext[i] = y[i] + h * (A71 * k1[i] + A74 * k4[i] + A75 * k5[i] +
                                   A76 * k6[i]);
        }
        this.rhs(t + C7 * h, yNext, k7);

        for (i = 0; i < n; ++i) { // 28
            yNext[i] = y[i] + h * (A81 * k1[i] + A84 * k4[i] + A85 * k5[i] +
                                   A86 * k6[i] + A87 * k7[i]);
        }
        this.rhs(t + C8 * h, yNext, k8);

        for (i = 0; i < n; ++i) { // 29
            yNext[i] = y[i] + h * (A91 * k1[i] + A94 * k4[i] + A95 * k5[i] +
                                   A96 * k6[i] + A97 * k7[i] + A98 * k8[i]);
        }
        this.rhs(t + C9 * h, yNext, k9);

        for (i = 0; i < n; ++i) { // 30
            yNext[i] = y[i] + h * (A101 * k1[i] + A104 * k4[i] + A105 * k5[i] +
                                   A106 * k6[i] + A107 * k7[i] + A108 * k8[i] +
                                   A109 * k9[i]);
        }
        this.rhs(t + C10 * h, yNext, k10);

        for (i = 0; i < n; ++i) { // 31
            yNext[i] = y[i] + h * (A111 * k1[i] + A114 * k4[i] + A115 * k5[i] +
                                   A116 * k6[i] + A117 * k7[i] + A118 * k8[i] +
                                   A119 * k9[i] + A1110 * k10[i]);
        }
        this.rhs(t + C11 * h, yNext, k2);

        const tNext = t + h;
        for (i = 0; i < n; ++i) { // 32
            yNext[i] = y[i] + h * (A121 * k1[i] + A124 * k4[i] +
                                   A125 * k5[i] + A126 * k6[i] +
                                   A127 * k7[i] + A128 * k8[i] +
                                   A129 * k9[i] + A1210 * k10[i] +
                                   A1211 * k2[i]);
        }
        this.rhs(tNext, yNext, k3);

        for (i = 0; i < n; ++i) { // 35
            k4[i] = B1 * k1[i] + B6 * k6[i] + B7 * k7[i] + B8 * k8[i] +
                B9 * k9[i] + B10 * k10[i] + B11 * k2[i] + B12 * k3[i];
            k5[i] = y[i] + h * k4[i];
        }

        this.nEval += 11;
    }

    public stepComplete(t: number, h: number): void {
        this.rhs(t, this.k5, this.k4);
        this.nEval++;
        this.saveHistory(t, h);
        utils.copyArray(this.k1, this.k4); // k1 <== k2
        utils.copyArray(this.y,  this.k5); // y  <== k5
    }

    // TODO: make private?
    public saveHistory(t: number, h: number): void {
        // Save a ton of typing:
        const n = this.n;
        const y = this.y;
        const yNext = this.yNext;
        const k1 = this.k1;
        const k2 = this.k2;
        const k3 = this.k3;
        const k4 = this.k4;
        const k5 = this.k5;
        const k6 = this.k6;
        const k7 = this.k7;
        const k8 = this.k8;
        const k9 = this.k9;
        const k10 = this.k10;
        const hData = this.history.data;

        this.rhs(t + h, k5, k4);

        let i = 0;
        for (i = 0; i < n; ++i) {
            const yDiff = k5[i] - y[i];
            const bspl = h * k1[i] - yDiff;
            hData[        i] = y[i];
            hData[    n + i] = yDiff;
            hData[2 * n + i] = bspl;
            hData[3 * n + i] = yDiff - h * k4[i] - bspl;
            // Next ones are more different than the dopri5 case and
            // significantly uglier:
            hData[4 * n + i] = (D41  * k1[i] + D46  * k6[i] + D47  * k7[i]  +
                                D48  * k8[i] + D49  * k9[i] + D410 * k10[i] +
                                D411 * k2[i] + D412 * k3[i]);
            hData[5 * n + i] = (D51  * k1[i] + D56  * k6[i] + D57  * k7[i]  +
                                D58  * k8[i] + D59  * k9[i] + D510 * k10[i] +
                                D511 * k2[i] + D512 * k3[i]);
            hData[6 * n + i] = (D61  * k1[i] + D66  * k6[i] + D67  * k7[i]  +
                                D68  * k8[i] + D69  * k9[i] + D610 * k10[i] +
                                D611 * k2[i] + D612 * k3[i]);
            hData[7 * n + i] = (D71  * k1[i] + D76  * k6[i] + D77  * k7[i]  +
                                D78  * k8[i] + D79  * k9[i] + D710 * k10[i] +
                                D711 * k2[i] + D712 * k3[i]);
        }

        // Then three more function evaluations
        for (i = 0; i < n; ++i) { // 51
            yNext[i] = y[i] + h * (A141  * k1[i]  + A147  * k7[i] +
                                   A148  * k8[i]  + A149  * k9[i] +
                                   A1410 * k10[i] + A1411 * k2[i] +
                                   A1412 * k3[i]  + A1413 * k4[i]);
        }
        this.rhs(t + C14 * h, yNext, k10);
        for (i = 0; i < n; ++i) { // 52
            yNext[i] = y[i] + h * (A151  * k1[i] + A156  * k6[i] +
                                   A157  * k7[i] + A158  * k8[i] +
                                   A1511 * k2[i] + A1512 * k3[i] +
                                   A1513 * k4[i] + A1514 * k10[i]);
        }
        this.rhs(t + C15 * h, yNext, k2);
        for (i = 0; i < n; ++i) { // 53
            yNext[i] = y[i] + h * (A161  * k1[i]  + A166  * k6[i] +
                                   A167  * k7[i]  + A168  * k8[i] +
                                   A169  * k9[i]  + A1613 * k4[i] +
                                   A1614 * k10[i] + A1615 * k2[i]);
        }
        this.rhs(t + C16 * h, yNext, k3);
        this.nEval += 4; // including the one on entry

        // Final history preparation
        for (i = 0; i < n; ++i) {
            hData[4 * n + i] = h * (hData[4 * n + i] +
                                    D413 * k4[i] + D414 * k10[i] +
                                    D415 * k2[i] + D416 * k3[i]);
            hData[5 * n + i] = h * (hData[5 * n + i] +
                                    D513 * k4[i] + D514 * k10[i] +
                                    D515 * k2[i] + D516 * k3[i]);
            hData[6 * n + i] = h * (hData[6 * n + i] +
                                    D613 * k4[i] + D614 * k10[i] +
                                    D615 * k2[i] + D616 * k3[i]);
            hData[7 * n + i] = h * (hData[7 * n + i] +
                                    D713 * k4[i] + D714 * k10[i] +
                                    D715 * k2[i] + D716 * k3[i]);
        }

        this.history.t = t;
        this.history.h = h;
    }

    public error(atol: number, rtol: number): number {
        let err = 0.0;
        let err2 = 0.0;
        let i = 0;
        for (i = 0; i < this.n; ++i) {
            const sk = atol + rtol * Math.max(
                Math.abs(this.y[i]), Math.abs(this.k5[i]));
            let erri = (this.k4[i] -
                        BHH1 * this.k1[i] -
                        BHH2 * this.k9[i] -
                        BHH3 * this.k3[i]);
            err2 += utils.square(erri / sk);
            erri = (ER1 * this.k1[i] +
                    ER6 * this.k6[i] +
                    ER7 * this.k7[i] +
                    ER8 * this.k8[i] +
                    ER9 * this.k9[i] +
                    ER10 * this.k10[i] +
                    ER11 * this.k2[i] +
                    ER12 * this.k3[i]);
            err += utils.square(erri / sk);
        }
        let deno = err + 0.01 * err2;
        // This is some sort of safety catch; it is never triggered in
        // the tests
        deno = deno < 0 ? 1.0 : deno;
        return err * Math.sqrt(1.0 / (this.n * deno));
    }

    public interpolate(t: number, history: HistoryElement): number[] {
        const hData = history.data;
        const theta = (t - history.t) / history.h;
        const theta1 = 1 - theta;

        const n = this.n;
        const ret = new Array<number>(n);
        for (let i = 0; i < n; ++i) {
            const tmp = hData[4 * n + i] + theta *
                (hData[5 * n + i] + theta1 *
                 (hData[6 * n + i] + theta *
                  hData[7 * n + i]));
            ret[i] = hData[i] + theta *
                (hData[n + i] + theta1 *
                 (hData[2 * n + i] + theta *
                  (hData[3 * n + i] + theta1 *
                   tmp)));
        }
        return ret;
    }

    public isStiff(h: number): boolean {
        let stnum = 0.0;
        let stden = 0.0;
        for (let i = 0; i < this.n; ++i) {
            stnum += utils.square(this.k4[i] - this.k3[i]);
            stden += utils.square(this.k5[i] - this.yNext[i]);
        }
        return stden > 0 && Math.abs(h) * Math.sqrt(stnum / stden) > 6.1;
    }

    public initialStepSize(t: number, atol: number, rtol: number): number {
        const stepSizeMax = this.stepControl.sizeMax;
        // NOTE: This is destructive with respect to most of the information
        // in the object; in particular k2, k3 will be modified.
        const f0 = this.k1;
        const f1 = this.k2;
        const y1 = this.k3;

        // Compute a first guess for explicit Euler as
        //   h = 0.01 * norm (y0) / norm (f0)
        // the increment for explicit euler is small compared to the solution
        this.rhs(t, this.y, f0);
        this.nEval++;

        let normF = 0.0;
        let normY = 0.0;
        let i = 0;
        for (i = 0; i < this.n; ++i) {
            const sk = atol + rtol * Math.abs(this.y[i]);
            normF += utils.square(f0[i] / sk);
            normY += utils.square(this.y[i]  / sk);
        }
        let h = (normF <= 1e-10 || normF <= 1e-10) ?
            1e-6 : Math.sqrt(normY / normF) * 0.01;
        h = Math.min(h, stepSizeMax);

        // Perform an explicit Euler step
        for (i = 0; i < this.n; ++i) {
            y1[i] = this.y[i] + h * f0[i];
        }
        this.rhs(t + h, y1, f1);
        this.nEval++;

        // Estimate the second derivative of the solution:
        let der2 = 0.0;
        for (i = 0; i < this.n; ++i) {
            const sk = atol + rtol * Math.abs(this.y[i]);
            der2 += utils.square((f1[i] - f0[i]) / sk);
        }
        der2 = Math.sqrt(der2) / h;

        // Step size is computed such that
        //   h^order * max(norm(f0), norm(der2)) = 0.01
        const der12 = Math.max(Math.abs(der2), Math.sqrt(normF));
        const h1 = (der12 <= 1e-15) ?
            Math.max(1e-6, Math.abs(h) * 1e-3) :
            Math.pow(0.01 / der12, 1.0 / this.order);
        h = Math.min(Math.min(100 * Math.abs(h), h1), stepSizeMax);
        return h;
    }

    public reset(t: number, y: number[]): void {
        for (let i = 0; i < this.n; ++i) {
            this.y[i] = y[i];
        }
        this.rhs(t, y, this.k1);
        this.nEval = 1;
    }
}
