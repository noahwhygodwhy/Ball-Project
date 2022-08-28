
export class Shader{
    program:WebGLProgram
    constructor(gl:WebGL2RenderingContext, vertSource:string, fragSource:string){
        let tempProg = gl.createProgram();
        if(tempProg == null) {
            throw "program shader is null";
        }
        this.program = tempProg;
        let fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        if(fragShader == null) {
            throw "frag shader is null"
        }
        gl.shaderSource(fragShader, fragSource);
        gl.compileShader(fragShader);
        if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(fragShader);
            throw `Could not compile fragShader. \n\n${info}`;
        }
        let vertShader = gl.createShader(gl.VERTEX_SHADER);
        if(vertShader == null) {
            throw "vert shader is null"
        }
        gl.shaderSource(vertShader, vertSource);
        gl.compileShader(vertShader);
        if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(vertShader);
            throw `Could not compile vertShader. \n\n${info}`;
        }

        gl.attachShader(this.program, vertShader);
        gl.attachShader(this.program, fragShader);
        
        gl.linkProgram(this.program)
        
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(this.program);
            throw `Could not compile WebGL program. \n\n${info}`;
        }
    }
    use(gl:WebGL2RenderingContext){
        gl.useProgram(this.program);
    }
    relink(gl:WebGL2RenderingContext){
        gl.linkProgram(this.program);
    }
    getProg():WebGLProgram{
        return this.program;
    }
    getALoc(gl:WebGL2RenderingContext, attrib:string){
        return gl.getAttribLocation(this.program, attrib);
    }
    getULoc(gl:WebGL2RenderingContext, uniform:string){
        return gl.getUniformLocation(this.program, uniform);
    }
}


export var ballVertSource = `#version 300 es
in vec2 aPos;
uniform float width;
uniform float height;
uniform float ballRadius;

void main() {
    gl_PointSize = ballRadius*2.0;

    vec2 normalized = ((aPos/vec2(width, height))-vec2(0.5))*2.0;
    gl_Position = vec4(normalized, 0, 1);
}
`;


 
export var ballFragSource = `#version 300 es
precision mediump float;
out vec4 outColor;

void main() {
    float r = 0.0;
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    r = dot(cxy, cxy);
    if (r > 1.0) {
        discard;
    } 
    outColor = vec4(0.5, 0.5, 1.0, 1.0);
}
`;

export var rayVertSource = `#version 300 es
in vec3 aPos;

uniform float width;
uniform float height;

out float spawnedTime;

void main() {
    spawnedTime = aPos.z;

    //vec2 normalized = vec2(currTime-aPos.z, 0);
    vec2 normalized = ((vec2(aPos.xy)/vec2(width, height))-vec2(0.5))*2.0;
    //normalized.x += clamp((aPos.z-currTime), 0.0, 1.0);
    //normalized += vec2(aPos.z-currTime, 0);
    gl_Position = vec4(normalized, 0, 1);
}
`;
export var rayFragSource = `#version 300 es
precision mediump float;
out vec4 outColor;

uniform float currTime;

in float spawnedTime;

void main() {
    float f = 1.0-(currTime-spawnedTime); 
    //float f = 1.0;
    outColor = vec4(f, f, f, 1.0);
}
`;