import { FloatMatrix } from "../data/float-matrix";

// kernels

export class Kernels {
    static readonly SmoothKernel = new FloatMatrix(3, 3, [1, 1, 1, 1, 1, 1, 1, 1, 1]).forEachValue((i) => (i * 1) / 9);

    static readonly SmoothKernel5 = new FloatMatrix(5, 5, [
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
    ]).forEachValue((v) => (v * 1) / 25);

    static readonly Gauss5 = new FloatMatrix(5, 5, [
        2,
        4,
        5,
        4,
        2,
        4,
        9,
        12,
        9,
        4,
        5,
        12,
        15,
        12,
        5,
        4,
        9,
        12,
        9,
        4,
        2,
        4,
        5,
        4,
        2,
    ]).forEachValue((v) => (v * 1) / 159);

    static readonly TestKernel = new FloatMatrix(3, 3, [1, 0, -1, 0, 0, 0, -1, 0, 1]);

    static readonly SobelLeft = new FloatMatrix(3, 3, [1, 2, 1, 0, 0, 0, -1, -2, -1]);

    static readonly SobelRight = new FloatMatrix(3, 3, [-1, -2, -1, 0, 0, 0, 1, 2, 1]);

    static readonly SobelUp = new FloatMatrix(3, 3, [1, 0, -1, 2, 0, -2, 1, 0, -1]);

    static readonly SobelDown = new FloatMatrix(3, 3, [-1, 0, 1, -2, 0, 2, -1, 0, 1]);

    // inspired from https://github.com/yuta1984/CannyJS/blob/master/canny.js
    static generateGaussianKernel(sigmma: number, size: number) {
        // messy, probably auto-generated
        var e, gaussian, i, j, kernel, s, sum, x, y, _i, _j, _k, _l, _ref, _ref1, _ref2, _ref3;
        s = sigmma;
        e = 2.718;
        kernel = new FloatMatrix(size, size);
        sum = 0;
        for (i = _i = 0, _ref = size - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
            x = -(size - 1) / 2 + i;
            for (j = _j = 0, _ref1 = size - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
                y = -(size - 1) / 2 + j;
                gaussian = (1 / (2 * Math.PI * s * s)) * Math.pow(e, -(x * x + y * y) / (2 * s * s));
                kernel.set(i, j, gaussian);
                sum += gaussian;
            }
        }
        for (i = _k = 0, _ref2 = size - 1; 0 <= _ref2 ? _k <= _ref2 : _k >= _ref2; i = 0 <= _ref2 ? ++_k : --_k) {
            for (j = _l = 0, _ref3 = size - 1; 0 <= _ref3 ? _l <= _ref3 : _l >= _ref3; j = 0 <= _ref3 ? ++_l : --_l) {
                kernel.set(i, j, kernel.get(i, j) / sum);
            }
        }
        return kernel;
    }
}
