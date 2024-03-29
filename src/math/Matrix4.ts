// matrix
// author: Jos Feenstra
// TODO: FIX MATRIX4 !!!
// NOTE:

import { FloatMatrix } from "../data/FloatMatrix";
import { Matrix3 } from "./Matrix3";
import { Quaternion } from "./Quaternion";
import { Transform } from "./Transform";
import { Vector2 } from "./Vector2";
import { Vector3 } from "./Vector3";

// 4x4 matrix of floats used for 3d math
// inspired by Gregg Tavares.
export class Matrix4 extends FloatMatrix {
    constructor(data: number[] = []) {
        super(4, 4, data);
    }

    static new(data = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]) {
        return new Matrix4(data);
    }

    static newIdentity() {
        return new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    }

    static newCopy(other: Matrix4): Matrix4 {
        let result = new Matrix4();
        for (let i = 0; i < 16; i++) {
            result.data[i] = other.data[i];
        }
        return result;
    }

    get position() {
        let d = this.data;
        let pos = Vector3.new();
        pos.x = d[12];
        pos.y = d[13];
        pos.z = d[14];
        return pos;
    }

    clone(): Matrix4 {
        return Matrix4.newCopy(this);
    }

    copy(other: Matrix4) {
        for (let i = 0 ; i < 16; i++) {
            this.data[i] = other.data[i];
        }
        return this;
    }

    multiplied(other: Matrix4) {
        // NOTE: i swapped a and b, this makes more sense to me, but i could be wrong about it...
        const a = other.data;
        const b = this.data;

        var b00 = b[0 * 4 + 0];
        var b01 = b[0 * 4 + 1];
        var b02 = b[0 * 4 + 2];
        var b03 = b[0 * 4 + 3];
        var b10 = b[1 * 4 + 0];
        var b11 = b[1 * 4 + 1];
        var b12 = b[1 * 4 + 2];
        var b13 = b[1 * 4 + 3];
        var b20 = b[2 * 4 + 0];
        var b21 = b[2 * 4 + 1];
        var b22 = b[2 * 4 + 2];
        var b23 = b[2 * 4 + 3];
        var b30 = b[3 * 4 + 0];
        var b31 = b[3 * 4 + 1];
        var b32 = b[3 * 4 + 2];
        var b33 = b[3 * 4 + 3];
        var a00 = a[0 * 4 + 0];
        var a01 = a[0 * 4 + 1];
        var a02 = a[0 * 4 + 2];
        var a03 = a[0 * 4 + 3];
        var a10 = a[1 * 4 + 0];
        var a11 = a[1 * 4 + 1];
        var a12 = a[1 * 4 + 2];
        var a13 = a[1 * 4 + 3];
        var a20 = a[2 * 4 + 0];
        var a21 = a[2 * 4 + 1];
        var a22 = a[2 * 4 + 2];
        var a23 = a[2 * 4 + 3];
        var a30 = a[3 * 4 + 0];
        var a31 = a[3 * 4 + 1];
        var a32 = a[3 * 4 + 2];
        var a33 = a[3 * 4 + 3];

        return new Matrix4([
            b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
            b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
            b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
            b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
            b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
            b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
            b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
            b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
            b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
            b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
            b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
            b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
            b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
            b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
            b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
            b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
        ]);
    }

    multiply(other: Matrix4) {
        this.data = this.multiplied(other).data;
        return this;
    }

    transpose(): Matrix4 {
        let matrix = new Matrix4();

        let res = matrix.data;
        let old = this.data;

        res[0] = old[0];
        res[1] = old[4];
        res[2] = old[8];
        res[3] = old[12];
        res[4] = old[1];
        res[5] = old[5];
        res[6] = old[9];
        res[7] = old[13];
        res[8] = old[2];
        res[9] = old[6];
        res[10] = old[10];
        res[11] = old[14];
        res[12] = old[3];
        res[13] = old[7];
        res[14] = old[11];
        res[15] = old[15];

        return matrix;
    }

    static newLookAt(cameraPosition: Vector3, target: Vector3, up: Vector3): Matrix4 {
        let matrix = new Matrix4();
        let data = matrix.data;
        let zAxis = cameraPosition.clone().sub(target).normalize();
        let xAxis = up.clone().cross(up).normalize();
        let yAxis = zAxis.clone().cross(xAxis).normalize();

        data[0] = xAxis.x;
        data[1] = xAxis.y;
        data[2] = xAxis.z;
        data[3] = 0;
        data[4] = yAxis.x;
        data[5] = yAxis.y;
        data[6] = yAxis.z;
        data[7] = 0;
        data[8] = zAxis.x;
        data[9] = zAxis.y;
        data[10] = zAxis.z;
        data[11] = 0;
        data[12] = cameraPosition.x;
        data[13] = cameraPosition.y;
        data[14] = cameraPosition.z;
        data[15] = 1;

        return matrix;
    }

    /**
     * Computes a 4-by-4 perspective transformation matrix given the angular height
     * of the frustum, the aspect ratio, and the near and far clipping planes.  The
     * arguments define a frustum extending in the negative z direction.  The given
     * angle is the vertical angle of the frustum, and the horizontal angle is
     * determined to produce the given aspect ratio.  The arguments near and far are
     * the distances to the near and far clipping planes.  Note that near and far
     * are not z coordinates, but rather they are distances along the negative
     * z-axis.  The matrix generated sends the viewing frustum to the unit box.
     * We assume a unit box extending from -1 to 1 in the x and y dimensions and
     * from -1 to 1 in the z dimension.
     * @param {number} fieldOfViewInRadians field of view in y axis.
     * @param {number} aspect aspect of viewport (width / height)
     * @param {number} near near Z clipping plane
     * @param {number} far far Z clipping plane
     * @param {Matrix4} [dst] optional matrix to store result
     * @return {Matrix4} dst or a new matrix if none provided
     */
    static newPerspective(fov: number, aspect: number, near: number, far: number): Matrix4 {
        let matrix = new Matrix4();
        let data = matrix.data;

        var f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
        var rangeInv = 1.0 / (near - far);

        data[0] = f / aspect;
        data[1] = 0;
        data[2] = 0;
        data[3] = 0;
        data[4] = 0;
        data[5] = f;
        data[6] = 0;
        data[7] = 0;
        data[8] = 0;
        data[9] = 0;
        data[10] = (near + far) * rangeInv;
        data[11] = -1;
        data[12] = 0;
        data[13] = 0;
        data[14] = near * far * rangeInv * 2;
        data[15] = 0;

        return matrix;
    }

    /**
     * Computes a 4-by-4 orthographic projection matrix given the coordinates of the
     * planes defining the axis-aligned, box-shaped viewing volume.  The matrix
     * generated sends that box to the unit box.  Note that although left and right
     * are x coordinates and bottom and top are y coordinates, near and far
     * are not z coordinates, but rather they are distances along the negative
     * z-axis.  We assume a unit box extending from -1 to 1 in the x and y
     * dimensions and from -1 to 1 in the z dimension.
     * @param {number} left The x coordinate of the left plane of the box.
     * @param {number} right The x coordinate of the right plane of the box.
     * @param {number} bottom The y coordinate of the bottom plane of the box.
     * @param {number} top The y coordinate of the right plane of the box.
     * @param {number} near The negative z coordinate of the near plane of the box.
     * @param {number} far The negative z coordinate of the far plane of the box.
     * @param {Matrix4} [dst] optional matrix to store result
     * @return {Matrix4} dst or a new matrix if none provided
     */
    static newOrthographic(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number,
    ): Matrix4 {
        let matrix = new Matrix4();
        let dst = matrix.data;

        dst[0] = 2 / (right - left);
        dst[1] = 0;
        dst[2] = 0;
        dst[3] = 0;
        dst[4] = 0;
        dst[5] = 2 / (top - bottom);
        dst[6] = 0;
        dst[7] = 0;
        dst[8] = 0;
        dst[9] = 0;
        dst[10] = 2 / (near - far);
        dst[11] = 0;
        dst[12] = (left + right) / (left - right);
        dst[13] = (bottom + top) / (bottom - top);
        dst[14] = (near + far) / (near - far);
        dst[15] = 1;

        return matrix;
    }

    /**
     * Computes a 4-by-4 perspective transformation matrix given the left, right,
     * top, bottom, near and far clipping planes. The arguments define a frustum
     * extending in the negative z direction. The arguments near and far are the
     * distances to the near and far clipping planes. Note that near and far are not
     * z coordinates, but rather they are distances along the negative z-axis. The
     * matrix generated sends the viewing frustum to the unit box. We assume a unit
     * box extending from -1 to 1 in the x and y dimensions and from -1 to 1 in the z
     * dimension.
     * @param {number} left The x coordinate of the left plane of the box.
     * @param {number} right The x coordinate of the right plane of the box.
     * @param {number} bottom The y coordinate of the bottom plane of the box.
     * @param {number} top The y coordinate of the right plane of the box.
     * @param {number} near The negative z coordinate of the near plane of the box.
     * @param {number} far The negative z coordinate of the far plane of the box.
     * @param {Matrix4} [dst] optional matrix to store result
     * @return {Matrix4} dst or a new matrix if none provided
     */
    static newFrustum(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number,
    ): Matrix4 {
        let matrix = new Matrix4();
        let dst = matrix.data;

        var dx = right - left;
        var dy = top - bottom;
        var dz = far - near;

        dst[0] = (2 * near) / dx;
        dst[1] = 0;
        dst[2] = 0;
        dst[3] = 0;
        dst[4] = 0;
        dst[5] = (2 * near) / dy;
        dst[6] = 0;
        dst[7] = 0;
        dst[8] = (left + right) / dx;
        dst[9] = (top + bottom) / dy;
        dst[10] = -(far + near) / dz;
        dst[11] = -1;
        dst[12] = 0;
        dst[13] = 0;
        dst[14] = (-2 * near * far) / dz;
        dst[15] = 0;

        return matrix;
    }

    static newTranslation(tx: number, ty: number, tz: number, matrix = Matrix4.new()): Matrix4 {
        let data = matrix.data;
        data[12] = tx;
        data[13] = ty;
        data[14] = tz;
        
        return matrix;
    }

    static newTranslate(v: Vector3, matrix = Matrix4.new()): Matrix4 {
        let data = matrix.data;
        data[12] = v.x;
        data[13] = v.y;
        data[14] = v.z;
        
        return matrix;
    }

    // static newRotate(euler: Vector3) {
    //     return Matrix4.newRotation(euler.x, euler.y, euler.z);
    // }

    // static newRotation(pitch: number, yaw: number, roll: number) {
        
        
    //     let rotation = Matrix4.new();
    //     let rd = rotation.data;

    //     rd[0] *= pitch;
    //     rd[1] *= pitch;
    //     rd[2] *= pitch;

    //     rd[4] *= yaw;
    //     rd[5] *= yaw;
    //     rd[6] *= yaw;

    //     rd[8] *= roll;
    //     rd[9] *= roll;
    //     rd[10] *= roll;

    //     return rotation;
    // }

    static newXRotation(angleInRadians: number, matrix=Matrix4.newIdentity()) {
        let data = matrix.data;
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        // return new Matrix4(
        //     [1, 0, 0, 0, 
        //     0, c, -s, 0, 
        //     0, s, c, 0,
        //      0, 0, 0, 1]);
        data[5] = c;
        data[6] = -s;
        data[9] = s;
        data[10] = c;
        return matrix;
    }

    static newYRotation(angleInRadians: number, matrix=Matrix4.newIdentity()) {
        let data = matrix.data;
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        // return new Matrix4([c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1]);
        data[0] = c;
        data[2] = s;
        data[8] = -s;
        data[10] = c;
        return matrix;
    }

    static newZRotation(angleInRadians: number, matrix=Matrix4.newIdentity()) {
        let data = matrix.data;

        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        data[0] = c;
        data[1] = s;
        data[4] = -s;
        data[5] = c;

        return matrix;
    }

    /**
     * Makes an rotation matrix around an arbitrary axis
     * @param {Vector3} axis axis to rotate around
     * @param {number} angleInRadians amount to rotate
     * @return {Matrix4} dst or a new matrix if none provided
     */
    static newAxisRotation(axis: Vector3, angleInRadians: number) {
        let matrix = new Matrix4();
        let dst = matrix.data;

        let x = axis.x;
        let y = axis.y;
        let z = axis.z;
        let n = Math.sqrt(x * x + y * y + z * z);
        x /= n;
        y /= n;
        z /= n;
        let xx = x * x;
        let yy = y * y;
        let zz = z * z;
        let c = Math.cos(angleInRadians);
        let s = Math.sin(angleInRadians);
        let oneMinusCosine = 1 - c;

        dst[0] = xx + (1 - xx) * c;
        dst[1] = x * y * oneMinusCosine + z * s;
        dst[2] = x * z * oneMinusCosine - y * s;
        dst[3] = 0;
        dst[4] = x * y * oneMinusCosine - z * s;
        dst[5] = yy + (1 - yy) * c;
        dst[6] = y * z * oneMinusCosine + x * s;
        dst[7] = 0;
        dst[8] = x * z * oneMinusCosine + y * s;
        dst[9] = y * z * oneMinusCosine - x * s;
        dst[10] = zz + (1 - zz) * c;
        dst[11] = 0;
        dst[12] = 0;
        dst[13] = 0;
        dst[14] = 0;
        dst[15] = 1;

        return matrix;
    }

    /**
     * Multiply by an axis rotation matrix
     * @param {Matrix4} m matrix to multiply
     * @param {Vector3} axis axis to rotate around
     * @param {number} angleInRadians amount to rotate
     * @param {Matrix4} [dst] optional matrix to store result
     * @return {Matrix4} dst or a new matrix if none provided
     * @memberOf module:webgl-3d-math
     */
    axisRotate(axis: Vector3, angleInRadians: number): Matrix4 {
        // This is the optimized version of
        // return multiply(m, axisRotation(axis, angleInRadians), dst);
        let matrix = new Matrix4();
        let dst = matrix.data;
        let m = this.data;

        var x = axis.x;
        var y = axis.y;
        var z = axis.z;
        var n = Math.sqrt(x * x + y * y + z * z);
        x /= n;
        y /= n;
        z /= n;
        var xx = x * x;
        var yy = y * y;
        var zz = z * z;
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
        var oneMinusCosine = 1 - c;

        var r00 = xx + (1 - xx) * c;
        var r01 = x * y * oneMinusCosine + z * s;
        var r02 = x * z * oneMinusCosine - y * s;
        var r10 = x * y * oneMinusCosine - z * s;
        var r11 = yy + (1 - yy) * c;
        var r12 = y * z * oneMinusCosine + x * s;
        var r20 = x * z * oneMinusCosine + y * s;
        var r21 = y * z * oneMinusCosine - x * s;
        var r22 = zz + (1 - zz) * c;

        var m00 = m[0];
        var m01 = m[1];
        var m02 = m[2];
        var m03 = m[3];
        var m10 = m[4];
        var m11 = m[5];
        var m12 = m[6];
        var m13 = m[7];
        var m20 = m[8];
        var m21 = m[9];
        var m22 = m[10];
        var m23 = m[11];

        dst[0] = r00 * m00 + r01 * m10 + r02 * m20;
        dst[1] = r00 * m01 + r01 * m11 + r02 * m21;
        dst[2] = r00 * m02 + r01 * m12 + r02 * m22;
        dst[3] = r00 * m03 + r01 * m13 + r02 * m23;
        dst[4] = r10 * m00 + r11 * m10 + r12 * m20;
        dst[5] = r10 * m01 + r11 * m11 + r12 * m21;
        dst[6] = r10 * m02 + r11 * m12 + r12 * m22;
        dst[7] = r10 * m03 + r11 * m13 + r12 * m23;
        dst[8] = r20 * m00 + r21 * m10 + r22 * m20;
        dst[9] = r20 * m01 + r21 * m11 + r22 * m21;
        dst[10] = r20 * m02 + r21 * m12 + r22 * m22;
        dst[11] = r20 * m03 + r21 * m13 + r22 * m23;

        if (m !== dst) {
            dst[12] = m[12];
            dst[13] = m[13];
            dst[14] = m[14];
            dst[15] = m[15];
        }

        return matrix;
    }

    // make a scaling matrix
    static newScaler(sx: number, sy: number, sz: number): Matrix4 {
        return new Matrix4([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1]);
    }

    /**
     * Multiply by a scaling matrix
     * @param {Matrix4} m matrix to multiply
     * @param {number} sx x scale.
     * @param {number} sy y scale.
     * @param {number} sz z scale.
     * @return {Matrix4} dst or a new matrix if none provided
     * @memberOf module:webgl-3d-math
     */
    scale(sx: number, sy: number, sz: number): Matrix4 {
        // This is the optimized version of
        // return multiply(m, scaling(sx, sy, sz), dst);

        let matrix = new Matrix4();
        let dst = matrix.data;
        let m = this.data;

        dst[0] = sx * m[0 * 4 + 0];
        dst[1] = sx * m[0 * 4 + 1];
        dst[2] = sx * m[0 * 4 + 2];
        dst[3] = sx * m[0 * 4 + 3];
        dst[4] = sy * m[1 * 4 + 0];
        dst[5] = sy * m[1 * 4 + 1];
        dst[6] = sy * m[1 * 4 + 2];
        dst[7] = sy * m[1 * 4 + 3];
        dst[8] = sz * m[2 * 4 + 0];
        dst[9] = sz * m[2 * 4 + 1];
        dst[10] = sz * m[2 * 4 + 2];
        dst[11] = sz * m[2 * 4 + 3];

        if (m !== dst) {
            dst[12] = m[12];
            dst[13] = m[13];
            dst[14] = m[14];
            dst[15] = m[15];
        }

        return matrix;
    }

    static fromXform(xform: Transform, matrix = new Matrix4()) {
        return Matrix4.fromPosRotScale(xform.pos, xform.rot, xform.scale, matrix);
    }

    /**
     * creates a matrix from translation, quaternion, scale
     */
    static fromPosRotScale(pos: Vector3, rot: Quaternion, scale: Vector3, matrix = new Matrix4()): Matrix4 {

        const rx = rot.x;
        const ry = rot.y;
        const rz = rot.z;
        const rw = rot.w;

        const sx = scale.x;
        const sy = scale.y;
        const sz = scale.z;

        const x2 = rx + rx;
        const y2 = ry + ry;
        const z2 = rz + rz;

        const xx = rx * x2;
        const xy = rx * y2;
        const xz = rx * z2;

        const yy = ry * y2;
        const yz = ry * z2;
        const zz = rz * z2;

        const wx = rw * x2;
        const wy = rw * y2;
        const wz = rw * z2;

        matrix.data[0] = (1 - (yy + zz)) * sx;
        matrix.data[1] = (xy + wz) * sx;
        matrix.data[2] = (xz - wy) * sx;
        matrix.data[3] = 0;
        matrix.data[4] = (xy - wz) * sy;
        matrix.data[5] = (1 - (xx + zz)) * sy;
        matrix.data[6] = (yz + wx) * sy;
        matrix.data[7] = 0;
        matrix.data[8] = (xz + wy) * sz;
        matrix.data[9] = (yz - wx) * sz;
        matrix.data[10] = (1 - (xx + yy)) * sz;
        matrix.data[11] = 0;
        matrix.data[12] = pos.x;
        matrix.data[13] = pos.y;
        matrix.data[14] = pos.z;
        matrix.data[15] = 1;

        return matrix;
    }

    toTransform(xform=Transform.new()) : Transform {
        xform.setWithMatrix(this);
        return xform;
    }

    determinant(): number {
        const m = this.data;

        const m00 = m[0];
        const m01 = m[1];
        const m02 = m[2];
        const m03 = m[3];
        const m10 = m[4];
        const m11 = m[5];
        const m12 = m[6];
        const m13 = m[7];
        const m20 = m[8];
        const m21 = m[9];
        const m22 = m[10];
        const m23 = m[11];
        const m30 = m[12];
        const m31 = m[13];
        const m32 = m[14];
        const m33 = m[15];

        const tmp_0 = m22 * m33;
        const tmp_1 = m32 * m23;
        const tmp_2 = m12 * m33;
        const tmp_3 = m32 * m13;
        const tmp_4 = m12 * m23;
        const tmp_5 = m22 * m13;
        const tmp_6 = m02 * m33;
        const tmp_7 = m32 * m03;
        const tmp_8 = m02 * m23;
        const tmp_9 = m22 * m03;
        const tmp_10 = m02 * m13;
        const tmp_11 = m12 * m03;

        const t0 = tmp_0 * m11 + tmp_3 * m21 + tmp_4  * m31 - (tmp_1 * m11 + tmp_2 * m21 + tmp_5  * m31);
        const t1 = tmp_1 * m01 + tmp_6 * m21 + tmp_9  * m31 - (tmp_0 * m01 + tmp_7 * m21 + tmp_8  * m31);
        const t2 = tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31 - (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
        const t3 = tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21 - (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

        return 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
    }

    inverse(matrix = new Matrix4()): Matrix4 {

        let dst = matrix.data;
        let m = this.data;

        var m00 = m[0 * 4 + 0];
        var m01 = m[0 * 4 + 1];
        var m02 = m[0 * 4 + 2];
        var m03 = m[0 * 4 + 3];
        var m10 = m[1 * 4 + 0];
        var m11 = m[1 * 4 + 1];
        var m12 = m[1 * 4 + 2];
        var m13 = m[1 * 4 + 3];
        var m20 = m[2 * 4 + 0];
        var m21 = m[2 * 4 + 1];
        var m22 = m[2 * 4 + 2];
        var m23 = m[2 * 4 + 3];
        var m30 = m[3 * 4 + 0];
        var m31 = m[3 * 4 + 1];
        var m32 = m[3 * 4 + 2];
        var m33 = m[3 * 4 + 3];

        var tmp_0 = m22 * m33;
        var tmp_1 = m32 * m23;
        var tmp_2 = m12 * m33;
        var tmp_3 = m32 * m13;
        var tmp_4 = m12 * m23;
        var tmp_5 = m22 * m13;
        var tmp_6 = m02 * m33;
        var tmp_7 = m32 * m03;
        var tmp_8 = m02 * m23;
        var tmp_9 = m22 * m03;
        var tmp_10 = m02 * m13;
        var tmp_11 = m12 * m03;
        var tmp_12 = m20 * m31;
        var tmp_13 = m30 * m21;
        var tmp_14 = m10 * m31;
        var tmp_15 = m30 * m11;
        var tmp_16 = m10 * m21;
        var tmp_17 = m20 * m11;
        var tmp_18 = m00 * m31;
        var tmp_19 = m30 * m01;
        var tmp_20 = m00 * m21;
        var tmp_21 = m20 * m01;
        var tmp_22 = m00 * m11;
        var tmp_23 = m10 * m01;

        var t0 =
            tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31 - (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
        var t1 =
            tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31 - (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
        var t2 =
            tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31 - (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
        var t3 =
            tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21 - (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

        var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

        dst[0] = d * t0;
        dst[1] = d * t1;
        dst[2] = d * t2;
        dst[3] = d * t3;
        dst[4] =
            d *
            (tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30 - (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
        dst[5] =
            d *
            (tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30 - (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
        dst[6] =
            d *
            (tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30 - (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
        dst[7] =
            d *
            (tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20 - (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
        dst[8] =
            d *
            (tmp_12 * m13 +
                tmp_15 * m23 +
                tmp_16 * m33 -
                (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
        dst[9] =
            d *
            (tmp_13 * m03 +
                tmp_18 * m23 +
                tmp_21 * m33 -
                (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
        dst[10] =
            d *
            (tmp_14 * m03 +
                tmp_19 * m13 +
                tmp_22 * m33 -
                (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
        dst[11] =
            d *
            (tmp_17 * m03 +
                tmp_20 * m13 +
                tmp_23 * m23 -
                (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
        dst[12] =
            d *
            (tmp_14 * m22 +
                tmp_17 * m32 +
                tmp_13 * m12 -
                (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
        dst[13] =
            d *
            (tmp_20 * m32 +
                tmp_12 * m02 +
                tmp_19 * m22 -
                (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
        dst[14] =
            d *
            (tmp_18 * m12 +
                tmp_23 * m32 +
                tmp_15 * m02 -
                (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
        dst[15] =
            d *
            (tmp_22 * m22 +
                tmp_16 * m02 +
                tmp_21 * m12 -
                (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));

        return matrix;
    }

    multiplyVector(v: Vector3): Vector3 {
        let data = new Array(3);
        for (var i = 0; i < 3; ++i) {
            data[i] = 0.0;
            for (var j = 0; j < 4; ++j) {
                data[i] += v.item(j) * this.get(j, i);
            }
        }
        return new Vector3(data[0], data[1], data[2]);
    }

    multipliedVectorList(vecs: Vector3[]) {
        let result = Array<Vector3>(vecs.length);
        for (let i = 0; i < vecs.length; i++) {
            result[i] = this.multiplyVector(vecs[i]);
        }
        return result;
    }

    // /**
    //  * Takes a 4-by-4 matrix and a vector with 3 entries,
    //  * interprets the vector as a point, transforms that point by the matrix, and
    //  * returns the result as a vector with 3 entries.
    //  * @param {Matrix4} m The matrix.
    //  * @param {Vector3} v The point.
    //  * @param {Vector4} dst optional vector4 to store result
    //  * @return {Vector4} dst or new Vector4 if not provided
    //  * @memberOf module:webgl-3d-math
    //  */
    // function transformPoint(m, v, dst) {
    //     dst = dst || new MatType(3);
    //     var v0 = v[0];
    //     var v1 = v[1];
    //     var v2 = v[2];
    //     var d = v0 * m[0 * 4 + 3] + v1 * m[1 * 4 + 3] + v2 * m[2 * 4 + 3] + m[3 * 4 + 3];

    //     dst[0] = (v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0] + m[3 * 4 + 0]) / d;
    //     dst[1] = (v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1] + m[3 * 4 + 1]) / d;
    //     dst[2] = (v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2] + m[3 * 4 + 2]) / d;

    //     return dst;
    // }

    // /**
    //  * Takes a 4-by-4 matrix and a vector with 3 entries, interprets the vector as a
    //  * direction, transforms that direction by the matrix, and returns the result;
    //  * assumes the transformation of 3-dimensional space represented by the matrix
    //  * is parallel-preserving, i.e. any combination of rotation, scaling and
    //  * translation, but not a perspective distortion. Returns a vector with 3
    //  * entries.
    //  * @param {Matrix4} m The matrix.
    //  * @param {Vector3} v The direction.
    //  * @param {Vector4} dst optional vector4 to store result
    //  * @return {Vector4} dst or new Vector4 if not provided
    //  * @memberOf module:webgl-3d-math
    //  */
    // function transformDirection(m, v, dst) {
    //     dst = dst || new MatType(3);

    //     var v0 = v[0];
    //     var v1 = v[1];
    //     var v2 = v[2];

    //     dst[0] = v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0];
    //     dst[1] = v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1];
    //     dst[2] = v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2];

    //     return dst;
    // }

    // /**
    //  * Takes a 4-by-4 matrix m and a vector v with 3 entries, interprets the vector
    //  * as a normal to a surface, and computes a vector which is normal upon
    //  * transforming that surface by the matrix. The effect of this function is the
    //  * same as transforming v (as a direction) by the inverse-transpose of m.  This
    //  * function assumes the transformation of 3-dimensional space represented by the
    //  * matrix is parallel-preserving, i.e. any combination of rotation, scaling and
    //  * translation, but not a perspective distortion.  Returns a vector with 3
    //  * entries.
    //  * @param {Matrix4} m The matrix.
    //  * @param {Vector3} v The normal.
    //  * @param {Vector3} [dst] The direction.
    //  * @return {Vector3} The transformed direction.
    //  * @memberOf module:webgl-3d-math
    //  */
    // function transformNormal(m, v, dst) {
    //     dst = dst || new MatType(3);
    //     var mi = inverse(m);
    //     var v0 = v[0];
    //     var v1 = v[1];
    //     var v2 = v[2];

    //     dst[0] = v0 * mi[0 * 4 + 0] + v1 * mi[0 * 4 + 1] + v2 * mi[0 * 4 + 2];
    //     dst[1] = v0 * mi[1 * 4 + 0] + v1 * mi[1 * 4 + 1] + v2 * mi[1 * 4 + 2];
    //     dst[2] = v0 * mi[2 * 4 + 0] + v1 * mi[2 * 4 + 1] + v2 * mi[2 * 4 + 2];

    //     return dst;
    // }
}
