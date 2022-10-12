import * as glm from "gl-matrix" 
import {Ray, AABB} from "./ray"
import { BALL_RADIUS, SPACE_WIDTH, SPACE_HEIGHT } from "./graphics"

var i = 0;

export class kdNode {
    value:number = 0
    axis:number = -1
    // balls:Array<Array<number>> = []
    myList:Array<number> = []
    lesserChild:kdNode|null = null
    greaterChild:kdNode|null = null
    step:number = 0

    //TODO: needs a totalList, what the fuck are you using for an index
    constructor(balls:Array<Array<number>>, totalList:Array<number>, layer:number = 0) {
        
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
        


        if(lesserBalls.length > 0) {
            this.lesserChild = new kdNode(balls, lesserBalls, layer+1);
        } else {
            this.lesserChild = null;
        }
        if(greaterBalls.length > 0) {
            this.greaterChild = new kdNode(balls, greaterBalls, layer+1);
        } else {
            this.greaterChild = null;
        }
        
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
    intersectTest(ray:Ray, balls:Array<Array<number>>, parentAABB:AABB, parentT:number = Number.POSITIVE_INFINITY): {hit:boolean, minT:number, idx:number} {
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
            let hitResult = firstChild.intersectTest(ray, balls, firstAABB, toReturn.minT)
            if(hitResult.hit && hitResult.minT < toReturn.minT) {
                toReturn = hitResult
            }
        }
        if (!toReturn.hit) { //hit this node's
            console.log("trying node list")
            this.myList.forEach((b, i)=> {
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
            let hitResult = lastChild.intersectTest(ray, balls, lastAABB, toReturn.minT)
            if(hitResult.hit && hitResult.minT < toReturn.minT){
                toReturn = hitResult
            }
        }
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
    stepForward(){
        this.step++
    }
    draw(shader:WebGLProgram, gl:WebGL2RenderingContext) {
    }
}