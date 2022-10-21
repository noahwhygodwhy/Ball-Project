import * as glm from "gl-matrix" 
import { BALL_RADIUS, SPACE_HEIGHT, SPACE_WIDTH } from "./graphics";
import { rayFragSource } from "./shader";


export class AABB{
    min:glm.vec2
    max:glm.vec2
    constructor(x1:number, y1:number, x2:number, y2:number){
        this.min = glm.vec2.fromValues(Math.min(x1, x2), Math.min(y1, y2))
        this.max = glm.vec2.fromValues(Math.max(x1, x2), Math.max(y1, y2))
    }
    toString() {
        return `(${this.min[0]},${this.min[1]}), (${this.max[0]},${this.max[1]})`
    }
    contains(p:glm.vec2):boolean {
        return p[0] <= this.max[0] &&
        p[1] <= this.max[1] &&
        p[0] >= this.min[0] &&
        p[1] >= this.min[1]
    }
    copy() {
        return new AABB(this.min[0], this.min[1], this.max[0], this.max[1])
    }

  }

  
function quadratic(a:number, b:number, c:number):Array<number>{
    let insideRoot = (b*b) - (4*a*c)
    if(insideRoot <0){
        return [Number.MAX_VALUE, Number.MAX_VALUE];
    }
    let t0 = (-b - Math.sqrt(insideRoot))/(2*a);
    let t1 = (-b + Math.sqrt(insideRoot))/(2*a);
    return [t0, t1];


}

export class Ray{
    origin:glm.vec2
    direction:glm.vec2

    constructor(origin:glm.vec2, direction:glm.vec2){
        this.origin = origin;
        this.direction = direction;
        glm.vec2.normalize(this.direction, this.direction)
    }

    intersectCircle(circleOrigin:glm.vec2):{hit:boolean, minT:number} {

        let wv:glm.vec2 = glm.vec2.fromValues(0, 0);
    
        let L = glm.vec2.sub(wv, this.origin, circleOrigin);
        let a = glm.vec2.dot(this.direction, this.direction);
        let b = 2.0 * glm.vec2.dot(this.direction, L);
        let c = glm.vec2.dot(L, L) - (BALL_RADIUS*BALL_RADIUS);
            
        let t0:number, t1:number;
        let ts:Array<number> = quadratic(a, b, c);
        t0 = ts[0];
        t1 = ts[1];
    
        if (t0 > t1) {
            t0 = ts[1];
            t1 = ts[0];
        }
        let hit = true
        if (t0 < 0) {
            t0 = t1;
            if (t0 < 0) {
                return {hit:false, minT:Infinity};
            }
        }
        if(t0 > ((SPACE_HEIGHT*SPACE_HEIGHT)+(SPACE_WIDTH*SPACE_WIDTH))) {
            return {hit:false, minT:Infinity};
        }
        return {hit:hit, minT:t0};
        // return t0;
    }
    //https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-box-intersection
    intersectAABB(aabb:AABB): {hit:boolean, tMin:number, tMax:number} {
        
        // if(aabb.contains(this.origin)){
        //     return {hit:true, tMin:0, tMax:0}
        // }

        let toReturn = {hit:false, tMin:0, tMax:0}

        let tmin = (aabb.min[0] - this.origin[0])/this.direction[0]
        let tmax = (aabb.max[0] - this.origin[0])/this.direction[0]
        
        if(tmin > tmax){
            let t = tmin
            tmin = tmax
            tmax = t
        }
        let tymin = (aabb.min[1] - this.origin[1]) / this.direction[1]
        let tymax = (aabb.max[1] - this.origin[1]) / this.direction[1]

        if(tymin > tymax){
            let t = tymin
            tymin = tymax
            tymax = t
        }
        
        if((tmin > tymax) || (tymin > tmax)) {
            return toReturn
        }
        if (tymin > tmin) {
            tmin = tymin; 
        }
        if (tymax < tmax) {
            tmax = tymax; 
        }

        if(tmin > tmax){
            let t = tmin
            tmin = tmax
            tmax = t
        }
        
        return {hit:true, tMin:tmin, tMax:tmax}

        //return {hit:false, tMin:0, tMax:0}
        




        // let wv:glm.vec2 = glm.vec2.fromValues(0.0, 0.0);
        // let invD:glm.vec2 = glm.vec2.div(wv, glm.vec2.fromValues(1,1), this.direction);

        // let t0:glm.vec2 = glm.vec2.mul(wv, glm.vec2.sub(wv, aabb.min, this.origin), invD);
        // let t1:glm.vec2 = glm.vec2.mul(wv, glm.vec2.sub(wv, aabb.max, this.origin), invD);

        // console.log("t0", t0, "t1", t1)

        // let tSmaller:glm.vec2 = glm.vec2.min(wv, t0, t1);
        // let tBigger:glm.vec2= glm.vec2.min(wv, t0, t1);

        // let tMin:number = Math.max(Number.NEGATIVE_INFINITY, Math.max(tSmaller[0], Math.max(tSmaller[1], tSmaller[2])));
        // let tMax:number = Math.min(Number.POSITIVE_INFINITY, Math.min(tBigger[0], Math.min(tBigger[1], tBigger[2])));
        // console.log("tMin:", tMin, "tMax", tMax)
        // let hit:boolean = tMin <= tMax&& tMax >= 0.0;

        // return {hit, tMin, tMax};
    }
    toString() {
        return `(${this.origin[0].toFixed(3)}, ${this.origin[1].toFixed(3)}), (${this.direction[0].toFixed(3)}, ${this.direction[1].toFixed(3)})`
    }
}