import * as glm from "gl-matrix" 

class kdNode {
    value:number
    axis:number
    balls:Array<number>
    lesserChild:kdNode
    greaterChild:kdNode
    constructor(balls:Array<Array<number>>, theList:Array<number>, layer:number) {
        this.axis = layer%3
        theList.sort((a:number, b:number)=> (balls[a][this.axis]-balls[b][this.axis]))

        let middleIdx:number = theList.length/2
        let middleValue = balls[middleIdx][this.axis]

        this.balls = balls;

    }
}