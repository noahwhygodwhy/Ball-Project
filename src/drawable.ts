import { Shader } from "./shader"

export interface drawable extends Object{
    draw (shader:Shader, gl: WebGL2RenderingContext):void
}