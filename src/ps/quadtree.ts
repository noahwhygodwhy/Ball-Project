import * as glm from "gl-matrix" 
import {Ray, AABB} from "../ray"
import { BALL_RADIUS, SPACE_WIDTH, SPACE_HEIGHT, genPromise, selectBall} from "../graphics"
import { Shader } from "../shader"
import { partitioningSystem, rayHitListOfShapes } from "./partitioningSystem"

const LINE_RED = 1.0
const GRID_RED = 0.70
const SQUARE_RED = 0.20
// const GRID_BIAS = 0.1 //Grid size should never be anywhere close to this small

const MAX_LAYER = 10
const OPTIMAL_SIZE = 2



export class quadTree implements partitioningSystem {

    tree:quadNode
    currNode:quadNode|undefined = undefined

    constructor(balls:Array<Array<number>>){
        let sAABB = new AABB(0, 0, SPACE_WIDTH, SPACE_HEIGHT)
        this.tree = new quadBranch(balls, Array.from(Array(balls.length).keys()), sAABB)
    }

    async intersectTest(ray:Ray, balls:Array<Array<number>>): Promise<{hit:boolean, minT:number, idx:number}> {
        
        let stack:Array<quadNode> = [this.tree] //TO BE TREATED LIKE A STACK
       
        while(stack.length>0) {
            this.currNode = stack.pop()

            if(!this.currNode) {
                throw "AHHHHHHHHHHHHHHH why is quadtree's currnode undefined, this should never happen"
            }

            let res = ray.intersectAABB(this.currNode.aabb)
            if(!res.hit) {
                continue
            }

            if(this.currNode instanceof quadLeaf) {              
                await genPromise()
                let res = await rayHitListOfShapes(this.currNode.myList, ray, balls)
                if(res.hit) {
                    return res
                }
            }

            if(this.currNode instanceof quadBranch) {
                await genPromise()
                let xp = ray.direction[0] > 0
                let yp = ray.direction[1] > 0
                let order = []
                if(xp) {
                    if(yp) {
                        order = [this.currNode.nn, this.currNode.np, this.currNode.pn, this.currNode.pp]
                    }
                    else {
                        order = [this.currNode.np, this.currNode.nn, this.currNode.pp, this.currNode.pn]
                    }
                } 
                else {
                    if(yp) {
                        order = [this.currNode.pn, this.currNode.pp, this.currNode.nn, this.currNode.np]
                    }
                    else {
                        order = [this.currNode.pp, this.currNode.np, this.currNode.pn, this.currNode.nn]
                    }
                }
                order.reverse()//cause it helped me think about it easier
                order.forEach(v=>stack.push(v))
                
            }

        }
        return {hit:false, minT:0, idx:-1}
    }
    draw(shader: Shader, gl: WebGL2RenderingContext): void {
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

        let stack:Array<quadNode> = [this.tree] //TO BE TREATED LIKE A STACK
        while(stack.length>0) {
            let currNode = stack.pop()

            if(currNode instanceof quadNode) {
                //bottom
                vertices.push([currNode.aabb.min[0], currNode.aabb.min[1],  GRID_RED])
                vertices.push([currNode.aabb.max[0], currNode.aabb.min[1],  GRID_RED])
                //left
                vertices.push([currNode.aabb.min[0], currNode.aabb.min[1],  GRID_RED])
                vertices.push([currNode.aabb.min[0], currNode.aabb.max[1],  GRID_RED])
                //top
                vertices.push([currNode.aabb.min[0], currNode.aabb.max[1],  GRID_RED])
                vertices.push([currNode.aabb.max[0], currNode.aabb.max[1],  GRID_RED])
                //right
                vertices.push([currNode.aabb.max[0], currNode.aabb.min[1],  GRID_RED])
                vertices.push([currNode.aabb.max[0], currNode.aabb.max[1],  GRID_RED])
            }
            if(currNode instanceof quadBranch) {
                let order = [currNode.nn, currNode.np, currNode.pn, currNode.pp]
                order.forEach(v=>stack.push(v))

            }
        }
        let offset = 0
        if(this.currNode) {
            offset = 6
            //bottom
            vertices.push([this.currNode.aabb.min[0], this.currNode.aabb.min[1],  LINE_RED])
            vertices.push([this.currNode.aabb.max[0], this.currNode.aabb.min[1],  LINE_RED])
            //left
            vertices.push([this.currNode.aabb.min[0], this.currNode.aabb.min[1],  LINE_RED])
            vertices.push([this.currNode.aabb.min[0], this.currNode.aabb.max[1],  LINE_RED])
            //top
            vertices.push([this.currNode.aabb.min[0], this.currNode.aabb.max[1],  LINE_RED])
            vertices.push([this.currNode.aabb.max[0], this.currNode.aabb.max[1],  LINE_RED])
            //right
            vertices.push([this.currNode.aabb.max[0], this.currNode.aabb.min[1],  LINE_RED])
            vertices.push([this.currNode.aabb.max[0], this.currNode.aabb.max[1],  LINE_RED])


            vertices.push([this.currNode.aabb.min[0], this.currNode.aabb.min[1], SQUARE_RED])
            vertices.push([this.currNode.aabb.max[0], this.currNode.aabb.min[1], SQUARE_RED])
            vertices.push([this.currNode.aabb.min[0], this.currNode.aabb.max[1], SQUARE_RED])
            
            vertices.push([this.currNode.aabb.max[0], this.currNode.aabb.max[1], SQUARE_RED])
            vertices.push([this.currNode.aabb.min[0], this.currNode.aabb.max[1], SQUARE_RED])
            vertices.push([this.currNode.aabb.max[0], this.currNode.aabb.min[1], SQUARE_RED])




        }
        
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW); 
        gl.drawArrays(gl.LINES, 0, vertices.length-offset);

        gl.drawArrays(gl.TRIANGLES, vertices.length-offset, offset);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);

    }






}







class quadNode {
    aabb:AABB
    halfX:number
    halfY:number
    constructor(aabb:AABB) {
        this.aabb = aabb
        this.halfX = (this.aabb.min[0] + this.aabb.max[0])/2
        this.halfY = (this.aabb.min[1] + this.aabb.max[1])/2
    }
}

class quadLeaf extends quadNode{
    myList:Array<number>
    constructor(myList:Array<number>, aabb:AABB) {
        super(aabb)
        this.myList = myList;
    }
}

class quadBranch extends quadNode { 

  //xy
    pp:quadNode
    pn:quadNode
    np:quadNode
    nn:quadNode

    constructor(balls:Array<Array<number>>, totalList:Array<number>, aabb:AABB, layer = 0){
        super(aabb)

        let ppList = totalList.filter((v)=>
            balls[v][0]+BALL_RADIUS > this.halfX
            && balls[v][1]+BALL_RADIUS > this.halfY
        )
        let pnList = totalList.filter((v)=>
            balls[v][0]+BALL_RADIUS > this.halfX
            && balls[v][1]-BALL_RADIUS < this.halfY
        )
        let npList = totalList.filter((v)=>
            balls[v][0]-BALL_RADIUS < this.halfX
            && balls[v][1]+BALL_RADIUS > this.halfY
        )
        let nnList = totalList.filter((v)=>
            balls[v][0]-BALL_RADIUS < this.halfX
            && balls[v][1]-BALL_RADIUS < this.halfY
        )

        let ppAABB = new AABB(this.halfX, this.halfY, aabb.max[0], aabb.max[1])
        let pnAABB = new AABB(this.halfX, aabb.min[1], aabb.max[0], this.halfY)
        let npAABB = new AABB(aabb.min[0], this.halfY, this.halfX, aabb.max[1])
        let nnAABB = new AABB(aabb.min[0], aabb.min[1],this.halfX, this.halfY)

        if (layer >= MAX_LAYER || ppList.length <= OPTIMAL_SIZE) {
            this.pp = new quadLeaf(ppList, ppAABB)
        } else {
            this.pp = new quadBranch(balls, ppList, ppAABB, layer+1)
        }
        if (layer >= MAX_LAYER || pnList.length <= OPTIMAL_SIZE) {
            this.pn = new quadLeaf(pnList, pnAABB)
        } else {
            this.pn = new quadBranch(balls, pnList, pnAABB, layer+1)
        }
        if (layer >= MAX_LAYER || npList.length <= OPTIMAL_SIZE) {
            this.np = new quadLeaf(npList, npAABB)
        } else {
            this.np = new quadBranch(balls, npList, npAABB, layer+1)
        }
        if (layer >= MAX_LAYER || nnList.length <= OPTIMAL_SIZE) {
            this.nn = new quadLeaf(nnList, nnAABB)
        } else {
            this.nn = new quadBranch(balls, nnList, nnAABB, layer+1)
        }
        




    }


}
