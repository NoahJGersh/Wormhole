// Wormhole -- wormhole.js
/* Noah Gersh - me@noahger.sh
 * 
 * Generates and renders a "wormhole".
 * Wormhole is based on user-specified
 * parameters, and is planned to be
 * even more customizable in the future.
 *
 * Started:      2020-04-17
 * Last updated: 2020-04-17
 */

// Initialize shader code
THREE.Cache.enabled = true;
var count = 0;
var loader = new THREE.FileLoader();
var fshader, vshader;

// Vertex shader
loader.load('shaders/vertexShader.vert',
    data => {
        console.log(data);
        vshader = data;
        ++count;
        generateWormhole();
    },
    xhr => console.log((xhr.loaded/xhr.total * 100) + '% loaded'),
    err => console.error('An error occurred'));

// Fragment shader
loader.load('shaders/fragmentShader.frag',
    data => {
        console.log(data);
        fshader = data;
        ++count;
        generateWormhole();
    },
    xhr => console.log((xhr.loaded/xhr.total * 100) + '% loaded'),
    err => console.error('An error occurred'));

// Initialize scene, camera
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75,
                                         window.innerWidth/window.innerHeight,
                                         0.1,
                                         1000);

// Initialize renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 5;

// Initialize geometry
var geometry, material, mesh;
function generateWormhole() {
    if (count == 2) { // Vertex and fragment shaders successfully loaded
        let uniforms = {
            uColor: {type: 'vec3', value: new THREE.Color(0xffffff)}
        };
        geometry = new THREE.BoxGeometry(1, 1, 1);
        material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            fragmentShader: fshader,
            vertexShader: vshader,
            precision: "mediump"
        });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
    }
}

// Initialize lighting
var light = new THREE.PointLight(0xffffff, 1, 1000);
light.position.set(10, 10, 10);
scene.add(light);

// Set positions

// Additional flags

// Animate
function animate() {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);
}
animate();