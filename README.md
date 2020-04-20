# Wormhole

## About

This wormhole is a personal project to explore parametric and procedural modelling. Eventually, I hope to use it as a sort of "hello world" to apply to other graphics APIs. This is the original version built *specifically* for Three.js.

## Current Features

Draws a large tunnel **(read: intensive)** according to hard-coded constraints:
- Diameter (40)
- Vertex Variance (0.1)
    - The distance a vertex is allowed to stray from the tunnel's center. Stays along its current angle.
- Ring Subdivisions (1000)
    - The number of edges around the tunnel (joining points)
- Tunnel Subdivisions (1000)
    - The number of edges along the tunnel (joining rings)
- Colors
    - A list of colors to interpolate across the tunnel

User has some options:
- Camera selection
    - Access to an orthographic camera and a perspective camera, which are uniquely modifiable.
- Draw selection
    - Toggle between wireframe and triangle draw methods.
- Color toggle
    - Toggle between per-vertex color and colorless (white only) drawing.
- Rotation toggle
    - Toggle automatic model rotation.

Currently in its fourth iteration. Orbit controls are currently implemented, granting orbit, pan, and zoom capabilities for either camera. Model rotates by default.
Tunnel colors are randomized, with 2 interpolated across the length.

### Known Issues

None.

## Planned Features

### Tunnel Generation

Tunnel generation is set to follow certain user-specified constraints:
- Length
- Diameter
- Vertex Variance
    - The distance a vertex is allowed to stray from the tunnel's center. Stays along its current angle.
- Ring Subdivisions
    - The number of edges around the tunnel (joining points)
- Tunnel Subdivisions
    - The number of bands along the tunnel (joining rings)
- Curve
    - A bezier curve for the tunnel to follow
    - *Optional, no prerequisite.*
    - *Default:* Z-axis
- Curve Start
    - The position along the curve to start generating from
    - *Optional, requires:* Curve
    - *Default:* Origin
- Colors
    - A list of colors to interpolate across the tunnel
    - *Optional, no prerequisite.*
    - *Default:* White

**Possible Addition:** I may restrict user parameters to have reasonable minimums:
- Vertex Variance: At least 0.5 * diameter
- Ring Subdivisions: At least 3
- Tunnel Subdivisions: At least 2
- Colors: At least one color

### Shading Options

User will be able to specify flat, gouraud, or phong shading.

### Animation

The vertices of the tunnel are planned to animate along scalar multiples of their representative vectors. I plan to make this sinusoidal, but that may change. The user may specify the relative and individual variances of the animation.