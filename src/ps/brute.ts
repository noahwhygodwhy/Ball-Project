import * as glm from "gl-matrix" 
import {Ray, AABB} from "../ray"
import { BALL_RADIUS, SPACE_WIDTH, SPACE_HEIGHT, genPromise, selectBall} from "../graphics"
import { Shader } from "../shader"
import { partitioningSystem, rayHitListOfShapes } from "./partitioningSystem"




export class bruteForce implements partitioningSystem {

    list:Array<number>
    constructor(balls:Array<Array<number>>) {
        this.list = Array.from(Array(balls.length).keys())
    }

    async intersectTest(ray:Ray, balls:Array<Array<number>>): Promise<{hit:boolean, minT:number, idx:number}> {
        let x = await rayHitListOfShapes(this.list, ray, balls)
        return x
    }

    draw(shader: Shader, gl: WebGL2RenderingContext): void {
        //left blank on purpose
    }


}
