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
var ringDiameter = Math.min(20, 40 * Math.random());
var ringVariance = 1;
var ringSubdivs = Math.min(20, 200 * Math.random());
var tunnelSubdivs = 200;
var curve;
var colors = [];
// colors = [0xff0000, 0xffff00, 0x00ff00, 0x00ffff, 0x0000ff];
for (let i = 0; i < 5; ++i) colors.push(0xffffff * Math.random());

// Initialize shader code
THREE.Cache.enabled = true;
var count = 0;
var loader = new THREE.FileLoader();
var fshader, vshader;
var wireframe = false; // Render with GL_LINES?

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
/*
var camera = new THREE.OrthographicCamera(window.innerWidth / -30, window.innerWidth / 30,
                                          window.innerHeight / -30, window.innerHeight / 30,
                                          1, 1000);*/
var camAngle = Math.PI / -2;

// Initialize renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Camera controls
camera.position.y = 50;
camera.position.z = 25;
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
            vertexColors: true,
            wireframe: wireframe
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

    // Get discrete colors
    let threeColors = colors.map(color => new THREE.Color(color));
    const nColors = threeColors.length;
    const divsPerColor = subdivsL / (nColors - 1);
    console.log("There are ", nColors, " colors with ", divsPerColor, " divs each.");

    // Color change per channel per ring
    let deltaR = [];
    let deltaG = [];
    let deltaB = [];
    if (nColors === 1) {
        deltaR.push(0);
        deltaG.push(0);
        deltaB.push(0);
    }
    else {
        for (let i = 0; i < nColors - 1; ++i) {
            deltaR.push((threeColors[i].r - threeColors[i+1].r) / divsPerColor);
            deltaG.push((threeColors[i].g - threeColors[i+1].g) / divsPerColor);
            deltaB.push((threeColors[i].b - threeColors[i+1].b) / divsPerColor);
        }
    }

    let colorDivsUsed = 0; // Number of divs that the current color has been applied to
    let curColor = 0;      // Index of current color

    for (let i = 0; i <= subdivsL; ++i) { // Each ring
        // Get vertices and normals
        let ring = generateRing(diameter, variance, subdivsR, i * deltaZ);
        tunnel.push(ring[0]);
        normals.push(ring[1]);

        // Set ring color
        console.log("Current color index: ", curColor);
        const newColor = new THREE.Color(threeColors[curColor].r - (deltaR[curColor] * colorDivsUsed),
                                         threeColors[curColor].g - (deltaG[curColor] * colorDivsUsed),
                                         threeColors[curColor].b - (deltaB[curColor] * colorDivsUsed));
        const newColorArr = []; // Color array to flatten and buffer
        newColor.toArray(newColorArr);
        for (let r = 0; r <= subdivsR; ++r) {
            tColors.push(newColorArr);
        }

        // Switch colors or continue with current
        console.log("Used divs: ", colorDivsUsed, "\nDivs per color: ", divsPerColor);
        if (colorDivsUsed + 1 > divsPerColor) {
            ++curColor;
            colorDivsUsed = 0;
        }
        else ++colorDivsUsed;
    }
    console.log("Tunnel: ", tunnel);
    return [tunnel, normals, tColors]; // Composite array of vertices, normals, and colors of tunnel
}

// Generate tunnel ring
function generateRing(diameter, variance, subdivs, z) {
    console.log("Forming ring with diameter ", diameter, ", variance ", variance, " and ", subdivs, " subdivisions.");
    let ring = [];
    let normals = [];
    for (let i = 0; i < subdivs; ++i) {
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
        for (let r = 0; r < subdivsR; ++r) {
            /* 
                Diagram of poly. Add triangles BCA and DCB
                a---b
                | / |
                c---d
            */
            const a = (subdivsR * l) + r;
            const b = r !== subdivsR - 1 ? a + 1 : (a - (subdivsR - 1));
            const c = a + subdivsR;
            const d = b + subdivsR;
            indices.push(b, c, a);
            indices.push(d, c, b);
        }
    }
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