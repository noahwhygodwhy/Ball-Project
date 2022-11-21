import * as glm from "gl-matrix" 
import {Ray, AABB} from "../ray"
import { BALL_RADIUS, SPACE_WIDTH, SPACE_HEIGHT, genPromise, selectBall} from "../graphics"
import { Shader } from "../shader"
import { partitioningSystem, rayHitListOfShapes } from "./partitioningSystem"


const LINE_RED = 1.0


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

        let totalAABB:AABB = new AABB(0, 0, SPACE_WIDTH, SPACE_HEIGHT)

        vertices.push([totalAABB.min[0], totalAABB.min[1],  LINE_RED])
        vertices.push([totalAABB.max[0], totalAABB.min[1],  LINE_RED])
        //left
        vertices.push([totalAABB.min[0], totalAABB.min[1],  LINE_RED])
        vertices.push([totalAABB.min[0], totalAABB.max[1],  LINE_RED])
        //top
        vertices.push([totalAABB.min[0], totalAABB.max[1],  LINE_RED])
        vertices.push([totalAABB.max[0], totalAABB.max[1],  LINE_RED])
        //right
        vertices.push([totalAABB.max[0], totalAABB.min[1],  LINE_RED])
        vertices.push([totalAABB.max[0], totalAABB.max[1],  LINE_RED])


        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW); 
        gl.drawArrays(gl.LINES, 0, vertices.length);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);

        //left blank on purpose
    }


}
