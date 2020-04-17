// Wormhole -- vertexShader.vert
/* Noah Gersh - me@noahger.sh
 *
 * Simple vertex shader.
 *
 * Started: 2020-04-17
 * Updated: 2020-04-17
 */

 varying vec3 vPos;

 void main() {
    vPos = position;

    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;
 }