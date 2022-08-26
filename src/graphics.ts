


function main() {
    const canvas = document.querySelector("#glCanvas") as HTMLCanvasElement;
    // Initialize the GL context
    if(canvas == null) {
        console.log("Canvas is null")
        return
    }
    console.log("got canvas")
    const gl = canvas.getContext("webgl2");
  
    // Only continue if WebGL is available and working
    if (gl === null) {
      alert("Unable to initialize WebGL. Your browser or machine may not support it.");
      return;
    }
    console.log("got gl context")
  
    let value:number = 0.0;

    while(true) {
      value = (value + 0.1)%0.1;
      // Set clear color to black, fully opaque
      gl.clearColor(value, 0.0, 0.0, 1.0);
      // Clear the color buffer with specified clear color
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
  }
  
  window.onload = main;