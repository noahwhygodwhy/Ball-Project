import * as glm from "gl-matrix" 

class kdNode {
    balls:Array<number>
    constructor(balls:Array<number>) {
        this.balls = balls;
    }
}
class kdBranch extends kdNode {
    
}
class kdLeaf extends kdNode {

}