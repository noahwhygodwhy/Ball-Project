"use strict";

import * as glm from "gl-matrix" 
import {Shader} from "./shader"
import * as shaders from "./shader"
import { kdTree } from "./ps/kdtree";
import { AABB, Ray } from "./ray"
import { unigrid } from "./ps/unigrid";
import { quadTree } from "./ps/quadtree";
import { partitioningSystem } from "./ps/partitioningSystem";
import { bruteForce } from "./ps/brute";

// let i = 0
// let value = 0.0
let gl:WebGL2RenderingContext
// let program:WebGLProgram|null
export const BALL_RADIUS:number = 10;
export const SPACE_WIDTH:number = 800;
export const SPACE_HEIGHT:number = 800;

// var mouseX = 0;
// var mouseY = 0
var partitioning:partitioningSystem|null = null
var neighborMethods = ["Brute Force", "Uniform Grid", "Quad Tree", "KD Tree"];
var currMethod = 0;
// var shootFunction:(this: HTMLCanvasElement, ev: MouseEvent) => any;

var selectedBall = -1;

var showSteps = false



var actionLog:Array<string> = []


//lol ts is a bit silly
const PART_SYSTEMS:(typeof bruteForce | typeof unigrid | typeof kdTree | typeof quadTree)[] = [bruteForce, unigrid, quadTree, kdTree]
var partSystem:(typeof bruteForce | typeof unigrid | typeof kdTree | typeof quadTree) = bruteForce



export function formatBall(b:glm.vec2):(string) {

    return "Ball{" + formatFloat(b[0]) + "," + formatFloat(b[1]) +"}"

    
}

function formatFloat(f:number): (string){
    return f.toFixed(0);
}

export function formatAABB(ab: AABB) {
   return `AABB{min[${ab.min[0].toFixed(0)},${ab.min[1].toFixed(0)}],max[${ab.max[0].toFixed(0)},${ab.max[1].toFixed(0)}]}`
}

function setShowSteps(e:any) {
    showSteps = e.target.checked
}

var currSteps = 0;

var numSteps: Array<number> = []
var avgSteps: number = 0

export function addStep() {
    currSteps +=1; 
}
function resetSteps() {
    currSteps = 0;
}


export var resolveStep:(value: number | PromiseLike<number>) => void;

function step(event:any) {
    resolveStep(0);
}

export async function genPromise(){
    if(showSteps)
        await new Promise((resolve:(value: number | PromiseLike<number>) => void) => resolveStep = resolve);
}


export function selectBall(i:number){
    selectedBall = i
}

export function resetActions() {
    actionLog = []
}

export function addAction(s:string){
    actionLog.unshift(s)
}

function main() {
    
    document.getElementById("stepscheckbox")?.addEventListener("click", setShowSteps)
    document.getElementById("stepButton")?.addEventListener("click", step)
    
    const canvas = document.querySelector("#glCanvas") as HTMLCanvasElement;
    canvas.width = SPACE_WIDTH;
    canvas.height = SPACE_HEIGHT;
   
    // window.addEventListener('mousemove', (e:MouseEvent) => {
    //     const rect = canvas.getBoundingClientRect()
    //     mouseX = e.clientX-rect.left 
    //     mouseY = e.clientY-rect.top
    // });
    // Initialize the GL context
    if(canvas == null) {
        throw "can't find canvas";
    }
    let tempGl = canvas.getContext("webgl2");
    // Only continue if WebGL is available and working
    if (tempGl === null) {
        throw "browser doesn't support webgl";
    }

    gl =  tempGl

    // let activeBall = -1;

    let ballShader = new Shader(gl, shaders.ballVertSource, shaders.ballFragSource);
    let rayShader = new Shader(gl, shaders.rayVertSource, shaders.rayFragSource);
    let partitioningShader = new Shader(gl, shaders.partitionVertSource, shaders.partitionFragSource);



    
    //var numberOfBalls = 0;

    var positions:Array<Array<number>> = [];
    var velocities:Array<number> = [];
    var rays:Array<Array<number>> = []; //x1, y1, time, x2, y2, time



    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);



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
    
    
    ballShader.use(gl);
    //let orthoLoc = ballShader.getULoc(gl, "projection")

    //gl.uniformMatrix4fv(orthoLoc, false, new Float32Array(orth), 0, 16);

    let widthLoc = ballShader.getULoc(gl, "width")
    let heightLoc = ballShader.getULoc(gl, "height")
    let radiusLoc = ballShader.getULoc(gl, "ballRadius")
    let selectedBallLoc = ballShader.getULoc(gl, "selectedBall")

    gl.uniform1f(widthLoc, SPACE_WIDTH);
    gl.uniform1f(heightLoc, SPACE_HEIGHT);
    gl.uniform1f(radiusLoc, BALL_RADIUS);

    rayShader.use(gl);
    let rayWidthLoc = rayShader.getULoc(gl, "width")
    let rayHeightLoc = rayShader.getULoc(gl, "height")

    let lastTime = 0;
    let deltaTime = 0;
    let cTime = 0

    var minT:number = Number.MAX_VALUE;
    var minIdx:number = -1;

    let go = true;

    function spawnMeteor(){
        positions.push([Math.random()*SPACE_WIDTH, SPACE_HEIGHT])
        velocities.push(-Math.random()*50)
    }
    
    function updateText()
    {
        let modeElement = document.getElementById("modeText");
        if(modeElement != null) {
            modeElement.innerText = neighborMethods[currMethod];
        }
        let stepsElement = document.getElementById("stepsText");
        if(stepsElement != null) {
            stepsElement.innerText = String(currSteps);
        }

        let totalBallsElem = document.getElementById("totalBallsText");
        if(totalBallsElem != null) {
            totalBallsElem.innerText = String(positions.length);
        }
        
        let lognElem = document.getElementById("logNBallsText");
        if(lognElem != null) {
            lognElem.innerText = String(Math.log2(positions.length).toFixed(1));
        }

        let avgElem = document.getElementById("avgBallsText")
        if(avgElem != null) {
            avgElem.innerText = String(avgSteps);
        }



        let mintElement = document.getElementById("minT");
        if(mintElement != null) {
            mintElement.innerText = String(minT);
        }
        let miniElement = document.getElementById("minI");
        if(miniElement != null) {
            miniElement.innerText = String(minIdx);
        }
        let actionLogElem = document.getElementById("actionLog") as HTMLTextAreaElement;
        if(actionLogElem != null) {
            let s = ""
            if(actionLog.length > 0) {
                s = actionLog.reduce((a, c) => a + "\r\n" + c)
            }
            // actionLog.forEach(t=>{
            //     s += t
            //     s+= "\n"
            // })
            actionLogElem.value = s;
        }

    }

    function getRayFromEvent(e:MouseEvent):Ray{
        let wv = glm.vec2.fromValues(0, 0);
        let rayO:glm.vec2 = glm.vec2.fromValues(SPACE_WIDTH/2, 0);
        const rect = canvas.getBoundingClientRect();
        let dest:glm.vec2 = glm.vec2.fromValues(e.clientX-rect.left, SPACE_HEIGHT-(e.clientY-rect.top));
        let rayDir = glm.vec2.normalize(wv, glm.vec2.sub(dest, dest, rayO))
        let endPoint = glm.vec2.multiply(wv, rayDir, glm.vec2.fromValues(SPACE_WIDTH*SPACE_HEIGHT, SPACE_WIDTH*SPACE_HEIGHT));
        rays.push([SPACE_WIDTH/2, -1, cTime/1000, endPoint[0], endPoint[1], cTime/1000]);
        let theRay:Ray = new Ray(rayO, rayDir);
        return theRay
    }


    function redoAverage(){
        let e:number = 0
        if(numSteps.length > 0) {
            numSteps.forEach(r => e += r);
            e /= numSteps.length
        }
        avgSteps = e
    }
    
    async function handleClick(e:MouseEvent) {
        try 
        {
            if(go) {
                go = false
                resetActions()
                resetSteps()
                addAction("Starting RayTest")
                partitioning = new partSystem(positions)
                let theRay:Ray = getRayFromEvent(e);
                addAction(`Ray: origin {${formatFloat(theRay.origin[0])}, ${formatFloat(theRay.origin[1])}}, direction {${theRay.direction[0].toFixed(3)}, ${theRay.direction[1].toFixed(3)}}`)
                await genPromise()
                let hitResult = await partitioning.intersectTest(theRay,positions);
                if(hitResult.hit) {
                    let theBall = glm.vec2.fromValues(positions[hitResult.idx][0], positions[hitResult.idx][1]);
                    addAction("RayTest finished, hit " + formatBall(theBall))
                    positions = positions.filter((v, i)=>i!=hitResult.idx);
                    velocities = velocities.filter((v, i)=>i!=hitResult.idx);
                }
                else {
                    addAction("RayTest finished, no hit")
                }
                numSteps.push(currSteps)
                redoAverage()
                await genPromise()
                partitioning = null
                go = true
            }
        }
        catch(e){
            resetActions()
            addAction("something went wrong?")
            addAction(String(e))
            selectBall(-1)
            partitioning = null
            go = true
        }
    }
    


    function nextMode() {
        if(go){
            numSteps = []
            avgSteps = 0
            currMethod = (currMethod+1)%neighborMethods.length;
            partSystem = PART_SYSTEMS[currMethod];
        }
    }
    function prevMode() {
        if(go) {
            numSteps = []
            avgSteps = 0
            currMethod = (currMethod-1)
            if(currMethod < 0) {currMethod = neighborMethods.length-1}
            partSystem = PART_SYSTEMS[currMethod];
        }
    }
    
    canvas.addEventListener("click", handleClick, false)
    document.getElementById("nextMode")?.addEventListener("click", nextMode);
    document.getElementById("prevMode")?.addEventListener("click", prevMode);

    
    function printPos(event:KeyboardEvent):any{
        if(event.key == " "){
            go = !go;
        }
    }
    canvas.addEventListener("keydown", printPos, false)

    let lastSecond = 0;

    positions.push([0, 0]);
    velocities.push(0);
    
    function draw(currentTime:number){
        updateText()
        cTime = currentTime;
        deltaTime = (currentTime-lastTime)/1000.0;
        lastTime = currentTime;
        //if(!go){requestAnimationFrame(draw); return;}
        //positions[0] = [mouseX, HEIGHT-mouseY];


//if it's not paused
        if(go){
    //update velcities and positions for each ball
            for(let i = 0; i < positions.length; i++) {
                positions[i][1] += velocities[i] * deltaTime;
            }
    //spawn meteors every second
            let thisSecond = Math.floor(currentTime/1000);
            if(thisSecond != lastSecond){
                spawnMeteor();
                spawnMeteor();
                spawnMeteor();
                lastSecond = thisSecond;
            }
    //remove meteors that go too far
            velocities = velocities.filter((v, i) => positions[i][1]>0);
            positions = positions.filter((v, i) => v[1]>0);
            rays = rays.filter((v)=> ((v[2]+0.9) > (currentTime/1000.0)));
        }

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);


        if(partitioning){
            partitioning.draw(partitioningShader, gl);
        }
        



//draw balls
        ballShader.use(gl);

        gl.uniform1i(selectedBallLoc, selectedBall);
        
        gl.uniform1f(widthLoc, SPACE_WIDTH);
        gl.uniform1f(heightLoc, SPACE_HEIGHT);
        gl.bindVertexArray(ballVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, ballVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions.flat()), gl.STATIC_DRAW);        
        gl.drawArrays(gl.POINTS, 0, velocities.length);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
          
//draw rays
        rayShader.use(gl);
        
        gl.uniform1f(rayWidthLoc, SPACE_WIDTH);
        gl.uniform1f(rayHeightLoc, SPACE_HEIGHT);
        let currTimeLoc = rayShader.getULoc(gl, "currTime")
        gl.uniform1f(currTimeLoc, cTime/1000.0);
        
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