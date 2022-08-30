"use strict";

import * as glm from "gl-matrix" 
import {Shader} from "./shader"
import * as shaders from "./shader"

let i = 0
let value = 0.0
let gl:WebGL2RenderingContext
let program:WebGLProgram|null
const BALL_RADIUS:number = 10;


const WIDTH:number = 800;
const HEIGHT:number = 800;

var mouseX = 0;
var mouseY = 0

var neighborMethods = ["Brute Force", "Uniform Grid", "Quad Tree", "KD Tree"];
var currMethod = 0;
var shootFunction:(this: HTMLCanvasElement, ev: MouseEvent) => any;



var resolveStep:(value: number | PromiseLike<number>) => void;

function step(event:any) {
    resolveStep(0);
}

async function genPromise(){
    await new Promise((resolve:(value: number | PromiseLike<number>) => void) => resolveStep = resolve);
}

const clamp = (num:number, min:number, max:number) => Math.min(Math.max(num, min), max);

// document.addEventListener("dragover", function(e){
//     e = e || window.event;
//     var dragX = e.pageX
//     var dragY = e.pageY;

// }, false);


function quadratic(a:number, b:number, c:number):Array<number>{
    let insideRoot = (b*b) - (4*a*c)
    if(insideRoot <0){
        return [Number.MAX_VALUE, Number.MAX_VALUE];
    }
    let t0 = (-b - Math.sqrt(insideRoot))/(2*a);
    let t1 = (-b + Math.sqrt(insideRoot))/(2*a);
    return [t0, t1];


}
function rayCircle(rayO:glm.vec2, rayD:glm.vec2, circleOrigin:glm.vec2):number {

    let wv:glm.vec2 = glm.vec2.fromValues(0, 0);

	let L = glm.vec2.sub(wv, rayO, circleOrigin);
	let a = glm.vec2.dot(rayD, rayD);
	let b = 2.0 * glm.vec2.dot(rayD, L);
	let c = glm.vec2.dot(L, L) - (BALL_RADIUS*BALL_RADIUS);
    //console.log(a, b, c)


	let t0:number, t1:number;
	let ts:Array<number> = quadratic(a, b, c);
    t0 = ts[0];
    t1 = ts[1];
    //console.log(t0, t1);

	if (t0 > t1) {
        t0 = ts[1];
        t1 = ts[0];
	}
	if (t0 < 0) {
		t0 = t1;
		if (t0 < 0) {
			return Number.MAX_VALUE
		}
	}

    return t0;
}



function main() {
    document.getElementById("stepButton")?.addEventListener("click", step)
    
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

    gl =  tempGl

    let activeBall = -1;

    let ballShader = new Shader(gl, shaders.ballVertSource, shaders.ballFragSource);
    let rayShader = new Shader(gl, shaders.rayVertSource, shaders.rayFragSource);



    
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

    gl.uniform1f(widthLoc, WIDTH);
    gl.uniform1f(heightLoc, HEIGHT);
    gl.uniform1f(radiusLoc, BALL_RADIUS);

    rayShader.use(gl);
    let rayWidthLoc = rayShader.getULoc(gl, "width")
    let rayHeightLoc = rayShader.getULoc(gl, "height")

    let lastTime = 0;
    let deltaTime = 0;
    let cTime = 0

    var currSteps = 0;
    var minT:number = Number.MAX_VALUE;
    var minIdx:number = -1;


    let go = true;
    let selectedBall = -1;
    // function selectBall(event:MouseEvent){
    //     for(let i = 0; i < velocities.length; i++) {
    //         let oidx = i*2;
    //     }
    //     const rect = canvas.getBoundingClientRect()
    //     let pos:glm.vec2 =  
    // }
    function spawnMeteor(){
        positions.push([Math.random()*WIDTH, HEIGHT])
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
        let mintElement = document.getElementById("minT");
        if(mintElement != null) {
            mintElement.innerText = String(minT);
        }
        let miniElement = document.getElementById("minI");
        if(miniElement != null) {
            miniElement.innerText = String(minIdx);
        }
    }

    async function shootRayBrute(e:MouseEvent) {
        console.log("shoot rayBasic");
        if(go){
            go = false;
            let wv = glm.vec2.fromValues(0, 0);
            let rayO:glm.vec2 = glm.vec2.fromValues(WIDTH/2, 0);
            const rect = canvas.getBoundingClientRect();
            let dest:glm.vec2 = glm.vec2.fromValues(e.clientX-rect.left, HEIGHT-(e.clientY-rect.top));
            let rayDir = glm.vec2.normalize(wv, glm.vec2.sub(dest, dest, rayO))
            let endPoint = glm.vec2.multiply(wv, rayDir, glm.vec2.fromValues(WIDTH*HEIGHT, WIDTH*HEIGHT));
            rays.push([WIDTH/2, 0, cTime/1000, endPoint[0], endPoint[1], cTime/1000]);

            minT = Number.MAX_VALUE;
            minIdx = -1;
            currSteps = 0;
            updateText();
            
            for(let i = 0; i < positions.length; i++){
                currSteps++;
                selectedBall = i;
                let C:glm.vec2 = glm.vec2.fromValues(positions[i][0], positions[i][1]);
                let t0 = rayCircle(rayO, rayDir, C);
                if(t0 < minT){
                    minT = t0;
                    minIdx = i;
                }
                
                updateText();
                await genPromise();
            }
            selectedBall = -1;
            if(minIdx >= 0) {
                positions = positions.filter((v, i)=>i!=minIdx);
                velocities = velocities.filter((v, i)=>i!=minIdx);
            } 
            go = true;
        }
    }
    
    async function shootRayGrid(e:MouseEvent) {
        console.log("shoot ray grid");
        /**
         * construct a grid partitioning system
         * add all points into it
         * use to compute ray/circle intersection
         */
    }
    
    async function shootRayQuad(e:MouseEvent) {
        console.log("shoot ray quad");
        /** 
         * From list of points, create quad tree
         * use quad tree to perform ray/circle intersection
         */
    }
    
    async function shootRayKD(e:MouseEvent) {
        console.log("shoot ray quad");
        /** 
         * From list of points, create kd tree
         * use kd tree to perform ray/circle intersection
         */
    }

    let shootFunctions = [shootRayBrute, shootRayGrid, shootRayQuad, shootRayKD];
    function nextMode() {
        currMethod = (currMethod+1)%neighborMethods.length;
        canvas.removeEventListener("click", shootFunction, false)
        shootFunction = shootFunctions[currMethod];
        canvas.addEventListener("click", shootFunction, false)
    }
    function prevMode() {
        currMethod = (currMethod-1)%neighborMethods.length;
        canvas.removeEventListener("click", shootFunction, false)
        shootFunction = shootFunctions[currMethod];
        canvas.addEventListener("click", shootFunction, false)
    }
    
    shootFunction = shootFunctions[currMethod];
    canvas.addEventListener("click", shootFunction, false)

    document.getElementById("nextMode")?.addEventListener("click", nextMode);
    document.getElementById("prevMode")?.addEventListener("click", prevMode);

    
    function printPos(event:KeyboardEvent):any{
        if(event.key == " "){
            go = !go;
            //console.log(positions);
        }
        if(event.key == "a"){
            canvas.removeEventListener("click", shootFunction, false)
            shootFunction = shootFunctions[1];
            canvas.addEventListener("click", shootFunction, false)
        }
    }
    canvas.addEventListener("keydown", printPos, false)

    let lastSecond = 0;

    positions.push([0, 0]);
    velocities.push(0);
    //rays.push([0.0, 0.0, lastTime/1000, WIDTH, HEIGHT, lastTime/1000]);

    function draw(currentTime:number){
        cTime = currentTime;
        deltaTime = (currentTime-lastTime)/1000.0;
        lastTime = currentTime;
        //if(!go){requestAnimationFrame(draw); return;}
        //positions[0] = [mouseX, HEIGHT-mouseY];
        
//update velcities and positions for each ball
        if(go){
            
            for(let i = 0; i < positions.length; i++) {
                positions[i][1] += velocities[i] * deltaTime;
            }
    //spawn meteors every second
            let thisSecond = Math.floor(currentTime/1000);
            if(thisSecond != lastSecond){
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


//draw balls
        ballShader.use(gl);
        console.log("selected ball: ", selectedBall);
        gl.uniform1i(selectedBallLoc, selectedBall);
        
        gl.uniform1f(widthLoc, WIDTH);
        gl.uniform1f(heightLoc, HEIGHT);
        gl.bindVertexArray(ballVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, ballVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions.flat()), gl.STATIC_DRAW);        
        gl.drawArrays(gl.POINTS, 0, velocities.length);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
        

//draw rays
        rayShader.use(gl);
        
        gl.uniform1f(rayWidthLoc, WIDTH);
        gl.uniform1f(rayHeightLoc, HEIGHT);
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