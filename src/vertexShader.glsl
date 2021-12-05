attribute vec3 aVertexPosition;
attribute vec3 aNormalCoord;
attribute vec2 aTextureCoord;

uniform mat4 uModelMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;

varying highp vec2 vTextureCoord;

void main(void) {
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aVertexPosition, 1);
  vTextureCoord = aTextureCoord;
}