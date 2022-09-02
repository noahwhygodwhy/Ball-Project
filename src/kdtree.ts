import * as glm from "gl-matrix" 

export class kdNode {
    value:number
    axis:number
    balls:Array<number>|null
    lesserChild:kdNode|null
    greaterChild:kdNode|null
    constructor(balls:Array<Array<number>>, layer:number, ballRadius:number) {
        
        this.axis = layer%2
        console.log("about to sort")
        balls.sort((a:Array<number>, b:Array<number>)=> (a[this.axis]-b[this.axis]))

        console.log("sorted")
        
        let middleIdx:number = Math.floor(balls.length/2)
        console.log("middle idx", middleIdx)
        this.value = balls[middleIdx][this.axis]
        console.log("value", this.value)

        let lesserMaxIdx = middleIdx;
        let greaterMinIdx = middleIdx;
        
        while(lesserMaxIdx >= 0 && balls[lesserMaxIdx][this.axis]+ballRadius > this.value){
            console.log(balls[lesserMaxIdx][this.axis]+ballRadius, "is greater than", this.value); 
            lesserMaxIdx--;
        }
        while(greaterMinIdx <= balls.length-1 && balls[greaterMinIdx][this.axis]-ballRadius < this.value){
            console.log(balls[greaterMinIdx][this.axis]-ballRadius, "is lesser than", this.value)
            greaterMinIdx++;
        }
        lesserMaxIdx++;
        greaterMinIdx--;
        this.lesserChild = null;
        this.greaterChild = null;
        console.log("middleIdx", middleIdx)
        console.log("value", this.value)
        console.log("greaterMinIdx", greaterMinIdx)
        console.log("lesserMaxIdx", lesserMaxIdx)
        
        console.log("balls:\n", balls)

        this.balls = [];

    }
}