/* Wormhole -- wormhole.js
 * Noah Gersh - me@noahger.sh
 * 
 * Generates and renders a "wormhole".
 * Wormhole is based on user-specified
 * parameters, and is planned to be
 * even more customizable in the future.
 *
 * Started:      2020-04-17
 * Last updated: 2020-04-20
 */


/*
 *  Tunnel value initialization
 */

// Tunnel parameters
var tunnelLength = 200;   // Length
var ringDiameter = 40;    // Initial diameter
var finalDiameter = 40;   // End diameter
var deltaDiameter = 0;    // Change in diameter per ring
var currentDiameter = 40; // Diameter stored for current ring
var ringVariance = 0.1;   // Distance a vertex may be plotted away. Random in range [-variance, variance]
var ringSubdivs = 200;    // Number of polys per ring
var tunnelSubdivs = 200;  // Number of bands across tunnel
var curve;                // Bezier curve to follow
var colors = [];          // List of colors to interpolate
colors = [0xff00ff, 0x000000];

// Establish tunnel lists.
var tunnel = [];
var tColors = generateColors(tunnelLength, tunnelSubdivs, ringSubdivs, colors);
var indices = [];

// Rebuild new basis for mesh from parameters
function buildBasis(level) {
    if (level === "full") {
        tunnel = generateTunnel(ringDiameter, ringVariance, tunnelLength, tunnelSubdivs, ringSubdivs);
        indices = getIndices(tunnelSubdivs, ringSubdivs);
        tColors = generateColors(tunnelLength, tunnelSubdivs, ringSubdivs, colors);
    }
    else if (level === "colors") tColors = generateColors(tunnelLength, tunnelSubdivs, ringSubdivs, colors);
}
buildBasis("full"); // Build default values


/*
 *   Rendering setup
 */


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
pCamera.position.y = 40;
pCamera.position.z = 20;
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


/*
 *  Mesh Generation
 */


// Mesh status and trackers
var geometry, material, mesh;
var meshDefined = false;      // Has mesh been created yet?
var meshPRS = [];             // Position, Rotation, and Scale

// Build, or rebuild, wormhole
function generate(level = "") {
    if (level.length > 0) buildBasis(level); // If using basis options, rebuild basis values
    if (meshDefined) {                       // If mesh already defined, store location data and remove from scene
        meshPRS = [mesh.position, mesh.rotation, mesh.scale];
        meshDefined = false;
        scene.remove(mesh);
    }
    generateWormhole(); // Generate new mesh
}

// Buffer tunnel into shader programs
function generateWormhole() {
    console.log("Shader count: ", count);
    if (count == 2) { // Vertex and fragment shaders successfully loaded
        // Add vertices, normals, and indices to buffer
        geometry = new THREE.BufferGeometry();
        let vertices_f32 = new Float32Array(flatten(tunnel[0]));
        let normals_f32 =  new Float32Array(flatten(tunnel[1]));
        let colors_f32 =   new Float32Array(flatten(tColors));
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

// Parametrically generate tunnel vertices and normals
function generateTunnel(diameter, variance, length, subdivsL, subdivsR) {
    // console.log("Forming tunnel with length ", length, " and ", subdivsL, " subdivisions.");
    // Vertex, normal, and color arrays
    let tunnel = [];
    let normals = [];

    // Z coordinate change per ring
    const deltaZ = length / subdivsL;

    currentDiameter = ringDiameter;
    for (let i = 0; i <= subdivsL; ++i) { // Each ring
        // Get vertices and normals
        let ring = generateRing(currentDiameter, variance, subdivsR, i * deltaZ);
        currentDiameter += deltaDiameter;
        tunnel.push(ring[0]);
        normals.push(ring[1]);
    }

    return [tunnel, normals]; // Composite array of vertices, normals, and colors of tunnel
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

// Assign colors to vertices
function generateColors(length, subdivsL, subdivsR, colorList = colors) {
    let tColors = []; // List of each vertex's color

    // Get discrete colors
    let threeColors = colorList.map(color => new THREE.Color(color));
    const nColors = threeColors.length;
    const divsPerColor = subdivsL / (nColors - 1);

    // Color change per channel per ring
    let deltaR = [];
    let deltaG = [];
    let deltaB = [];
    if (nColors === 1) {
        // No change if only one color
        deltaR.push(0);
        deltaG.push(0);
        deltaB.push(0);
    }
    else {
        for (let i = 0; i < nColors - 1; ++i) {
            // Compute change on each channel for each pair of colors
            deltaR.push((threeColors[i].r - threeColors[i+1].r) / divsPerColor);
            deltaG.push((threeColors[i].g - threeColors[i+1].g) / divsPerColor);
            deltaB.push((threeColors[i].b - threeColors[i+1].b) / divsPerColor);
        }
    }

    let colorDivsUsed = 0; // Number of divs that the current color has been applied to
    let curColor = 0;      // Index of current color;

    for (let i = 0; i <= subdivsL; ++i) {
        // Set ring color
        const newColor = new THREE.Color(threeColors[curColor].r - (deltaR[curColor] * colorDivsUsed),
                                         threeColors[curColor].g - (deltaG[curColor] * colorDivsUsed),
                                         threeColors[curColor].b - (deltaB[curColor] * colorDivsUsed));
        const newColorArr = []; // Color array to flatten and buffer
        newColor.toArray(newColorArr);
        for (let r = 0; r < subdivsR; ++r) {
            tColors.push(newColorArr); // Push adjusted color to each vertex of ring
        }

        // Switch colors or continue with current color
        if (colorDivsUsed + 1 > divsPerColor) {
            ++curColor;
            colorDivsUsed = 0;
        }
        else ++colorDivsUsed;
    }

    return tColors;
}

flatten = list => list.flat(Infinity); // Flatten a given list of any depth, shorthand


/*
 *   Scene manipulation
 */


// Initialize lighting
var light = new THREE.PointLight(0xffffff, 1, 1000);
light.position.set(10, 10, 10);
scene.add(light);

// Rotation trackers for auto-rotate
var rotateModel = true;
var rotationVector = new THREE.Vector3(0, 0, 1);
rotationVector.normalize();
var curAngle = 0.0;

// Animate scene
function animate() {
    requestAnimationFrame(animate);

    if (meshDefined) {
        // Ensure mesh in correct rotation
        // mesh.position.z = 0 - tunnelLength / 2;
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
 *  Event handlers - Parameters
 */


// Input tunnel length
function onLengthUpdate() {
    let lengthValue = document.getElementById("lengthValue");
    const fValue = Math.max(1, parseFloat(lengthValue.value));
    if (fValue == 1) lengthValue.value = "1";
    tunnelLength = fValue;
    generate("full");
}

// Input tunnel diameter
function onDiameterUpdate(selection) {
    if (selection == 1) { // Change initial
        let startDiameterValue = document.getElementById("startDiameterValue");
        const fValue = Math.max(1, parseFloat(startDiameterValue.value));
        startDiameterValue.value = "" + fValue;
        ringDiameter = fValue;
    }
    else {
        let diameterValue = document.getElementById("endDiameterValue");
        const fValue = Math.max(1, parseFloat(endDiameterValue.value));
        endDiameterValue.value = "" + fValue;
        finalDiameter = fValue;
    }
    deltaDiameter = (finalDiameter - ringDiameter) / tunnelSubdivs;
    generate("full");
}

// Input vertex variance
function onVarianceUpdate() {
    let varianceValue = document.getElementById("varianceValue");
    const maximum = ringDiameter / 2;
    const fValue = Math.min(maximum, parseFloat(varianceValue.value));
    varianceValue.value = "" + fValue;
    ringVariance = fValue;
    generate("full");
}

// Input ring subdivisions
function onSubdivsRUpdate() {
    let subdivsValue = document.getElementById("subdivsRValue");
    const fValue = Math.max(3, parseInt(subdivsValue.value));
    subdivsRValue.value = "" + fValue;
    ringSubdivs = fValue;
    generate("full");
}

// Input tunnel subdivisions
function onSubdivsLUpdate() {
    let subdivsValue = document.getElementById("subdivsLValue");
    const fValue = Math.max(1, parseInt(subdivsValue.value));
    subdivsLValue.value = "" + fValue;
    tunnelSubdivs = fValue;
    generate("full");
}

// Input colors
function onColorsUpdate() {
    let colorsValue = document.getElementById("colorsValue");
    let pattern = /(0x[A-F0-9]{6})/gi;
    let matches;
    let newColors = [];
    if ((matches = colorsValue.value.match(pattern)) !== null) {
        console.log(matches);
        matches.map(str => newColors.push(parseInt(str)));
    }
    if (newColors.length > 0) colors = newColors;
    generate("colors");
}


/*
 *   Event handlers - Viewing options
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

// Update axis for auto-rotation
function onUpdateAxis() {
    let axisValue = document.getElementById("axisValue").value;
    let format = /\((-?\d+\.?\d*),\s(-?\d+\.?\d*),\s(-?\d+\.?\d*)\)/;
    if (!format.test(axisValue)) return;
    let matches = format.exec(axisValue);
    let newAxis = new THREE.Vector3(parseFloat(matches[0]), parseFloat(matches[1]), parseFloat(matches[2]));
    newAxis.normalize();
    rotationVector = newAxis;
}

// Resize renderer to window on window size change
function onResize() {
    boundary = container.getBoundingClientRect();
    renderer.setSize(boundary.width, boundary.height);
    curCamera.aspect = boundary.width / boundary.height;
    curCamera.updateProjectionMatrix();
}