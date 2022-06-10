import { Context, DrawSpeed } from "../lib";

export abstract class MultiShader<T> {
    abstract set(r: T, speed: DrawSpeed): void;

    abstract render(context: Context): void;

    setAndRender(r: T, context: Context) {
        this.set(r, DrawSpeed.DynamicDraw);
        this.render(context);
    }
}
