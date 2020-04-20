// Wormhole -- wormhole.js
/* Noah Gersh - me@noahger.sh
 * 
 * Generates and renders a "wormhole".
 * Wormhole is based on user-specified
 * parameters, and is planned to be
 * even more customizable in the future.
 *
 * Started:      2020-04-17
 * Last updated: 2020-04-19
 */

// Tunnel parameters
var tunnelLength = 200;
var ringDiameter = 40;
var ringVariance = 0.1;
var ringSubdivs = 1000;
var tunnelSubdivs = 1000;
var curve;
var colors = [];
// colors = [0xff0000, 0xffff00, 0x00ff00, 0x00ffff, 0x0000ff];
for (let i = 0; i < 2; ++i) colors.push(0xffffff * Math.random());

// Tunnel things before graphics things.
var tunnel = generateTunnel(ringDiameter, ringVariance, tunnelLength, tunnelSubdivs, ringSubdivs);
var indices = getIndices(tunnelSubdivs, ringSubdivs);

// Initialize shader code
THREE.Cache.enabled = true;
var count = 0;
var loader = new THREE.FileLoader();
var fshader, vshader;
var useWireframe = false; // Render with GL_LINES
var useVColors = true; // Render with vertex colors
var currentColorSet = 1;
var shaderPaths = [['shaders/colorless.vert', 'shaders/colorless.frag'],
                   ['shaders/flatShader.vert', 'shaders/flatShader.frag']];

// Load shader set from paths
function loadShaders(set) {
    count = 0;
    // Vertex shader
    console.log("Loading ", shaderPaths[set]);
    loader.load(shaderPaths[set][0],
        data => {
            vshader = data;
            ++count;
            generate();
        },
        xhr => console.log((xhr.loaded/xhr.total * 100) + '% loaded'),
        err => console.error('An error occurred'));

    // Fragment shader
    loader.load(shaderPaths[set][1],
        data => {
            console.log(data);
            fshader = data;
            ++count;
            generate();
        },
        xhr => console.log((xhr.loaded/xhr.total * 100) + '% loaded'),
        err => console.error('An error occurred'));
}
loadShaders(1); // Load initial shaders

// Initialize renderer
var renderer = new THREE.WebGLRenderer();
var container = document.getElementById("view");
var boundary = container.getBoundingClientRect();
renderer.setSize(boundary.width, boundary.height);
container.appendChild(renderer.domElement);

// Initialize scene, camera
var scene = new THREE.Scene();
var pCamera = new THREE.PerspectiveCamera(75,
                                         boundary.width/boundary.height,
                                         0.1,
                                         1000);
var oCamera = new THREE.OrthographicCamera(boundary.width / -20, boundary.width / 20,
                                           boundary.height / 20, boundary.height / -20,
                                           0.01, 1000);
var isCamOrtho = false;

// Camera controls
pCamera.position.y = 50;
pCamera.position.z = 25;
oCamera.position.y = 30;
oCamera.position.z = 5;
pCamera.up.set(0, 0, 1);
oCamera.up.set(0, 0, 1);

var curCamera = pCamera;
var orbitControls = new THREE.OrbitControls(curCamera, renderer.domElement);
orbitControls.keys = {
    LEFT: 72,  // h
    UP: 75,    // k
    RIGHT: 76, // l
    BOTTOM: 74 // j
}
orbitControls.autoRotate = false;

// Mesh status and trackers
var geometry, material, mesh;
var meshDefined = false;      // Has mesh been created yet?
var meshPRS = [];             // Position, Rotation, and Scale

// Buffer tunnel into shader programs
function generateWormhole() {
    console.log("Shader count: ", count);
    if (count == 2) { // Vertex and fragment shaders successfully loaded
        // Add vertices, normals, and indices to buffer
        geometry = new THREE.BufferGeometry();
        let vertices_f32 = new Float32Array(flatten(tunnel[0]));
        let normals_f32 =  new Float32Array(flatten(tunnel[1]));
        let colors_f32 =   new Float32Array(flatten(tunnel[2]));
        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices_f32, 3));
        geometry.setAttribute('normal',   new THREE.BufferAttribute(normals_f32,  3));
        if (useVColors) geometry.setAttribute('color', new THREE.BufferAttribute(colors_f32, 3));

        // Initialize Shader Material
        material = new THREE.ShaderMaterial({
            fragmentShader: fshader,
            vertexShader: vshader,
            precision: "mediump",
            vertexColors: useVColors,
            wireframe: useWireframe
        });

        // Instantiate mesh
        mesh = new THREE.Mesh(geometry, material);

        // Load any stored location data
        if (meshPRS.length > 0) {
            mesh.position = meshPRS[0];
            mesh.rotation = meshPRS[1];
            mesh.scale    = meshPRS[2];
        }

        // Add final mesh to scene
        scene.add(mesh);
        meshDefined = true;
    }
}

function generate() {
    if (meshDefined) {  // If mesh defined, store location data and remove from scene
        meshPRS = [mesh.position, mesh.rotation, mesh.scale];
        meshDefined = false;
        scene.remove(mesh);
    }
    generateWormhole(); // Generate new mesh
}

// Parametrically generate tunnel vertices, normals, and colors
function generateTunnel(diameter, variance, length, subdivsL, subdivsR) {
    // console.log("Forming tunnel with length ", length, " and ", subdivsL, " subdivisions.");
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
        const newColor = new THREE.Color(threeColors[curColor].r - (deltaR[curColor] * colorDivsUsed),
                                         threeColors[curColor].g - (deltaG[curColor] * colorDivsUsed),
                                         threeColors[curColor].b - (deltaB[curColor] * colorDivsUsed));
        const newColorArr = []; // Color array to flatten and buffer
        newColor.toArray(newColorArr);
        for (let r = 0; r < subdivsR; ++r) {
            tColors.push(newColorArr); // Push adjusted color to each vertex of ring
        }

        // Switch colors or continue with current
        if (colorDivsUsed + 1 > divsPerColor) {
            ++curColor;
            colorDivsUsed = 0;
        }
        else ++colorDivsUsed;
    }

    return [tunnel, normals, tColors]; // Composite array of vertices, normals, and colors of tunnel
}

// Generate tunnel ring
function generateRing(diameter, variance, subdivs, z) {
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

// Helper to return only positive normals
absolute = list => list.map(entry => Math.abs(entry));

// Initialize lighting
var light = new THREE.PointLight(0xffffff, 1, 1000);
light.position.set(10, 10, 10);
scene.add(light);

// Rotation trackers for auto-rotate
var rotateModel = true;
var rotationVector = new THREE.Vector3(1, -1, 1);
rotationVector.normalize();
var curAngle = 0.0;

// Animate scene
function animate() {
    requestAnimationFrame(animate);

    if (meshDefined) {
        // Ensure mesh in correct rotation
        mesh.setRotationFromAxisAngle(rotationVector, curAngle);
        if (rotateModel) {
            // Increment angle and set new rotation
            curAngle += 0.001;
            mesh.setRotationFromAxisAngle(rotationVector, curAngle);
        }
    }

    renderer.render(scene, curCamera);
}
animate();

/*
 * Event handlers
 */

// Toggle between ortho and persp cameras
function onCameraToggle() {
    let orthoValue = document.getElementById("orthoValue");
    isCamOrtho = orthoValue.checked;
    curCamera = isCamOrtho ? oCamera : pCamera;
    resetControls();
}

// Update orbit controls to current camera
function resetControls() {
    orbitControls = new THREE.OrbitControls(curCamera, renderer.domElement);
    orbitControls.keys = {
        LEFT: 72,  // h
        UP: 75,    // k
        RIGHT: 76, // l
        BOTTOM: 74 // j
    }
    orbitControls.autoRotate = false;
}

// Toggle between shading and wireframe
function onWireframeToggle() {
    let wireframeValue = document.getElementById("wireframeValue");
    useWireframe = wireframeValue.checked;
    generate();
}

// Toggle between current color shader and colorless shader
function onVColorToggle() {
    let vColorValue = document.getElementById("vColorValue");
    useVColors = vColorValue.checked;
    if (useVColors) loadShaders(currentColorSet);
    else loadShaders(0);
}

// Toggle auto-rotation of model
function onRotateToggle() {
    let rotateValue = document.getElementById("rotateValue");
    rotateModel = rotateValue.checked;
}

// Resize renderer to window on window size change
function onResize() {
    boundary = container.getBoundingClientRect();
    renderer.setSize(boundary.width, boundary.height);
    curCamera.aspect = boundary.width / boundary.height;
    curCamera.updateProjectionMatrix();
}