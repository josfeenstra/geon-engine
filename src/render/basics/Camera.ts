// author : Jos Feenstra
// purpose : contain all logic regarding

import { KeyboardHandler } from "../../input/KeyboardHandler";
import { MouseHandler } from "../../input/MouseHandler";
import { TouchHandler } from "../../input/TouchHandler";
import { Vector3, Vector2, Plane, Matrix4, InputState, GeonMath, Ray, Matrix3, InputHandler, Debug, Key, Pointertype } from "../../lib";
import { Transform } from "../../math/Transform";

enum MoveMode {
    None,
    Rotate,
    Pan,
    Zoom,        
}


export class Camera {

    pos: Vector3;
    offset: Vector3; // offset from rotation center
    angleAlpha = 0; // rotation x
    angleBeta = 0; // rotation y
    mousePos = Vector2.zero();

    // camera matrix properties
    fov = (20 * Math.PI) / 100;
    zFar = 10000;
    zNear = 0.01;

    // other consts
    speed = 10;
    rotateSmoothener = 0.9; // 0: no smooth | 0.99: suuuuper smooth
    scrollSmoothener = 0.9; // 0: no smooth | 0.99: suuuuper smooth

    worldPlane = Plane.WorldXY();

    xform?: Transform;

    positionM = Matrix4.new();
    rotateXRev = Matrix4.new();
    rotateZRev = Matrix4.new();
    rotateX = Matrix4.new();
    rotateZ = Matrix4.new();
    rotate = Matrix4.new();

    totalMatrix!: Matrix4;
    worldMatrix!: Matrix4;
    projectMatrix!: Matrix4;
    inverseWorldMatrix!: Matrix4;
    inverseTotalViewMatrix!: Matrix4;

    calculateInverseMatrices = true;

    // settings
    canMove: boolean;
    canControl: any;
    inverseTransposeMatrix!: Matrix4;

    // stuff for smooth camera
    rotateDropoffDelta = Vector2.zero();
    zoomDelta = 0;
    // scrollPrev = 0;
    
    constructor(canvas: HTMLCanvasElement, z_offset = 1, canMove = false, canControl = true) {
        this.canMove = canMove;
        this.canControl = canControl;

        this.pos = new Vector3(0, 0, 0);
        this.offset = new Vector3(0, 0, -z_offset);
        this.updateMatrices(canvas.width, canvas.height);
    }

    get zoom() {
        return this.offset.z;
    }

    set zoom(value: number) {
        this.offset.z = value;
    }

    static new(canvas: HTMLCanvasElement, zOffset = 1, canMove = false) {
        return new Camera(canvas, zOffset, canMove);
    }

    /**
     * New way of updating. Has touch support
     */
    update(state: InputHandler, forceUpdate = true) : boolean {
        let hasChanged = this.updateControls(state);
        if (hasChanged || forceUpdate) {
            this.updateMatrices(state.width, state.height); // TODO only move if we have changed
        }
        state.keys?.onPressed(Key.P, this.printState.bind(this));
        // this.updateOtherControls(state);
        return hasChanged;
    }

    updateOld(state: InputState, forceUpdate = true) : boolean {
        let hasChanged = this.updateControlsOld(state);
        if (hasChanged || forceUpdate) {
            this.updateMatrices(state.canvas.width, state.canvas.height); // TODO only move if we have changed
        }
        
        if (state.IsKeyPressed('p')) this.printState();
        
        return hasChanged;
    }

    printState() {
        // make camera debuggable, and create a way to get camera positions
        Debug.log(
            `camera state: [${this.pos.x.toPrecision(5)}, ${this.pos.y.toPrecision(
                5,
            )}, ${this.pos.z.toPrecision(5)}, ${this.zoom}, ${this.angleAlpha},${
                this.angleBeta
            }]`,
        );

        // console.log(
        //     `printing camera status.
        //     pos: ${this.pos},
        //     offset: ${this.offset},
        //     speed: ${this.speed},
        //     alpha ${this.angleAlpha},
        //     beta: ${this.angleBeta}`,
        // );

        Debug.log("speed is now: " + this.speed);
    }

    // just a quick way of getting & setting

    getActualPosition() {
        // TODO MUST BE WAY QUICKER!!!
        return this.inverseWorldMatrix.multiplyVector(Vector3.zero());
    }

    getState(): number[] {
        return [this.pos.x, this.pos.y, this.pos.z, this.zoom, this.angleAlpha, this.angleBeta];
    }

    setState(state: number[]) {
        this.pos.x = state[0];
        this.pos.y = state[1];
        this.pos.z = state[2];
        this.zoom = state[3];
        this.angleAlpha = state[4];
        this.angleBeta = state[5];
    }

    set(offset: number, alpha: number, beta: number) {
        this.zoom = offset;
        this.angleAlpha = alpha;
        this.angleBeta = beta;
    }

    updateMatrices(width: number, height: number) {

        // 1 : calculate world matrix
        let offset = this.offset;

        // translate so z means 'up'
        // let yzFlip = new Matrix4([1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]);

        // translated to fit screen
        let mOffset = Matrix4.newTranslation(offset.x, offset.y, offset.z);
        let camMatrix : Matrix4;
        if (!this.xform) {
            let position = Matrix4.newTranslation(this.pos.x, this.pos.y, this.pos.z);
            
            // rotated by user
            this.rotateX = Matrix4.newXRotation(this.angleAlpha, this.rotateX);
            this.rotateXRev = Matrix4.newXRotation(-this.angleAlpha, this.rotateXRev);
            this.rotateZ = Matrix4.newZRotation(this.angleBeta, this.rotateZ);
            this.rotateZRev = Matrix4.newZRotation(-this.angleBeta, this.rotateZRev);
            this.rotate.copy(this.rotateZ).multiply(this.rotateX);
            camMatrix = position.multiply(this.rotate);
        } else {
            camMatrix = this.xform.toMatrix().inverse();
        }

        // let transform = mOffset.multiply(rotation).multiply(position);
        let worldMatrix = camMatrix.multiply(mOffset);

        // 2 : project & total
        let projectMatrix = this.getProjectionMatrix(width, height); // THIS IS MORE OR LESS STATIC, CACHE IT!
        let totalMatrix = worldMatrix.multiplied(projectMatrix);

        // translation = 0
        var viewDirectionMatrix = Matrix4.newCopy(worldMatrix);
        viewDirectionMatrix.data[12] = 0;
        viewDirectionMatrix.data[13] = 0;
        viewDirectionMatrix.data[14] = 0;

        let totalViewMatrix = this.rotate.multiplied(projectMatrix);

        this.worldMatrix = worldMatrix;
        this.projectMatrix = projectMatrix;
        this.totalMatrix = totalMatrix; 

        // early out: matrix inverses every frame? dont do it if it is not needed!
        if (this.calculateInverseMatrices) {
            this.inverseWorldMatrix = this.worldMatrix.inverse();
            this.inverseTransposeMatrix = this.inverseWorldMatrix.transpose(); 
            this.inverseTotalViewMatrix = totalViewMatrix.inverse();
        }
    }

    lookat(position: Vector3, target: Vector3) {
        // set matrices to the thing
        let matrix = Matrix4.newLookAt(position, target, this.worldPlane.khat);
    }

    ///////////////////////////////////////////////////////////////////////////

    private updateControlsOld(state: InputState) {

        // dont update controls if we are not allowed to
        if (!this.canControl) {
            return false;
        }
        
        // determine control values using 'state';
        let mode = this.getMoveModeFromKeyboard(state);
        let prevPos = this.mousePos.clone();
        let pos = state.mousePos.clone();
        this.mousePos = pos;
        let delta = prevPos.clone().sub(this.mousePos);
        let scrollDelta = state.mouseScrollDelta;

        // update things
        let hasChanged1 = this.updatePointerControls(mode, delta, scrollDelta);
        let hasChanged2 = this.updateKeyboardControlsOld(state);
        this.updatePointerStyle();

        return hasChanged1 || hasChanged2;
    }

    private updateControls(input: InputHandler) {
        
        if (!this.canControl) {
            return false;
        }

        let mode = MoveMode.None;
        let delta = Vector2.zero();
        let scrollDelta = 0;
        let hasChanged1 = false;
        let hasChanged2 = false;

        if (input.touch) {
            mode = this.getMoveModeFromTouch(input.touch);
            if (input.touch.down > 0) {
                delta = input.touch.fingers[0].delta;
                this.mousePos.copy(input.touch.fingers[0].pos); 
            } else {
                delta = Vector2.zero();
            }

            if (mode == MoveMode.Zoom) {
                delta.x = 0;
                delta.y = 0; // input.touch.zoomDelta
                scrollDelta = input.touch.zoomDelta * 0.05;
            }
        } 

        if (input.mouse) {
            mode = this.getMoveModeFromKeyboardNew(input.keys!, input.mouse);
            let prevPos = this.mousePos.clone();
            let pos = input.mouse.pos.clone();
            this.mousePos = pos;
            delta = prevPos.clone().sub(this.mousePos);
            this.scrollSmoothener = 0.90;
            scrollDelta = input.mouse.scrollDelta * 3;
        } 

        if (input.keys) {
            hasChanged2 = this.updateKeyboardControls(input.keys);
        }

        hasChanged1 = this.updatePointerControls(mode, delta, scrollDelta);
        this.updatePointerStyle();

        return hasChanged1 || hasChanged2;
    }

    private getMoveModeFromTouch(touch: TouchHandler) {

        if (touch.down > 3) {
            return MoveMode.Pan;
        } else if (touch.down == 2) {
            return MoveMode.Zoom;
        } else if (touch.down == 1) {
            return MoveMode.Rotate;
        } else {
            return MoveMode.None;
        }
    }

    private getMoveModeFromKeyboard(state: InputState) : MoveMode {
        
        let isMouseRightDown = state.mouseRightDown; 
        let isControlDown = state.IsKeyDown('control');
        let isShiftDown = state.IsKeyDown('shift');
        
        if (isMouseRightDown && !isControlDown && !isShiftDown) {
            return MoveMode.Rotate;
        } else if (isMouseRightDown && isControlDown && !isShiftDown) {
            return MoveMode.Zoom;
        } else if (state.mouseRightDown && !isControlDown && isShiftDown) {
            return MoveMode.Pan;
        } else {
            return MoveMode.None;
        }
    }

    private getMoveModeFromKeyboardNew(keys: KeyboardHandler, mouse: MouseHandler) : MoveMode {
        
        let isMouseRightDown = mouse.rightDown; 
        let isControlDown = keys.isDown(Key.Ctrl);
        let isShiftDown = keys.isDown(Key.Shift);
        
        if (isMouseRightDown && !isControlDown && !isShiftDown) {
            return MoveMode.Rotate;
        } else if (isMouseRightDown && isControlDown && !isShiftDown) {
            return MoveMode.Zoom;
        } else if (isMouseRightDown && !isControlDown && isShiftDown) {
            return MoveMode.Pan;
        } else {
            return MoveMode.None;
        }
    }


    private updatePointerControls(mode: MoveMode, delta: Vector2, scrollDelta: number) : boolean {

        let hasChanged = false;
        if (!this.canControl) {
            return hasChanged;
        }
        
        // rotate the camera : apply
        if (mode == MoveMode.Rotate) {
            hasChanged = delta.y != 0 || delta.x != 0;
            this.rotateDropoffDelta.copy(delta);
        }

        // rotate the camera : we use a dropoff to make it smooth
        if (!this.rotateDropoffDelta.roughlyEquals(Vector2._zero, 0.1)) {
            hasChanged = true;
            let rd = 0.003; // rotate dampner
            this.angleAlpha = GeonMath.clamp(this.angleAlpha + this.rotateDropoffDelta.y * rd, 0, Math.PI);
            this.angleBeta += this.rotateDropoffDelta.x * -rd;
            this.rotateDropoffDelta.scale(this.rotateSmoothener)
        }
        
        // zoom the camera : apply scroll
        if (scrollDelta != 0) {
            let sd = 0.03; // scroll dampner
            this.zoomDelta += scrollDelta * sd; 
        }

        // zoom the camera : apply mouse move
        if (mode == MoveMode.Zoom) {
            this.zoomDelta -= delta.y * 0.0005;
        }

        // zoom the camera : apply dropoff effect
        if (!GeonMath.isRougly(this.zoomDelta, 0, 0.001)) {
            hasChanged = true;
            this.zoom = Math.min(-0.001, this.zoom * (1 + this.zoomDelta));
            this.zoomDelta *= this.scrollSmoothener;
        }

        // pan the camera : no dropoff
        if (mode == MoveMode.Pan) {
            hasChanged = true;
            this.pos.add(this.getRelativeUnitX().scale(0.0005 * this.zoom * delta.x));
            this.pos.add(this.getRelativeTrueUnitY().scale(0.0005 * this.zoom * -delta.y));
        }

        return hasChanged;
    }

    private updatePointerStyle() {
        // if (isShiftDown && !isControlDown) {
        //     state.setCursorStyle('move');
        // } else if (!isShiftDown && isControlDown) {
        //     if (delta.y > 0) {
        //         state.setCursorStyle('zoom-out');
        //     } else {
        //         state.setCursorStyle('zoom-in');
        //     }
        // } else if (state.mouseRightDown) {
        //     state.setCursorStyle('crosshair');
        // } else {
        //     state.setCursorStyle('default');
        // }
    }

    private updateKeyboardControlsOld(state: InputState) {
        
        let hasChanged = false;

        if (state.IsKeyPressed("r")) {
            this.speed *= 2;
        }
        if (state.IsKeyPressed("f")) {
            this.speed = Math.max(this.speed * 0.5, 0.1);
        }
        if (!this.canMove) {
            return hasChanged;
        }
        if (state.IsKeyDown("s")) {
            hasChanged = true;
            this.pos.add(this.getRelativeUnitY().scale(0.01 * this.speed));
        }
        if (state.IsKeyDown("w")) {
            hasChanged = true;
            this.pos.add(this.getRelativeUnitY().scale(-0.01 * this.speed));
        }
        if (state.IsKeyDown("a")) {
            hasChanged = true;
            this.pos.add(this.getRelativeUnitX().scale(0.01 * this.speed));
        }
        if (state.IsKeyDown("d")) {
            hasChanged = true;
            this.pos.add(this.getRelativeUnitX().scale(-0.01 * this.speed));
        }
        if (state.IsKeyDown("q")) {
            hasChanged = true;
            this.pos.z += 0.01 * this.speed;
        }
        if (state.IsKeyDown("e")) {
            hasChanged = true;
            this.pos.z -= 0.01 * this.speed;
        }
        return hasChanged;
    }

    private updateKeyboardControls(state: KeyboardHandler) {
        
        let hasChanged = false;

        if (state.isPressed(Key.R)) {
            this.speed *= 2;
        }
        if (state.isPressed(Key.F)) {
            this.speed = Math.max(this.speed * 0.5, 0.1);
        }
        if (!this.canMove) {
            return hasChanged;
        }
        if (state.isDown(Key.S)) {
            hasChanged = true;
            this.pos.add(this.getRelativeUnitY().scale(0.01 * this.speed * -this.zoom));
        }
        if (state.isDown(Key.W)) {
            hasChanged = true;
            this.pos.add(this.getRelativeUnitY().scale(-0.01 * this.speed * -this.zoom));
        }
        if (state.isDown(Key.A)) {
            hasChanged = true;
            this.pos.add(this.getRelativeUnitX().scale(0.01 * this.speed * -this.zoom));
        }
        if (state.isDown(Key.D)) {
            hasChanged = true;
            this.pos.add(this.getRelativeUnitX().scale(-0.01 * this.speed * -this.zoom));
        }
        if (state.isDown(Key.Q)) {
            hasChanged = true;
            this.pos.z += 0.01 * this.speed;
        }
        if (state.isDown(Key.E)) {
            hasChanged = true;
            this.pos.z -= 0.01 * this.speed;
        }
        return hasChanged;
    }

    ///////////////////////////////////////////////////////////////////////////

    getCameraPoint(): Vector3 {
        return this.inverseWorldMatrix.multiplyVector(new Vector3(0, 0, 0));
    }

    getMouseWorldRay(canvasWidth: number, canvasHeight: number, useMouse = true): Ray {
        // get a ray from origin through mousepos

        // mouse unit screen position:
        //       -------------- -0.5
        //       |            |
        //       |      .(0,0)|
        //       |            |
        //       -------------- 0.5
        //     -0.72        0.72
        //    (0.72 = 0.5 * aspect)
        //

        let size = 0.5; // size indicator of the fustrum
        let mp = this.mousePos;
        let aspect = canvasWidth / canvasHeight;
        let mouseUnitX = (-size + mp.x / canvasWidth) * aspect;
        let mouseUnitY = -size + mp.y / canvasHeight;

        let f = size / Math.tan(this.fov / 2); // focal length

        let invWorld = this.inverseWorldMatrix;
        let origin = invWorld.multiplyVector(new Vector3(0, 0, 0));

        // TODO instead of doing this, just extract the x, y, and z columns of invWorld
        let iDestiny = invWorld.multiplyVector(new Vector3(1, 0, 0));
        let jDestiny = invWorld.multiplyVector(new Vector3(0, 1, 0));
        let kDestiny = invWorld.multiplyVector(new Vector3(0, 0, -1));

        let ihat = iDestiny.sub(origin).normalize();
        let jhat = jDestiny.sub(origin).normalize();
        let khat = kDestiny.sub(origin).normalize();

        // pardon this insanely ugly statement
        let screenPoint = useMouse
            ? origin
                .added(khat.scaled(f))
                .add(ihat.scaled(mouseUnitX))
                .add(jhat.scaled(-mouseUnitY))
            : origin.added(khat.scaled(f));

        return Ray.fromPoints(origin, screenPoint);
    }

    getProjectionMatrix(width: number, height: number): Matrix4 {
        // aspects
        let aspect = width / height; // note: this should be constant

        // let z_plane = -1. / Math.tan(pi / 8.);

        // projection to screen
        // let projection = Matrix4.newOrthographic(-1, 1, -1, 1, 0.002, 0.002);
        let projection = Matrix4.newPerspective(this.fov, aspect, this.zNear, this.zFar);
        return projection;
    }

    getRelativeUnitZ = () => {
        let m = this.rotateXRev;
        let m2 = this.rotateZRev;
        return m2.multiplyVector(m.multiplyVector(Vector3.unitZ()));
    }

    getRelativeTrueUnitY = () => {
        let m = this.rotateXRev;
        let m2 = this.rotateZRev;
        return m2.multiplyVector(m.multiplyVector(Vector3.unitY()));
    }

    getRelativeUnitY = () => {
        // let m = Matrix4.newXRotation(-this.angleAlpha);
        // let m = Matrix4.newZRotation(-this.angleBeta);
        return this.rotateZRev.multiplyVector(Vector3.unitY());
    }

    getRelativeUnitX = () => {
        // let m = Matrix4.newZRotation(-this.angleBeta);
        return this.rotateZRev.multiplyVector(Vector3.unitX());
    }
}
