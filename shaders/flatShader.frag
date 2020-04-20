// Wormhole -- fragmentShader.frag
/* Noah Gersh - me@noahger.sh
 *
 * Gradient across tunnel.
 * Flat shading.
 *
 * Started: 2020-04-17
 * Updated: 2020-04-19
 */

varying vec3 vCol;
varying vec3 vPos;

void main() {
    gl_FragColor = vec4(vCol, 1.0);
}