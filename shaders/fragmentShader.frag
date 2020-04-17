// Wormhole -- fragmentShader.frag
/* Noah Gersh - me@noahger.sh
 *
 * Simple fragment shader.
 *
 * Started: 2020-04-17
 * Updated: 2020-04-17
 */

uniform vec3 uColor;

varying vec3 vPos;

void main() {
    gl_FragColor = vec4(uColor, 1.0);
}