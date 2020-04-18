# Wormhole

## About

This wormhole is a personal project to explore parametric and procedural modelling. Eventually, I hope to use it as a sort of "hello world" to apply to other graphics APIs. This is the original version built *specifically* for Three.js.

## Current Features

Draws a basic and buggy tunnel according to hard-coded constraints:
- Diameter
- Vertex Variance
    - The distance a vertex is allowed to stray from the tunnel's center. Stays along its current angle.
- Ring Subdivisions
    - The number of edges around the tunnel (joining points)
- Tunnel Subdivisions
    - The number of edges along the tunnel (joining rings)
- Colors
    - A list of colors to interpolate across the tunnel

Currently in its first iteration. Next iteration should fix some generational issues and add shading. Auto-orbit is implemented for the time being.

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
    - The number of edges along the tunnel (joining rings)
- Curve
    - A parametric spline for the tunnel to follow
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

### Shading Options

User will be able to specify flat, gouraud, or phong shading.

### Camera Options

The camera is planned to have full view control including zooming, panning, and orbiting.

### Animation

The vertices of the tunnel are planned to animate along scalar multiples of their representative vectors. I plan to make this sinusoidal, but that may change. The user may specify the relative and individual variances of the animation.