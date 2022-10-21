import { genPromise, selectBall } from "../graphics";
import {Ray} from "../ray"
import { Shader } from "../shader"
import * as glm from "gl-matrix" 

export interface partitioningSystem extends Object{
    intersectTest(ray:Ray, balls:Array<Array<number>>): Promise<{hit:boolean, minT:number, idx:number}>
    draw (shader:Shader, gl: WebGL2RenderingContext):void
}

export async function rayHitListOfShapes(indexes:Array<number>, ray:Ray, balls:Array<Array<number>>): Promise<{hit:boolean, minT:number, idx:number}> {
    let minResult: {hit:boolean, minT:number, idx:number} = {hit:false, minT:Infinity, idx:-1};
    for(let i = 0; i < indexes.length; i++) {
        let v = indexes[i]
        selectBall(v)
        await genPromise()
        let thisBall = glm.vec2.fromValues(balls[v][0], balls[v][1])
        let hr = ray.intersectCircle(thisBall);
        if (hr.hit && hr.minT < minResult.minT) {
            minResult = {hit:true, minT:hr.minT, idx:v}
        }
    }
    selectBall(-1)
    return minResult
}