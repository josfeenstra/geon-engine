// jos feenstra

import { Vector2 } from "../math/vector";
import { Context } from "../render/context";
import { Shader } from "../render/shader";

export class DotShader2 extends Shader<Vector2[]> {
    // attribute & uniform locations
    a_position: number;
    a_position_buffer: WebGLBuffer;

    u_resolution: WebGLUniformLocation;
    u_color: WebGLUniformLocation;
    u_size: WebGLUniformLocation;

    color: number[];
    size: number;

    constructor(
        gl: WebGLRenderingContext,
        size: number = 5,
        color: number[] = [1, 1, 1, 1],
        square: boolean = true,
    ) {
        // note: I like vertex & fragments to be included in the script itself.
        // when you change vertex or fragment, this class has to deal with it.
        // putting them somewhere else doesnt make sense to me,
        // they are coupled 1 to 1.
        let vertexSource: string = `
        attribute vec2 a_position;
        
        uniform vec2 u_resolution;
        uniform float u_size;

        void main() {
            vec2 clipped = ((a_position / u_resolution) * 2.0) - 1.0;
      
            gl_PointSize = u_size;
            gl_Position = vec4(clipped, 0, 1);
            // gl_Position = vec4(0,0,0,1);
        }
        `;
        let fragmentSourceSquare: string = `
        precision mediump int;
        precision mediump float;

        uniform vec4 u_Color;
        vec2 center = vec2(0.5, 0.5);

        void main() {
            gl_FragColor = vec4(1,1,1,1);
        }
        `;

        let fragmentSourceRound: string = `
        precision mediump int;
        precision mediump float;

        uniform vec4 u_Color;
        vec2 center = vec2(0.5, 0.5);

        void main() {
            if (distance(center, gl_PointCoord) > 0.5) {
               discard;
            }
            gl_FragColor = vec4(1,1,1,1);
        }
        `;

        // setup program
        if (square) {
            super(gl, vertexSource, fragmentSourceSquare);
        } else {
            super(gl, vertexSource, fragmentSourceRound);
        }

        this.u_resolution = gl.getUniformLocation(this.program, "u_resolution")!;
        this.u_size = gl.getUniformLocation(this.program, "u_size")!;
        this.u_color = gl.getUniformLocation(this.program, "u_color")!;

        this.color = color;
        this.size = size;

        // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
        // look up where the vertex data needs to go.
        this.a_position = gl.getAttribLocation(this.program, "a_position");
        this.a_position_buffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_position_buffer);
    }

    set() {}

    render(context: Context): void {}

    // render 1 image to the screen
    setAndRender(dots: Vector2[], context: Context) {
        let gl = this.gl;
        // Tell it to use our program (pair of shaders)
        gl.useProgram(this.program);

        // set uniforms
        gl.uniform2f(this.u_resolution, gl.canvas.width, gl.canvas.height);
        gl.uniform1f(this.u_size, this.size);
        gl.uniform4f(this.u_color, this.color[0], this.color[1], this.color[2], this.color[3]);

        // // Bind the position buffer.
        gl.enableVertexAttribArray(this.a_position);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_position_buffer);

        // // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2; // 2 components per iteration
        var type = gl.FLOAT; // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0; // start at the beginning of the buffer
        gl.vertexAttribPointer(this.a_position, size, type, normalize, stride, offset);

        // fill with data;
        let data = this.toFloat32Array(dots);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

        // Draw the point.
        var primitiveType = gl.POINTS;
        var offset = 0;
        var count = dots.length;
        gl.drawArrays(primitiveType, offset, count);
    }

    // Fill the buffer with the values that define a rectangle.
    toFloat32Array(dots: Vector2[]): Float32Array {
        let data = new Float32Array(dots.length * 2);
        for (let i = 0; i < dots.length; i++) {
            data[i * 2] = dots[i].x;
            data[i * 2 + 1] = dots[i].y;
        }
        return data;
    }

    randomInt(range: number): number {
        return Math.floor(Math.random() * range);
    }
}
