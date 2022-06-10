// jos feenstra

import { Rectangle2 } from "../geo/rectangle";
import { Context } from "../render/context";
import { Shader } from "../render/shader";

export class RectangleShader extends Shader<Rectangle2[]> {
    // attribute & uniform locations
    a_position: number;
    a_position_buffer: WebGLBuffer;
    u_resolution: WebGLUniformLocation;
    u_color: WebGLUniformLocation;

    constructor(gl: WebGLRenderingContext) {
        // note: I like vertex & fragments to be included in the script itself.
        // when you change vertex or fragment, this class has to deal with it.
        // putting them somewhere else doesnt make sense to me,
        // they are coupled 1 to 1.
        let vertexSource: string = `
        attribute vec2 a_position;

        uniform vec2 u_resolution;

        void main() {
            // convert the rectangle from pixels to 0.0 to 1.0
            vec2 zeroToOne = ((a_position / u_resolution) * 2.0) - 1.0;

            // convert from 0->1 to 0->2
            // vec2 zeroToTwo = zeroToOne * 2.0;

            // convert from 0->2 to -1->+1 (clipspace)
            // vec2 clipSpace = zeroToTwo - 1.0;

            gl_Position = vec4(zeroToOne * vec2(1, -1), 0, 1);
        }
        `;
        let fragmentSource: string = `
        precision mediump float;

        uniform vec4 u_color;
        
        void main() {
           gl_FragColor = u_color;
        }
        `;

        // setup program
        super(gl, vertexSource, fragmentSource);

        // look up where the vertex data needs to go.
        this.a_position = gl.getAttribLocation(this.program, "a_position");
        this.a_position_buffer = gl.createBuffer()!;
        this.u_resolution = gl.getUniformLocation(this.program, "u_resolution")!;
        this.u_color = gl.getUniformLocation(this.program, "u_color")!;

        // Create a buffer to put three 2d clip space points in

        // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_position_buffer);
    }

    set() {
        throw "not used";
    }

    render() {
        throw "not used!";
    }

    setAndRender(rs: Rectangle2[], c: Context) {
        // Clear the canvas
        let gl = this.gl;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(this.program);

        // Turn on the attribute
        gl.enableVertexAttribArray(this.a_position);

        gl.uniform2f(this.u_resolution, gl.canvas.width, gl.canvas.height);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_position_buffer);

        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2; // 2 components per iteration
        var type = gl.FLOAT; // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0; // start at the beginning of the buffer
        gl.vertexAttribPointer(this.a_position, size, type, normalize, stride, offset);

        // draw 50 random rectangles in random colors
        for (let r of rs) {
            // Setup a random rectangle
            // This will write to positionBuffer because
            // its the last thing we bound on the ARRAY_BUFFER
            // bind point
            this.setRectangle(gl, r);

            // Set a random color.
            gl.uniform4f(this.u_color, Math.random(), Math.random(), Math.random(), 1);

            // Draw the rectangle.
            var primitiveType = gl.TRIANGLES;
            var offset = 0;
            var count = 6;
            gl.drawArrays(primitiveType, offset, count);
        }
    }

    // Fill the buffer with the values that define a rectangle.
    setRectangle(gl: WebGLRenderingContext, r: Rectangle2) {
        let verts = r.getVertices();
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                verts[0].x,
                verts[0].y,
                verts[1].x,
                verts[1].y,
                verts[2].x,
                verts[2].y,
                verts[2].x,
                verts[2].y,
                verts[1].x,
                verts[1].y,
                verts[3].x,
                verts[3].y,
            ]),
            gl.STATIC_DRAW,
        );
    }

    randomInt(range: number): number {
        return Math.floor(Math.random() * range);
    }
}
