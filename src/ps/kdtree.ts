import * as glm from "gl-matrix" 
import {Ray, AABB} from "../ray"
import { BALL_RADIUS, SPACE_WIDTH, SPACE_HEIGHT, genPromise, selectBall, addAction, formatAABB} from "../graphics"
import { Shader } from "../shader"
import { partitioningSystem, rayHitListOfShapes } from "./partitioningSystem"

var i = 0;


const GRID_RED = 0.70
const LINE_RED = 1.00
const SQUARE_RED = 0.20
const MAX_LAYER = 10
const OPTIMAL_SIZE = 2


const clamp = (num:number, min:number, max:number):number => Math.min(Math.max(num, min), max);


// var drawList:Array<{n:kdNode}> = []; //n for node, g for greater 

const axises = ["X", "Y"]

export class kdTree implements partitioningSystem {
    
    tree:kdNode
    currNode:kdNode|undefined = undefined

    constructor(balls:Array<Array<number>>) {
        let sAABB = new AABB(0, 0, SPACE_WIDTH, SPACE_HEIGHT)
        this.tree = new kdBranch(balls, Array.from(Array(balls.length).keys()), sAABB)
    }
    async intersectTest(ray:Ray, balls:Array<Array<number>>): Promise<{hit:boolean, minT:number, idx:number}> {
        
        addAction("Staring traversal of KD Tree")
        
        let stack:Array<kdNode> = [this.tree] //TO BE TREATED LIKE A STACK
        while(stack.length>0) {
            await genPromise()
            this.currNode = stack.pop()
            if(!this.currNode) {
                throw "AHHHHHHHHHHHHHHH why is kdtree's currnode undefined, this should never happen"
            }
            addAction(`Current Node: ${formatAABB(this.currNode.aabb)}`)
            let res = ray.intersectAABB(this.currNode.aabb)
            if(!res.hit) {
                addAction("Ray does not intersect this node, skipping")
                await genPromise()
                continue
            }
            if(this.currNode instanceof kdLeaf) {
                if(this.currNode.draw) {
                    addAction("Leaf Node - Testing all contained balls")
                } else {
                    addAction("Edge Node - Testing all intersected balls")
                }
                await genPromise()
                let res = await rayHitListOfShapes(this.currNode.myList, ray, balls)
                if(res.hit) {
                    return res
                }
            }
            if(this.currNode instanceof kdBranch) {
                addAction(`Branch Node - ${axises[this.currNode.axis]}|${this.currNode.value.toFixed(0)}`)
                let p = ray.direction[this.currNode.axis] > 0
                if(p) {
                    stack.push(this.currNode.greater)
                    stack.push(this.currNode.onTheLine)
                    if(ray.origin[this.currNode.axis] < this.currNode.value) {
                        stack.push(this.currNode.lesser)
                    }
                }
                else {
                    stack.push(this.currNode.lesser)
                    stack.push(this.currNode.onTheLine)
                    if(ray.origin[this.currNode.axis] > this.currNode.value) {
                        stack.push(this.currNode.greater)
                    }
                }
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

        let stack:Array<kdNode> = [this.tree] //TO BE TREATED LIKE A STACK
        while(stack.length>0) {
            let currNode = stack.pop()
            if(currNode instanceof kdNode) {
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
            if(currNode instanceof kdBranch) {
                stack.push(currNode.lesser)
                stack.push(currNode.greater)
            }
        }

        let offset = 0
        if(this.currNode && (this.currNode instanceof kdBranch || (this.currNode instanceof kdLeaf && this.currNode.draw))) {
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

class kdNode {
    aabb:AABB
    constructor(aabb:AABB) {
        this.aabb = aabb
    }

}

class kdLeaf extends kdNode {
    myList:Array<number>
    draw:boolean
    constructor(myList:Array<number>, aabb:AABB, draw:boolean) {
        super(aabb)
        this.draw = draw
        this.myList = myList;

    }
    
}




class kdBranch extends kdNode {

    lesser:kdNode
    greater:kdNode
    onTheLine:kdLeaf
    axis:number
    value:number
    constructor(balls:Array<Array<number>>, totalList:Array<number>, aabb:AABB, layer = 0){
        super(aabb)
        this.axis = layer % 2;

        //optimally the median would be found with quick select, or a
        //different partitioning method would be used, but this is js lol
        totalList.sort((a, b)=> (balls[a][this.axis]-balls[b][this.axis]))
        this.value = balls[totalList[Math.floor(totalList.length/2)]][this.axis]

        let myList = totalList.filter((v)=>
            balls[v][this.axis]-BALL_RADIUS < this.value
            && balls[v][this.axis]+BALL_RADIUS > this.value
        )

        let lesserList = totalList.filter((v)=>balls[v][this.axis]+BALL_RADIUS < this.value)
        let greaterList = totalList.filter((v)=>balls[v][this.axis]-BALL_RADIUS > this.value)



        let lesserAABB = aabb.copy()
        lesserAABB.max[this.axis] = this.value

        let greaterAABB = aabb.copy()
        greaterAABB.min[this.axis] = this.value

        let lineAABB = aabb.copy()
        lineAABB.min[this.axis] = this.value - (BALL_RADIUS*2)
        lineAABB.max[this.axis] = this.value + (BALL_RADIUS*2)
        
        if(lesserList.length > OPTIMAL_SIZE && layer < MAX_LAYER){
            this.lesser = new kdBranch(balls, lesserList, lesserAABB, layer+1)
        } else {
            this.lesser = new kdLeaf(lesserList, lesserAABB, true)
        }

        this.onTheLine = new kdLeaf(myList, lineAABB, false)

        if(greaterList.length > OPTIMAL_SIZE && layer < MAX_LAYER){
            this.greater = new kdBranch(balls, greaterList, greaterAABB, layer+ 1)
        } else {
            this.greater = new kdLeaf(greaterList, greaterAABB, true)
        }
    }


}