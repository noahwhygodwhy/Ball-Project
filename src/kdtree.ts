import * as glm from "gl-matrix" 
import {Ray, AABB} from "./ray"
import { BALL_RADIUS, SPACE_WIDTH, SPACE_HEIGHT, genPromise, selectBall} from "./graphics"
import {drawable} from "./drawable"
import { Shader } from "./shader"

var i = 0;


const LINE_RED = 0.9
const SQUARE_RED = 0.1


var drawList:Array<{n:kdNode, g:boolean}> = []; //n for node, g for greater 

export class kdNode implements drawable{
    value:number = 0
    axis:number = -1
    // balls:Array<Array<number>> = []
    myList:Array<number> = []
    lesserChild:kdNode|null = null
    greaterChild:kdNode|null = null
    aabb:AABB
    step:number = 0

    //TODO: needs a totalList, what the fuck are you using for an index
    constructor(balls:Array<Array<number>>, totalList:Array<number>, aabb:AABB,layer:number = 0) {
        this.aabb = aabb
        drawList = []
        i+=1

        if(i > 50)
        {
            return;
        }
        this.step = 0
        this.axis = layer%2
        console.log("about to sort")
        this.myList = [...totalList];
        this.myList.sort((a, b)=> (balls[a][this.axis]-balls[b][this.axis]))

        console.log("sorted")
        // console.log("original", this.balls)
        
        let middleIdx:number = Math.floor(this.myList.length/2)
        console.log("middle idx", middleIdx)
        this.value = balls[this.myList[middleIdx]][this.axis]
        console.log("value", this.value)
        console.log("axis", this.axis)

        
        let lesserBalls:Array<number> = [...this.myList];
        let greaterBalls:Array<number> = [...this.myList];

        console.log("original:", this.myList)
        while (lesserBalls.length > 0 && balls[lesserBalls[lesserBalls.length-1]][this.axis] > this.value - BALL_RADIUS) {
            lesserBalls = lesserBalls.slice(0, -1)
        }
        while (greaterBalls.length > 0 && balls[greaterBalls[0]][this.axis] < this.value + BALL_RADIUS) {
            greaterBalls = greaterBalls.slice(1)
        }
        this.myList = this.myList.slice(lesserBalls.length, this.myList.length-greaterBalls.length)

        console.log("lesser:", lesserBalls)
        console.log("mine:", this.myList)
        console.log("greater:", greaterBalls)
        
        let lesserAABB = new AABB(this.aabb.min[0], this.aabb.min[1], this.aabb.max[0], this.aabb.max[1])
        let greaterAABB = new AABB(this.aabb.min[0], this.aabb.min[1], this.aabb.max[0], this.aabb.max[1])
        lesserAABB.max[this.axis] = this.value
        greaterAABB.min[this.axis] = this.value

        if(lesserBalls.length > 0) {
            this.lesserChild = new kdNode(balls, lesserBalls, lesserAABB, layer+1);
        } else {
            this.lesserChild = null;
        }
        if(greaterBalls.length > 0) {
            this.greaterChild = new kdNode(balls, greaterBalls,greaterAABB, layer+1);
        } else {
            this.greaterChild = null;
        }
        
    }


    draw(shader:Shader, gl:WebGL2RenderingContext):void {
        // console.log("drawing kdNode", this.drawList.length)
        //dirty drawing
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

        let drawSquare:AABB = new AABB(0, 0, SPACE_WIDTH, SPACE_HEIGHT);
        drawList.forEach((v, i) => {
            if(v.g) {
                if(v.n.axis == 0) {
                    vertices.push([v.n.value, drawSquare.min[1], LINE_RED])
                    vertices.push([v.n.value, drawSquare.max[1], LINE_RED])
                    drawSquare.min[0] = v.n.value
                } else {
                    vertices.push([drawSquare.min[0], v.n.value, LINE_RED])
                    vertices.push([drawSquare.max[0], v.n.value, LINE_RED])
                    drawSquare.min[1] = v.n.value
                }
                //if greater draw a line from drawSquare[axis] to space_max
                //set drawsquare[axis] to be this value
            } else {
                if(v.n.axis == 0) {
                    vertices.push([v.n.value, drawSquare.min[1], LINE_RED])
                    vertices.push([v.n.value, drawSquare.max[1], LINE_RED])
                    drawSquare.max[0] = v.n.value
                } else {
                    vertices.push([drawSquare.min[0], v.n.value, LINE_RED])
                    vertices.push([drawSquare.max[0], v.n.value, LINE_RED])
                    drawSquare.max[1] = v.n.value
                }
                //if lessser, draw a line from 0 to drawSquare[axis]
                //set drawsquare[axis] to be this value
            }
        })

        vertices.push([drawSquare.min[0], drawSquare.min[1], SQUARE_RED])
        vertices.push([drawSquare.max[0], drawSquare.min[1], SQUARE_RED])
        vertices.push([drawSquare.min[0], drawSquare.max[1], SQUARE_RED])
        
        vertices.push([drawSquare.max[0], drawSquare.max[1], SQUARE_RED])
        vertices.push([drawSquare.min[0], drawSquare.max[1], SQUARE_RED])
        vertices.push([drawSquare.max[0], drawSquare.min[1], SQUARE_RED])

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW); 

        gl.drawArrays(gl.LINES, 0, vertices.length-6);

        gl.drawArrays(gl.TRIANGLES, vertices.length-6, 6);

        //draw almost black dark red square (two triangles) in drawsquare
        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
        
    }

    cleanString(){
        let theString = ""
        theString += Math.floor(this.value)
        theString += "|"
        theString += ["X","Y"][this.axis]
        theString += " "
        if(this.myList)
            theString += this.myList.length
        else
            theString += "noballs"
        return theString
    }
    xXx_to$tring_xXx(layer = 0){
        let theString = ""
        for(let i = 0; i < layer; i++){
            theString+="\t";
        }
        theString += Math.floor(this.value)
        theString += "|"
        theString += ["X","Y"][this.axis]
        theString += " "
        if(this.myList)
            theString += this.myList.length
        else
            theString += "noballs"
        theString += "\n"

        if(this.lesserChild){
            theString += this.lesserChild.xXx_to$tring_xXx(layer+1)
        }
        if(this.greaterChild){
            theString += this.greaterChild.xXx_to$tring_xXx(layer+1)
        }

        return theString
    }








    async intersectTest(ray:Ray, balls:Array<Array<number>>, g:boolean = false): Promise<{hit:boolean, minT:number, idx:number}> {
        let {hit, tMin, tMax} = ray.intersectAABB(this.aabb)
        if(!hit) {
            return {hit:false, minT:Infinity, idx:-1};
        }
        // let point:glm.vec2;

        // if(this.aabb.contains(ray.origin)) {
        //     point = ray.origin
        // } else {
        //     let wv:glm.vec2 = glm.vec2.fromValues(tMin, tMin);
        //     glm.vec2.multiply(wv, ray.direction, wv)
        //     point = glm.vec2.add(wv, wv, ray.origin)
        // }

        
        let firstChild:kdNode
        let lastChild:kdNode

        if(ray.origin[this.axis] < this.value) {//if it's on the lesser side
            if(ray.direction[this.axis] > 0) {//but it might go accross {

            }
            else { //it doesn't go across, lesser only

            }
        } else { //it's on the greater side
            if(ray.direction[this.axis] < 0) {//but it might go accross {

            }
            else { //it doesn't go across, lesser only

            }
        }
    }
    


    async intersectTestOld(ray:Ray, balls:Array<Array<number>>, parentAABB:AABB, g:boolean = false, parentT:number = Number.POSITIVE_INFINITY): Promise<{hit:boolean, minT:number, idx:number}> {
        drawList.push({n:this, g:g})
        console.log("intersect test")
        console.log(drawList)

        await genPromise()
        
        
        let toReturn = {hit:false, minT:parentT, idx:-1};
        
        let lesserAABB:AABB;
        let greaterAABB:AABB;

        if(this.axis == 0) {//axis is 0 (x)
            lesserAABB = new AABB(parentAABB.min[0], parentAABB.min[1], this.value, parentAABB.max[1])
            greaterAABB = new AABB(this.value, parentAABB.min[1], parentAABB.max[0], parentAABB.max[1])
        } else { //axis is 1 (y)
            lesserAABB = new AABB(parentAABB.min[0], parentAABB.min[1], parentAABB.max[0], this.value)
            greaterAABB = new AABB(parentAABB.min[0], this.value, parentAABB.max[0], parentAABB.max[1])
        }

        let firstAABB:AABB = greaterAABB
        let firstChild = this.greaterChild
        let lastAABB:AABB = lesserAABB
        let lastChild = this.lesserChild
        if(ray.direction[this.axis] > 0) {
            console.log("lesser to greater")
            firstAABB = lesserAABB
            firstChild = this.lesserChild
            lastAABB = greaterAABB
            lastChild = this.greaterChild
        } else {
            console.log("greater to lesser")
        }

        console.log("first aabb  " + firstAABB.toString())
        console.log("last aabb  " + lastAABB.toString())
        
        let hitLesser = ray.intersectAABB(firstAABB)
        if (hitLesser && firstChild) //hit lesser side
        {
            console.log("going first", firstChild.cleanString())
            let hitResult = await firstChild.intersectTest(ray, balls, firstAABB, false, toReturn.minT)
            if(hitResult.hit && hitResult.minT < toReturn.minT) {
                toReturn = hitResult
            }
        }
        if (!toReturn.hit) { //hit this node's
            console.log("trying node list")

            await this.myList.forEach(async (b, i)=> {
                selectBall(b);
                await genPromise()
                let pos = glm.vec2.fromValues(balls[b][0], balls[b][1]);
                let hitResult = ray.intersectCircle(pos);
                if(hitResult.hit && hitResult.minT < toReturn.minT) {
                    toReturn = {hit:hitResult.hit, minT:hitResult.minT, idx:b}
                    // toReturn.hit = true;
                    // toReturn.minT = hitResult.minT
                    // toReturn.idx = i
                }
            });
        }

        let hitGreater = ray.intersectAABB(lastAABB)
        if(hitGreater && lastChild && !toReturn.hit){//hit the greater side
            console.log("going last"+ lastChild.cleanString())
            let hitResult = await lastChild.intersectTest(ray, balls, lastAABB, true, toReturn.minT)
            if(hitResult.hit && hitResult.minT < toReturn.minT){
                toReturn = hitResult
            }
        }
        drawList.pop()


        return toReturn
        





        // if(this.lesserChild && hitLesser.tMin < toReturn.minT && hitLesser.tMin < hitGreater.tMin) {
        //     let hitResult = this.lesserChild.intersectTest(ray, lesserAABB, toReturn.minT)
        //     if (hitResult.hit && hitResult.minT < toReturn.minT)

        //     if(hitGreater.tMin < toReturn.minT) {

        //     }
        // }
        // else if(this.greaterChild && hitGreater.tMin < toReturn.minT) {

        // }
        



        // //ray hit both aabbs,
        // //if it hits
        // //  check if the t is lower than abMinimum t, if it is, recurse to that one, passing down the abMinimumT
        
        // return toReturn

    }
    // stepForward(){
    //     this.step++
    // }
}