import { mat4 } from "gl-matrix";
import vsSource from "./vertexShader.glsl";
import fsSource from "./fragmentShader.glsl";
import { loadTexture } from "../common/texture.js";
import { initShaderProgram } from "../common/shader.js";
import bunnyObj from "../blender-files/bunny.obj";
import * as OBJ from "webgl-obj-loader";

const createCamera = require("3d-view-controls");
const canvas = document.querySelector("#glcanvas");
const camera = createCamera(canvas, {
  eye: [6, 0, 0],
  center: [0, 0, 0],
  zoomMax: 500
});

main();

function main() {
  const gl = canvas.getContext("webgl");

  // If we don't have a GL context, give up now
  if (!gl) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  /**********************************/
  /******* uniform information ******/
  /**********************************/
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
      normalCoord: gl.getAttribLocation(shaderProgram, "aNormalCoord")
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix"
      ),
      viewMatrix: gl.getUniformLocation(shaderProgram, "uViewMatrix"),
      modelMatrix: gl.getUniformLocation(shaderProgram, "uModelMatrix"),
      uSampler: gl.getUniformLocation(shaderProgram, "uSampler")
    }
  };

  /**********************************/
  /******* Load OBJ and texture *****/
  /**********************************/
  const buffers = new OBJ.Mesh(bunnyObj);
  OBJ.initMeshBuffers(gl, buffers);
  let texture;

  loadTexture(gl, "../blender-files/bunny.png").then(result => {
    texture = result;
    requestAnimationFrame(render);
  });

  // Draw the scene repeatedly
  function render() {
    drawScene(gl, programInfo, buffers, texture);
    requestAnimationFrame(render);
  }
}

function drawScene(gl, programInfo, buffers, texture) {
  camera.tick();
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
  gl.clearDepth(1.0); // Clear everything
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things

  // Clear the canvas before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  /*****************************************/
  /******* Set Projection/Model Matrix *****/
  /*****************************************/
  const projectionMatrix = mat4.create();
  mat4.perspective(
    projectionMatrix,
    (45 * Math.PI) / 180,
    gl.canvas.clientWidth / gl.canvas.clientHeight,
    0.1,
    100.0
  ); // the center of the scene.
  const modelViewMatrix = mat4.create();

  /**********************************/
  /********** Bind Buffers **********/
  /**********************************/
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition, // attribute
    buffers.vertexBuffer.itemSize, // size
    gl.FLOAT, // type
    false, // normalized?
    0, // stride
    0 // array buffer offset
  );

  gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureBuffer);
  gl.vertexAttribPointer(
    programInfo.attribLocations.textureCoord, // attribute
    buffers.textureBuffer.itemSize, // size
    gl.FLOAT, // type
    false, // normalized?
    0, // stride
    0 // array buffer offset
  );

  gl.enableVertexAttribArray(programInfo.attribLocations.normalCoord);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
  gl.vertexAttribPointer(
    programInfo.attribLocations.normalCoord, // attribute
    buffers.normalBuffer.itemSize, // size
    gl.FLOAT, // type
    false, // normalized?
    0, // stride
    0 // array buffer offset
  );

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);

  /**********************************/
  /***** Set the shader uniforms ****/
  /**********************************/
  gl.useProgram(programInfo.program);
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.viewMatrix,
    false,
    camera.matrix
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelMatrix,
    false,
    modelViewMatrix
  );

  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

  gl.drawElements(
    gl.TRIANGLES,
    buffers.indexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );
}
