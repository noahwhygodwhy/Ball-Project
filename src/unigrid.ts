import * as glm from "gl-matrix" 
import {Ray, AABB} from "./ray"
import { BALL_RADIUS, SPACE_WIDTH, SPACE_HEIGHT, genPromise, selectBall} from "./graphics"
import {drawable} from "./drawable"
import { Shader } from "./shader"


const GRID_BIAS = 0.001 //Grid size should never be anywhere close to this small

export class unigrid implements drawable{

    grid:Array<Array<Array<number>>>
    gridSize:number



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
            //TODO: add it to all four possible grid sections, not just the centers one

            let {y, x} = this.getGridIdx(glm.vec2.fromValues(v[0]-GRID_BIAS, v[1]-GRID_BIAS))
            console.log("coord:", v[0], v[1], "coords:", x, y)
            this.grid[y][x].push(i)
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
        let {hit, tMin, tMax} = ray.intersectAABB(worldAABB)
        if(!hit){
            return {hit:false, minT:0, idx:-1}
        }
        let newRayOrigin = newRayO(ray, tMin+GRID_BIAS)

        let {x, y} = this.getGridIdx(newRayOrigin)
        let currAB = this.aabbFromGrid(x, y)
        ;({hit, tMin, tMax} = ray.intersectAABB(currAB));

        while(hit) {
            
            let minCircleT = Infinity
            let minCircle = -1
            this.grid[y][x].forEach((v, i)=>{
                let circleRes = ray.intersectCircle(glm.vec2.fromValues(balls[v][0], balls[v][1]))

                if(circleRes.hit) {
                    if(circleRes.minT < minCircleT){
                        minCircleT = circleRes.minT
                        minCircle = v
                    }
                }
            })
            if(minCircle >= 0){
                let hitPoint = newRayO(ray, minCircleT)
                let actualT = glm.vec2.distance(hitPoint, originalOrigin)
                return {hit:true, minT:actualT, idx:minCircle}
            }


            newRayOrigin = newRayO(ray, tMin+GRID_BIAS)
            ;({x, y} = this.getGridIdx(newRayOrigin));
            let currAB = this.aabbFromGrid(x, y)
            ray.origin = newRayOrigin
            ;({hit, tMin, tMax} = ray.intersectAABB(currAB));
        }
        return {hit:false, minT:Infinity, idx:-1}



    }
    draw(shader:Shader, gl:WebGL2RenderingContext):void {}

}

function newRayO(ray:Ray, t:number) {
    let wv = glm.vec2.fromValues(t, t)
    wv = glm.vec2.mul(wv, wv, ray.direction)
    wv = glm.vec2.add(wv, wv, ray.origin)
    return wv
}