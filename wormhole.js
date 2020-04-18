// Wormhole -- wormhole.js
/* Noah Gersh - me@noahger.sh
 * 
 * Generates and renders a "wormhole".
 * Wormhole is based on user-specified
 * parameters, and is planned to be
 * even more customizable in the future.
 *
 * Started:      2020-04-17
 * Last updated: 2020-04-18
 */

// Tunnel parameters
var tunnelLength = 20;
var ringDiameter = 10;
var ringVariance = 0.5;
var ringSubdivs = 20;
var tunnelSubdivs = 20;
var curve;
var colors = [0xff00ff, 0xffaa00];

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
/*
var camera = new THREE.PerspectiveCamera(75,
                                         window.innerWidth/window.innerHeight,
                                         0.1,
                                         1000);*/
var camera = new THREE.OrthographicCamera(window.innerWidth / -30, window.innerWidth / 30,
                                          window.innerHeight / -30, window.innerHeight / 30,
                                          1, 1000);
var camAngle = Math.PI / -2;

// Initialize renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Camera controls
camera.position.y = 20;
camera.position.z = 0;
camera.up.set(0, 0, 1);
var orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
orbitControls.keys = {
    LEFT: 72,  // h
    UP: 75,    // k
    RIGHT: 76, // l
    BOTTOM: 74 // j
}
orbitControls.autoRotate = true;

// Generate wormhole object
var geometry, material, mesh;
function generateWormhole() {
    if (count == 2) { // Vertex and fragment shaders successfully loaded
        let uniforms = {
            // uColorA: {type: 'vec3', value: new THREE.Color(colors[0])},
            // uColorB: {type: 'vec3', value: new THREE.Color(colors[1])}
        };

        // Generate and add vertices, normals, and indices to buffer
        geometry = new THREE.BufferGeometry();
        let tunnel = generateTunnel(ringDiameter, ringVariance, tunnelLength, tunnelSubdivs, ringSubdivs);
        console.log("Tunnel, normals, colors: ", tunnel);
        let vertices = new Float32Array(flatten(tunnel[0]));
        let normals = new Float32Array(flatten(tunnel[1]));
        let colors_f32 = new Float32Array(flatten(tunnel[2]));
        geometry.setIndex(getIndices(tunnelSubdivs, ringSubdivs));
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors_f32, 3));

        material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            fragmentShader: fshader,
            vertexShader: vshader,
            precision: "mediump",
            vertexColors: true
        });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
    }
}

// Generate wormhole vertices (tunnel)
function generateTunnel(diameter, variance, length, subdivsL, subdivsR) {
    console.log("Forming tunnel with length ", length, " and ", subdivsL, " subdivisions.");
    // Vertex, normal, and color arrays
    let tunnel = [];
    let normals = [];
    let tColors = [];

    // Z coordinate change per ring
    const deltaZ = length / subdivsL;

    // Discrete colors
    const colorA = new THREE.Color(colors[0]);
    const colorB = new THREE.Color(colors[1]);

    // Color change per channel per ring
    const deltaR = (colorA.r - colorB.r) / subdivsL;
    const deltaG = (colorA.g - colorB.g) / subdivsL;
    const deltaB = (colorA.b - colorB.b) / subdivsL;

    for (let i = 0; i <= subdivsL; ++i) { // Each ring
        // Get vertices and normals
        let ring = generateRing(diameter, variance, subdivsR, i * deltaZ);
        tunnel.push(ring[0]);
        normals.push(ring[1]);

        // Set ring color
        const newColor = new THREE.Color(colorA.r - (deltaR * i), colorA.g - (deltaG * i), colorA.b - (deltaB * i));
        const newColorArr = []; // Color array to flatten and buffer
        newColor.toArray(newColorArr);
        for (let r = 0; r <= subdivsR; ++r) {
            tColors.push(newColorArr);
        }
    }
    console.log("Tunnel: ", tunnel);
    return [tunnel, normals, tColors]; // Composite array of vertices, normals, and colors of tunnel
}

// Generate tunnel ring
function generateRing(diameter, variance, subdivs, z) {
    console.log("Forming ring with diameter ", diameter, ", variance ", variance, " and ", subdivs, " subdivisions.");
    let ring = [];
    let normals = [];
    for (let i = 0; i <= subdivs; ++i) {
        // Variant radius: combined radius of ring given diameter
        //                 and random variance in specified range.
        //                 Necessary for coordinate calculation.
        const variantRadius = (diameter / 2) + ((2 * variance * Math.random()) - variance);
        const angle = 2 * i * Math.PI / subdivs; // Angle at which vertex is placed
        const x = Math.cos(angle);               // Normalized x component
        const y = Math.sin(angle);               // Normalized y component
        ring.push(x * variantRadius, y * variantRadius, z); // Push augmented x, y; Push z
        normals.push(x, y, z);                   // Push normalized 
    }
    return [ring, normals]; // Composite array of vertices and normals.
}

// Compute tunnel indices
function getIndices(subdivsL, subdivsR) {
    console.log("Getting tunnel indices.");
    let indices = [];
    for (let l = 0; l < subdivsL; ++l) {
        for (let r = 1; r <= subdivsR; ++r) {
            // const a = ((subdivsR + 1) * l) + r;
            // const b = subdivsR + a + 1;
            const a = (subdivsR * l) + r;
            const b = a + subdivsR;
            const c = (a + 1) % subdivsR == 1 ? a - subdivsR + 1 : a + 1;
            const d = c < a ? a + 1 : b + 1;
            indices.push(a, b, c);
            indices.push(c, b, d);
        }
    }
    console.log("Tunnel indices: ", indices);
    return indices;
}

// Helper to flatten any given list
// Good for preparing generated mesh for
// buffering.
flatten = list => list.flat(Infinity);

// Initialize lighting
var light = new THREE.PointLight(0xffffff, 1, 1000);
light.position.set(10, 10, 10);
scene.add(light);

// Animate
function animate() {
    requestAnimationFrame(animate);

    orbitControls.update();

    renderer.render(scene, camera);
}
animate();