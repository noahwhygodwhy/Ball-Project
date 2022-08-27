// class Shader{
//     program:WebGLProgram
//     constructor(gl:WebGL2RenderingContext, vertSource:string, fragSource:string){
//         let tempProg = gl.createProgram();
//         if(tempProg == null) {
//             throw "program shader is null";
//         }
//         this.program = tempProg;
//         let fragShader = gl.createShader(gl.FRAGMENT_SHADER);
//         if(fragShader == null) {
//             throw "frag shader is null"
//         }
//         gl.shaderSource(fragShader, fragSource);
//         gl.compileShader(fragShader);
//         if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
//             const info = gl.getShaderInfoLog(fragShader);
//             throw `Could not compile fragShader. \n\n${info}`;
//         }
//         let vertShader = gl.createShader(gl.VERTEX_SHADER);
//         if(vertShader == null) {
//             throw "vert shader is null"
//         }
//         gl.shaderSource(vertShader, vertSource);
//         gl.compileShader(vertShader);
//         if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
//             const info = gl.getShaderInfoLog(vertShader);
//             throw `Could not compile vertShader. \n\n${info}`;
//         }

//         gl.attachShader(this.program, vertShader);
//         gl.attachShader(this.program, fragShader);
        
//         gl.linkProgram(this.program)
        
//         if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
//             const info = gl.getProgramInfoLog(this.program);
//             throw `Could not compile WebGL program. \n\n${info}`;
//         }
//     }
//     use(gl:WebGL2RenderingContext){
//         gl.useProgram(this.program);
//     }
//     getProg():WebGLProgram{
//         return this.program;
//     }
//     getLoc(gl:WebGL2RenderingContext, attrib:string){
//         return gl.getAttribLocation(this.program, attrib);
//     }
// }