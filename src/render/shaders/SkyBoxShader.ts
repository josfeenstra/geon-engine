import { Color } from "../../image/Color";
import { Matrix3, Matrix4, Mesh, meshFromObj, ShaderMesh, Bitmap, Vector2 } from "../../lib";
import { Scene } from "../basics/Scene";
import { DrawElementsType, DrawMode } from "../webgl/Constants";
import { DrawSpeed, WebGl } from "../webgl/HelpGl";
import { ShaderProgram } from "../webgl/ShaderProgram";
import { UniformType } from "../webgl/Uniform";

/**
 * quite literarly taken from https://webglfundamentals.org/webgl/lessons/webgl-skybox.html, saw no reason to change it
 */
export class SkyBoxShader extends ShaderProgram<string[]> {

    constructor(gl: WebGl) {

        const vertexShader = `
        precision mediump float;

        attribute vec4 a_position;
        varying vec4 v_position;
        uniform mat4 u_viewDirectionProjectionInverse;

        void main() {

            v_position = a_position;
            gl_Position = a_position;
            gl_Position.z = 1.0;
        }
        `;

        const CubeMapfragmentShader = `
        #define PI 3.1415926538;
        #define TWO_PI 2.0 * PI;

        precision mediump float;
     
        uniform samplerCube u_skybox;
        uniform mat4 u_viewDirectionProjectionInverse;
         
        varying vec4 v_position;

        void main() {
            vec4 t = u_viewDirectionProjectionInverse * v_position;
            vec3 normal = normalize(t.xyz / t.w);

            // using cubemap
            gl_FragColor = textureCube(u_skybox, normal);
        }
        `;

        const textureFragmentShader = `
        #define PI 3.1415926538;
        #define TWO_PI 2.0 * PI;

        precision mediump float;
     
        uniform samplerCube u_skybox;
        uniform mat4 u_viewDirectionProjectionInverse;
         
        varying vec4 v_position;

        // vec2 to_lat_long_normalized(vec3 normal) {
        //     float longitude = atan(normal.y, normal.x) / TWO_PI;
        //     float latitude = 0.0;
        //     return vec2(longitude, latitude);
        // }

        vec2 to_polar(vec3 normal) {
            vec2 dir = normalize(normal.xy);
            float delta = acos(abs(normal.z)) / PI;
            return vec2(0.5, 0.5) + dir * delta; 
        }

        // vec3 to_sphere(vec3 P) {
        //     float r = sqrt(P.x*P.x + P.y*P.y + P.z*P.z);
        //     float theta = atan(P.y, P.x);
        //     float phi = acos(P.z/r);
        //     return vec3(r, theta, phi);
        // }
        
        // vec3 to_cart(vec3 P) {
        //     float r = P.x;
        //     float theta = P.y;
        //     float phi = P.z;
        //     return r * vec3(cos(phi)*sin(theta),sin(phi)*sin(theta),cos(theta));
        // }

        void main() {
            vec4 t = u_viewDirectionProjectionInverse * v_position;
            vec3 normal = normalize(t.xyz / t.w);

            // debug
            // gl_FragColor = vec4((normal + 1.0) * 0.5, 1.0);

            // using cubemap
            // gl_FragColor = textureCube(u_skybox, normal);

            // using single texture with polar projection
            // vec2 polar = to_polar(normal);
            // gl_FragColor = texture2D(u_skybox, polar);
            // gl_FragColor = vec4(1,0.8,0,1);
        }
        `

        super(gl, vertexShader, CubeMapfragmentShader);
    }

    protected onInit(): DrawMode {
        this.attributes.add("a_position", 2);
        this.uniforms.add("u_viewDirectionProjectionInverse", 16, Matrix4.newIdentity().data);
        this.uniforms.addCubeMap("u_skybox");
        return DrawMode.Triangles;
    }

    protected onLoad(urls: string[], speed: DrawSpeed): number {

        var quad = new Float32Array(
            [
              -1, -1, 
               1, -1, 
              -1,  1, 
              -1,  1,
               1, -1,
               1,  1,
            ]
        );

        this.attributes.load("a_position", quad, speed);
        this.uniforms.loadCubeMapUrls("u_skybox", urls);

        return 6;
    }

    protected onDraw(c: Scene) {
        // let our quad pass the depth test at 1.0
        // this.gl.depthFunc(this.gl.LEQUAL);
        this.uniforms.loadMatrix4("u_viewDirectionProjectionInverse", c.camera.inverseTotalViewMatrix);
    }
}
