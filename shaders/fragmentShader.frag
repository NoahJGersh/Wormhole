// Wormhole -- fragmentShader.frag
/* Noah Gersh - me@noahger.sh
 *
 * Slight color striation. To be overhauled.
 *
 * Started: 2020-04-17
 * Updated: 2020-04-18
 */

uniform vec3 uColorA;
uniform vec3 uColorB;

varying vec3 vPos;

void main() {
    gl_FragColor = vec4(mix(uColorA, uColorB, vPos.x), 1.0);
}