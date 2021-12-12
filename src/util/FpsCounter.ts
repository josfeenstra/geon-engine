import { TimeHandler } from "../input-2.0/TimeHandler";
import { InputState } from "../input/InputState";

export class FpsCounter {
    fps = 0;
    updateEveryXTicks = 100;
    elapsed = 0;
    frames = 0;
    frameTime = 0;

    constructor() {}

    static new() {
        return new FpsCounter();
    }

    _update(dt: number) {
        this.frames += 1;
        this.elapsed += dt;
        if (this.elapsed > this.updateEveryXTicks) {
            this.setFps();
            this.elapsed = 0;
            this.frames = 0;
        }
    }

    update(state: InputState | TimeHandler) {
        this._update(state.tick);
    }

    setFps() {
        this.fps = Math.round((this.frames / this.elapsed) * 1000);
    }

    getFps() {
        return this.fps;
    }
}
