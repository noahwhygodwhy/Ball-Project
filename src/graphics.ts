"use strict";

import * as glm from "gl-matrix" 

let i = 0
let value = 0.0
let gl:WebGL2RenderingContext
let program:WebGLProgram|null
const BALL_RADIUS:number = 10;


const WIDTH:number = 1000;
const HEIGHT:number = 800;


var vertexShaderSource = `#version 300 es
     
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
 
var fragmentShaderSource = `#version 300 es
 
precision mediump float;
 
// we need to declare an output for the fragment shader
out vec4 outColor;
 

void main() {
  // Just set the output to a constant reddish-purple

    float r = 0.0;
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    r = dot(cxy, cxy);
    if (r > 1.0) {
        discard;
    } 
    outColor = vec4(0.5, 0.5, 1.0, 1.0);
    

}
`;




function distance_2(x1:number, y1:number, x2:number, y2:number) {
    return Math.pow((x2-x1), 2)+Math.pow((y2-y1), 2);
}

function main() {
    
    const canvas = document.querySelector("#glCanvas") as HTMLCanvasElement;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
   
    // Initialize the GL context
    if(canvas == null) {
        throw "can't find canvas";
    }
    let tempGl = canvas.getContext("webgl2");
    // Only continue if WebGL is available and working
    if (tempGl === null) {
        throw "browser doesn't support webgl";
    }
    gl = tempGl

    let value:number = 0.0;
    let i = 0;

    let ballShader = new Shader(gl, vertexShaderSource, fragmentShaderSource);



    
    var numberOfBalls = 0;
    var positions:Array<number> = [];
    var velocities:Array<number> = [];
    var accelerations:Array<number> = [];

    for(let x = BALL_RADIUS*2; x < WIDTH/2; x+=(BALL_RADIUS*4)){
        for(let y = BALL_RADIUS*2; y < HEIGHT; y+=(BALL_RADIUS*4))
        {
            numberOfBalls++;
            positions.push(x+(y/BALL_RADIUS));
            positions.push(y);
            velocities.push(0);
            velocities.push(0);
            accelerations.push(0);
            accelerations.push(0);

        }
    }
    console.log(positions)

    // positions = [0, 0,
    // 100, 0,
    // 0, 100];

    // let fPos = new Float32Array(positions);
    // console.log(fPos)


    const positionLoc = ballShader.getALoc(gl, "aPos");
    console.log("positionLoc", positionLoc)
    var ballVAO = gl.createVertexArray();
    var ballVBO = gl.createBuffer();
    gl.bindVertexArray(ballVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, ballVBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)
    
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);






    //var orth = ortho(0, WIDTH, 0, HEIGHT, 0.1, 5)
    
    //console.log(orth);
    
    ballShader.use(gl);
    //let orthoLoc = ballShader.getULoc(gl, "projection")

    //gl.uniformMatrix4fv(orthoLoc, false, new Float32Array(orth), 0, 16);

    let widthLoc = ballShader.getULoc(gl, "width")
    let heightLoc = ballShader.getULoc(gl, "height")
    let radiusLoc = ballShader.getULoc(gl, "ballRadius")
    gl.uniform1f(widthLoc, WIDTH);
    gl.uniform1f(heightLoc, HEIGHT);
    gl.uniform1f(radiusLoc, BALL_RADIUS);

    let lastTime = 0;
    let deltaTime = 0;

    function draw(currentTime:number){
        deltaTime = currentTime-lastTime;
        lastTime = currentTime;
        
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        let wv2 = glm.vec2.fromValues(0,0);


        for(let origin = 0; origin < numberOfBalls; origin++) {
            let oidx = origin*2;
            let pos1 = glm.vec2.fromValues(positions[oidx + 0], positions[oidx + 1])
            for(let collider = 0; collider < numberOfBalls; collider++) {
                let cidx = collider*2;
                let pos2 = glm.vec2.fromValues(positions[cidx+0], positions[cidx+1]);

                if(origin == collider)continue;
                let overlap2 = glm.vec2.squaredDistance(pos1, pos2);
                if(overlap2 <= Math.pow((2*BALL_RADIUS), 2)) {
                    let overlap = Math.sqrt(overlap2);
                    
                    let originOutvec = glm.vec2.normalize(wv2, glm.vec2.subtract(wv2, pos1, pos2));
                    let colliderOutVec = glm.vec2.inverse(wv2, originOutvec);
                    let overlapVec = glm.vec2.fromValues(overlap/2.0, overlap/2.0);

                    pos1 = glm.vec2.add(wv2, pos1, glm.vec2.multiply(wv2, originOutvec, overlapVec));
                    pos2 = glm.vec2.add(wv2, pos2, glm.vec2.multiply(wv2, colliderOutVec, overlapVec));



                    //collision

                    positions[cidx+0] = pos2[0];
                    positions[cidx+1] = pos2[1];
                }
                
                positions[oidx+0] = pos1[0];
                positions[oidx+1] = pos1[1];
            }
        }














        gl.bindVertexArray(ballVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, ballVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);        
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        ballShader.use(gl);
        
        gl.bindVertexArray(ballVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, ballVBO);

        gl.drawArrays(gl.POINTS, 0, numberOfBalls);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
        
        window.requestAnimationFrame(draw);
    }


    window.requestAnimationFrame(draw);
}
  
  
window.onload = main;



//100% stolen from the gl-matrix library, because I didn't want to deal with webpacking js modules, so I just copied/pasted it
function ortho(left:number, right:number, bottom:number, top:number, near:number, far:number) :Array<number> {
    let out:Array<number> = [];
    var lr = 1 / (left - right);
    var bt = 1 / (bottom - top);
    var nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
}

class Shader{
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