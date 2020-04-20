# Wormhole

## About

This wormhole is a personal project to explore parametric and procedural modelling. Eventually, I hope to use it as a sort of "hello world" to apply to other graphics APIs. This is the original version built *specifically* for Three.js.

## Current Features

Draws a tunnel along the Z-axis, with user-specified parameters:
- Length (*default: 200*)
    - The total length of the tunnel.
    - *Minimum: 1*
- Diameter (*default: 40*)
    - The approximate diameter of each ring.
    - *Minimum: 1*
- Vertex Variance (*default: 0.1*)
    - The distance a vertex is allowed to stray from the ring. Stays along its current angle.
    - *Maximum: diameter / 2*
- Ring Polys (*default: 200*)
    - The number of quads in a ring.
    - *Minimum: 3*
- Rings (*default: 200*)
    - The number of rings of quads along the tunnel.
    - *Minimum: 1*

The following additional tunnel parameters are hard-coded for the time being:
- Colors (*default: magenta, black*)
    - A list of colors to interpolate across the tunnel

The user is granted the additional viewing options:
- Camera selection
    - Access to an orthographic camera and a perspective camera, which are uniquely modifiable.
- Draw selection
    - Toggle between wireframe and triangle draw methods.
- Color toggle
    - Toggle between per-vertex color and colorless (white only) drawing.
- Rotation toggle
    - Toggle automatic model rotation.
- Axis
    - A vector supplying an axis for the model rotation.

Currently in its fifth major iteration. Orbit controls are currently implemented, granting orbit, pan, and zoom capabilities for either camera. Model rotates by default, but can be toggled.
Tunnel colors are set, with magenta and black interpolated across the length.

### Known Issues

None.

## Planned Features

### Tunnel Generation

Tunnel generation is set to follow these additional user-specified constraints: (NYI)
- Curve
    - A bezier curve for the tunnel to follow
    - *Optional, no prerequisite.*
    - *Default:* Z-axis
- Curve Start
    - The position along the curve to start generating from
    - *Optional, requires:* Curve
    - *Default:* Origin

The following user-specified constraints are implemented, but not yet interactive:
- Colors
    - A list of colors to interpolate across the tunnel
    - *Optional, no prerequisite.*
    - *Default:* White

### Shading Options

User will be able to specify flat, gouraud, or phong shading.

### Animation

The vertices of the tunnel are planned to animate along scalar multiples of their representative vectors. I plan to make this sinusoidal, but that may change. The user may specify the relative and individual variances of the animation.