// jos feenstra

import {
    Context,
    DrawSpeed,
    ToFloatMatrix,
    MultiVector,
    Shader,
} from "../lib";

export class DotShaderWithHeight extends Shader<MultiVector> {
    // attribute & uniform locations
    a_position: number;
    a_position_buffer: WebGLBuffer;

    u_transform: WebGLUniformLocation;
    u_color: WebGLUniformLocation;
    u_size: WebGLUniformLocation;

    color: number[];
    size: number;
    count: number;
    u_range: WebGLUniformLocation;
    height: number;

    constructor(
        gl: WebGLRenderingContext,
        radius: number = 5,
        color: number[] = [1, 1, 1, 1],
        height: number,
        square: boolean = true,
    ) {
        // note: I like vertex & fragments to be included in the script itself.
        // when you change vertex or fragment, this class has to deal with it.
        // putting them somewhere else doesnt make sense to me,
        // they are coupled 1 to 1.
        let vertexSource: string = `
        precision mediump int;
        precision mediump float;

        uniform mat4 u_transform;
        uniform vec4 u_color;
        uniform float u_range;
        uniform float u_size;

        attribute vec3 a_vertex;

        varying vec4 v_color;

        void main() {
            // Set the size of a rendered point.
            gl_PointSize = u_size;
            float factor = a_vertex.z / u_range;

            v_color = vec4(u_color.xyz * factor, 1);

            // Transform the location of the vertex.
            gl_Position = u_transform * vec4(a_vertex, 1.0);
        }

        `;
        let fragmentSourceSquare: string = `
        precision mediump int;
        precision mediump float;

        uniform vec4 u_color;
        // vec2 center = vec2(0.5, 0.5);

        varying vec4 v_color;

        void main() {
            gl_FragColor = v_color;
        }
        `;

        let fragmentSourceRound: string = `
        precision mediump int;
        precision mediump float;

        uniform vec4 u_color;
        vec2 center = vec2(0.5, 0.5);

        varying vec4 v_color;

        void main() {
            if (distance(center, gl_PointCoord) > 0.5) {
               discard;
            }
            gl_FragColor = v_color;
        }
        `;

        // setup program
        if (square) {
            super(gl, vertexSource, fragmentSourceSquare);
        } else {
            super(gl, vertexSource, fragmentSourceRound);
        }

        this.u_transform = gl.getUniformLocation(this.program, "u_transform")!;
        this.u_size = gl.getUniformLocation(this.program, "u_size")!;
        this.u_color = gl.getUniformLocation(this.program, "u_color")!;
        this.u_range = gl.getUniformLocation(this.program, "u_range")!;

        this.color = color;
        this.size = radius;
        this.count = 0;
        this.height = height;

        // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
        // look up where the vertex data needs to go.
        this.a_position = gl.getAttribLocation(this.program, "a_vertex");
        this.a_position_buffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_position_buffer);
    }

    set(points: MultiVector, speed: DrawSpeed = DrawSpeed.StaticDraw) {
        let gl = this.gl;
        gl.useProgram(this.program);

        // convert all possible entries to a general entry
        let array = ToFloatMatrix(points);

        // from some other thing
        this.count = array.count();

        // // Bind the position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_position_buffer);
        gl.enableVertexAttribArray(this.a_position);
        gl.vertexAttribPointer(this.a_position, array.width, gl.FLOAT, false, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, array.data, super.convertDrawSpeed(speed));
    }

    render(c: Context) {
        let gl = this.gl;
        let matrix = c.camera.totalMatrix;
        // Tell it to use our program (pair of shaders)
        gl.useProgram(this.program);

        // set uniforms
        // console.log(matrix.data);
        gl.uniformMatrix4fv(this.u_transform, false, matrix.data);
        gl.uniform1f(this.u_size, this.size);
        gl.uniform1f(this.u_range, this.height);
        gl.uniform4f(this.u_color, this.color[0], this.color[1], this.color[2], this.color[3]);

        // // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_position_buffer);
        gl.enableVertexAttribArray(this.a_position);
        gl.vertexAttribPointer(this.a_position, 3, gl.FLOAT, false, 0, 0);

        // Draw the point.
        gl.drawArrays(gl.POINTS, 0, this.count);
    }

    setAndRender(data: MultiVector, c: Context) {
        this.set(data, DrawSpeed.DynamicDraw);
        this.render(c);
    }
}
