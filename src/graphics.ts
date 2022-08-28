"use strict";

import * as glm from "gl-matrix" 
import {Shader} from "./shader"
import * as shaders from "./shader"
import { normalize } from "path";
import * as glDebug from "./webgl-debug"

let i = 0
let value = 0.0
let gl:WebGL2RenderingContext
let program:WebGLProgram|null
const BALL_RADIUS:number = 10;


const WIDTH:number = 800;
const HEIGHT:number = 800;

var mouseX = 0;
var mouseY = 0





var resolveStep;

const clamp = (num:number, min:number, max:number) => Math.min(Math.max(num, min), max);

document.addEventListener("dragover", function(e){
    e = e || window.event;
    var dragX = e.pageX, dragY = e.pageY;

    console.log("X: "+dragX+" Y: "+dragY);
}, false);

function main() {
    
    const canvas = document.querySelector("#glCanvas") as HTMLCanvasElement;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
   
    window.addEventListener('mousemove', (e:MouseEvent) => {
        const rect = canvas.getBoundingClientRect()
        mouseX = e.clientX-rect.left
        mouseY = e.clientY-rect.top
    });
    // Initialize the GL context
    if(canvas == null) {
        throw "can't find canvas";
    }
    let tempGl = canvas.getContext("webgl2");
    // Only continue if WebGL is available and working
    if (tempGl === null) {
        throw "browser doesn't support webgl";
    }
    // function throwOnGLError(err:any, funcName:any, args:any) {
    //     throw glDebug.WebGLDebugUtils.glEnumToString(err) + " was caused by call to: " + funcName;
    //   };
    //   function logGLCall(functionName:any, args:any) {   
    //     console.log("gl." + functionName + "(" + 
    //        glDebug.WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");   
    //  } 
    //  function validateNoneOfTheArgsAreUndefined(functionName:any, args:any) {
    //     for (var ii = 0; ii < args.length; ++ii) {
    //       if (args[ii] === undefined) {
    //         console.error("undefined passed to gl." + functionName + "(" +
    //                        glDebug.WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
    //       }
    //     }
    //   } 
    //gl = glDebug.WebGLDebugUtils.makeDebugContext(tempGl, throwOnGLError, validateNoneOfTheArgsAreUndefined, null as any);
    gl =  tempGl

    let value:number = 0.0;
    let i = 0;

    let ballShader = new Shader(gl, shaders.ballVertSource, shaders.ballFragSource);
    let rayShader = new Shader(gl, shaders.rayVertSource, shaders.rayFragSource);



    
    //var numberOfBalls = 0;

    var positions:Array<Array<number>> = [];
    var velocities:Array<number> = [];
    var rays:Array<Array<number>> = []; //x1, y1, time, x2, y2, time



    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);



    //console.log("positionLoc", positionLoc)
    var ballVAO = gl.createVertexArray();
    var ballVBO = gl.createBuffer();
    gl.bindVertexArray(ballVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, ballVBO);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindAttribLocation(ballShader.getProg(), 0, "aPos")

    ballShader.relink(gl);
    
    var rayVAO = gl.createVertexArray();
    var rayVBO = gl.createBuffer();
    gl.bindVertexArray(rayVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, rayVBO);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
    
    gl.bindAttribLocation(rayShader.getProg(), 0, "aPos")

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    gl.lineWidth(30);

    rayShader.relink(gl);

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

    rayShader.use(gl);
    let rayWidthLoc = rayShader.getULoc(gl, "width")
    let rayHeightLoc = rayShader.getULoc(gl, "height")

    let lastTime = 0;
    let deltaTime = 0;
    let cTime = 0


    let go = true;
    function printPos(event:KeyboardEvent):any{
        if(event.key == " "){
            go = !go;
            console.log(positions);
        }
    }
    let selectedBall = -1;
    // function selectBall(event:MouseEvent){
    //     for(let i = 0; i < velocities.length; i++) {
    //         let oidx = i*2;
    //     }
    //     const rect = canvas.getBoundingClientRect()
    //     let pos:glm.vec2 =  
    //     console.log(event.clientX-rect.left)
    //     console.log(event.clientY-rect.top)
    // }
    function spawnMeteor(){
        positions.push([Math.random()*WIDTH, HEIGHT])
        velocities.push(-Math.random()*50)
    }

    function shootRay(e:MouseEvent) {
        let org:glm.vec2 = glm.vec2.fromValues(WIDTH/2, HEIGHT);
        const rect = canvas.getBoundingClientRect();
        let dest:glm.vec2 = glm.vec2.fromValues(e.clientX-rect.left, e.clientY-rect.top);
        let rayDir = glm.vec2.normalize(dest, glm.vec2.sub(dest, dest, org))
        let endPoint = glm.vec2.multiply(rayDir, rayDir, glm.vec2.fromValues(WIDTH*HEIGHT, WIDTH*HEIGHT));
        //rays.push([WIDTH/2, -HEIGHT, cTime/1000, endPoint[0], endPoint[1], cTime/1000]);
        //rays = [];
        rays.push([0.0, 0.0, cTime/1000.0, WIDTH, HEIGHT, cTime/1000.0]);

    }

    canvas.addEventListener("click", shootRay, false)
    canvas.addEventListener("keydown", printPos, false)

    let frameNumber = 0;
    let lastSecond = 0;

    positions.push([0, 0]);
    velocities.push(0);
    //rays.push([0.0, 0.0, lastTime/1000, WIDTH, HEIGHT, lastTime/1000]);

    function draw(currentTime:number){
        cTime = currentTime;
        deltaTime = (currentTime-lastTime)/1000.0;
        lastTime = currentTime;
        if(!go){requestAnimationFrame(draw); return;}
        //positions[0] = [mouseX, HEIGHT-mouseY];
        
//update velcities and positions for each ball
        for(let i = 0; i < positions.length; i++) {
            positions[i][1] += velocities[i] * deltaTime;
        }
//spawn meteors every second
        let thisSecond = Math.floor(currentTime/1000);
        //console.log(currentTime, Math.floor(currentTime/1000), thisSecond, lastSecond)
        if(thisSecond != lastSecond){
            spawnMeteor();
            lastSecond = thisSecond;
        }
//remove meteors that go too far
        //console.log(positions)
        velocities = velocities.filter((v, i) => positions[i][1]>0);
        positions = positions.filter((v, i) => v[1]>0);
        //rays = rays.filter((v)=> v[2]+1.5 > currentTime);
        //console.log(positions)


        frameNumber++;
        
        //console.log("dt:", deltaTime)
        
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);


        ballShader.use(gl);
        
        gl.uniform1f(widthLoc, WIDTH);
        gl.uniform1f(heightLoc, HEIGHT);
        gl.bindVertexArray(ballVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, ballVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions.flat()), gl.STATIC_DRAW);        
        gl.drawArrays(gl.POINTS, 0, velocities.length);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
        

        rayShader.use(gl);
        
        gl.uniform1f(rayWidthLoc, WIDTH);
        gl.uniform1f(rayHeightLoc, HEIGHT);
        let currTimeLoc = ballShader.getULoc(gl, "currTime")
        //console.log("currTimeLoc", currTimeLoc);
        gl.uniform1f(currTimeLoc, currentTime/1000.0);

        // console.log(currentTime/1000, rays[0][2], Math.max(0, rays[0][2]-currentTime/1000));


        gl.bindVertexArray(rayVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, rayVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rays.flat()), gl.STATIC_DRAW); 
        gl.drawArrays(gl.LINES, 0, rays.length*2);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);


        window.requestAnimationFrame(draw);
    }


    window.requestAnimationFrame(draw);
}
  
  
window.onload = main;