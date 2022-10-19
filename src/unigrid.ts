import * as glm from "gl-matrix" 
import {Ray, AABB} from "./ray"
import { BALL_RADIUS, SPACE_WIDTH, SPACE_HEIGHT, genPromise, selectBall} from "./graphics"
import {drawable} from "./drawable"
import { Shader } from "./shader"

const GRID_RED = 0.40
const SQUARE_RED = 0.20
const GRID_BIAS = 0.1 //Grid size should never be anywhere close to this small

export class unigrid implements drawable{

    grid:Array<Array<Array<number>>>
    gridSize:number
    currAABB:AABB|null = null    

    constructor(balls:Array<Array<number>>, gridSize:number = 100){
        console.log("ys:",Math.floor(SPACE_HEIGHT/gridSize))
        console.log("xs:",Math.floor(SPACE_WIDTH/gridSize))

        this.gridSize = gridSize
        this.grid = new Array<Array<Array<number>>>(Math.floor(SPACE_HEIGHT/gridSize));
        for(let i = 0; i < this.grid.length; i++){
            this.grid[i] = new Array<Array<number>>(Math.floor(SPACE_WIDTH/gridSize))
            for(let j = 0; j < this.grid[i].length; j++) {
                this.grid[i][j] = new Array<number>()
            }
        }
        console.log("Width:", SPACE_WIDTH)
        console.log("Height:", SPACE_HEIGHT)

        balls.forEach((v, i)=>{
            
            for(let ix = -1; ix < 2; ix+=2){
                for(let iy = -1; iy < 2; iy+=2) {
                    let {y, x} = this.getGridIdx(glm.vec2.fromValues(v[0]-GRID_BIAS + (ix * BALL_RADIUS), v[1]-GRID_BIAS + (iy * BALL_RADIUS)))
                    if(y < this.grid.length && y >= 0 && x < this.grid[y].length && x >= 0) {
                        if(this.grid[y][x].indexOf(i) == -1) { //this ups the time complexity, but as this is just a demo, i'm not going to take the time to fix it unless I can find time later
                            this.grid[y][x].push(i)
                        }
                    }
                }
            }
            //TODO: add it to all four possible grid sections, not just the centers one
            // let {y, x} = this.getGridIdx(glm.vec2.fromValues(v[0]-GRID_BIAS, v[1]-GRID_BIAS))
            // console.log("coord:", v[0], v[1], "coords:", x, y)
            // this.grid[y][x].push(i)
        })

    }
    
    aabbFromGrid(x:number, y:number):AABB {
        if ((x)*this.gridSize > SPACE_WIDTH || (y)*this.gridSize > SPACE_HEIGHT){
            return new AABB(0, 0, 0, 0)//unhitable AABB
        }
        return new AABB((x)*this.gridSize, (y)*this.gridSize, (x+1)*this.gridSize, (y+1)*this.gridSize)
    }

    getGridIdx(p:glm.vec2):{y:number, x:number} {

        let x = Math.floor(p[0]/this.gridSize)
        let y = Math.floor(p[1]/this.gridSize)
        return {y, x}
    }
    
    async intersectTest(ray:Ray, balls:Array<Array<number>>): Promise<{hit:boolean, minT:number, idx:number}> {

        let originalOrigin = ray.origin
        let worldAABB = new AABB(0, 0, SPACE_WIDTH, SPACE_HEIGHT);
        let hitResult = ray.intersectAABB(worldAABB)
        if(!hitResult.hit){
            return {hit:false, minT:0, idx:-1}
        }
        let newRayOrigin = newRayO(ray, hitResult.tMin+GRID_BIAS)

        let gridCoord = this.getGridIdx(newRayOrigin)
        this.currAABB = this.aabbFromGrid(gridCoord.x, gridCoord.y)
        hitResult = ray.intersectAABB(this.currAABB)
        await genPromise()
        while(hitResult.hit) {
            console.log("grid x:", gridCoord.x, "grid y", gridCoord.y)
            console.log("going")
            let minCircleT = Infinity
            let minCircle = -1
            console.log("this.grid[gridCoord.y][gridCoord.x].length", this.grid[gridCoord.y][gridCoord.x].length)
            for(let i = 0; i < this.grid[gridCoord.y][gridCoord.x].length; i++) {
                let v = this.grid[gridCoord.y][gridCoord.x][i]
                selectBall(v)
                console.log("selected", v)
                await genPromise()
                let circleRes = ray.intersectCircle(glm.vec2.fromValues(balls[v][0], balls[v][1]))

                if(circleRes.hit) {
                    console.log("circleres.minT", circleRes.minT)
                    if(circleRes.minT < minCircleT){
                        minCircleT = circleRes.minT
                        minCircle = v
                    }
                }
            }
            if(this.grid[gridCoord.y][gridCoord.x].length > 0 ){
                await genPromise()
            }
            selectBall(-1)
            console.log("selected -1")
            if(minCircle >= 0){
                console.log("returning circle hit")
                let hitPoint = newRayO(ray, minCircleT)
                let actualT = glm.vec2.distance(hitPoint, originalOrigin)
                return {hit:true, minT:actualT, idx:minCircle}
            }

            console.log("ray", ray)
            console.log("hit res:", hitResult)
            console.log("")
            newRayOrigin = newRayO(ray, hitResult.tMax+GRID_BIAS)
            gridCoord = this.getGridIdx(newRayOrigin)
            this.currAABB = this.aabbFromGrid(gridCoord.x, gridCoord.y)
            ray.origin = newRayOrigin
            hitResult = ray.intersectAABB(this.currAABB);
        }
        return {hit:false, minT:Infinity, idx:-1}



    }
    draw(shader:Shader, gl:WebGL2RenderingContext):void {
        shader.use(gl)
        let lineVAO = gl.createVertexArray();
        let lineVBO = gl.createBuffer();
        gl.bindVertexArray(lineVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, lineVBO);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
        gl.bindAttribLocation(shader.getProg(), 0, "aPos")
        shader.relink(gl);
        shader.use(gl)

        let widthLoc = shader.getULoc(gl, "width")
        let heightLoc = shader.getULoc(gl, "height")

        gl.uniform1f(widthLoc, SPACE_WIDTH);
        gl.uniform1f(heightLoc, SPACE_HEIGHT);

        let vertices:Array<Array<number>> = []
        let numGridVerts = 0
        for(let x = 0; x <= SPACE_WIDTH; x+=this.gridSize){
            vertices.push([x, 0, GRID_RED])
            vertices.push([x, SPACE_HEIGHT, GRID_RED])
            numGridVerts += 2
        }
        for(let y = 0; y <= SPACE_WIDTH; y+=this.gridSize){
            vertices.push([0, y, GRID_RED])
            vertices.push([SPACE_WIDTH, y, GRID_RED])
            numGridVerts += 2
        }
        if(this.currAABB) {
            vertices.push([this.currAABB.min[0], this.currAABB.min[1], SQUARE_RED])
            vertices.push([this.currAABB.max[0], this.currAABB.min[1], SQUARE_RED])
            vertices.push([this.currAABB.min[0], this.currAABB.max[1], SQUARE_RED])
            
            vertices.push([this.currAABB.max[0], this.currAABB.max[1], SQUARE_RED])
            vertices.push([this.currAABB.min[0], this.currAABB.max[1], SQUARE_RED])
            vertices.push([this.currAABB.max[0], this.currAABB.min[1], SQUARE_RED])
        }
        
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW); 
        
        gl.drawArrays(gl.LINES, 0, numGridVerts);

        gl.drawArrays(gl.TRIANGLES, numGridVerts, 6);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

}

function newRayO(ray:Ray, t:number) {
    let wv = glm.vec2.fromValues(t, t)
    wv = glm.vec2.mul(wv, wv, ray.direction)
    wv = glm.vec2.add(wv, wv, ray.origin)
    return wv
}