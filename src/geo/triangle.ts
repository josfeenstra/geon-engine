import { Vector2 } from "../math/vector";

export class Triangle2 {
    
    a: Vector2;
    b: Vector2;
    c: Vector2;

    constructor(a: Vector2, b: Vector2, c: Vector2) {
        this.a = a;
        this.b = b;
        this.c = c;
    }
}