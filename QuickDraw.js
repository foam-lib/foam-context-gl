import ContextGL, {UNIFORM_NAME_POINT_SIZE} from './ContextGL';
import {DrawState} from './State';
import * as ArrayUtil from 'foam-util/ArrayUtil';
import * as Vec4 from 'foam-math/Vec4';

const VEC2_ZERO = [0,0];
const VEC2_ONE = [1,1];

function QuickDraw(ctx){
    ctx = this._ctx = ctx || QuickDraw.sharedContext();

    this._numSegmentsCircleMin  = 3;
    this._numSegmentsCircleMax  = 128;
    this._numSegmentsCirclePrev = -1;
    this._numSegmentsEllipseMin = this._numSegmentsCircleMin;
    this._numSegmentsEllipseMax = this._numSegmentsCircleMax;
    this._numSegmentsEllipsePrev = -1;

    this._color = [1,0,0,1];
    this._colorPrev = [0,0,0,0];

    this._drawState = new DrawState(
        [1,1,1,1], //color
        ctx.getLineWidth(), //lineWidth
        1, //pointSize
        16, //numSegmentsCircle
        16 //numSegmentsEllipse
    );
    this._drawStateStack = [];


    // Point

    this._bufferPointPosition = ctx.createVertexBuffer(
        new Float32Array(3), ctx.DYNAMIC_DRAW, true
    );
    this._bufferPointColor = ctx.createVertexBuffer(
        new Float32Array(4), ctx.DYNAMIC_DRAW, true
    );
    this._vaoPoint = ctx.createVertexArray([
        {location: ctx.ATTRIB_LOCATION_POSITION, buffer: this._bufferPointPosition, size: 3},
        {location: ctx.ATTRIB_LOCATION_COLOR, buffer: this._bufferPointColor, size: 4}
    ]);
    console.assert(ctx.getGLError());

    // Points

    this._bufferPointsPosition = ctx.createVertexBuffer(
        new Float32Array(0), ctx.DYNAMIC_DRAW, true
    );
    this._bufferPointsColor = ctx.createVertexBuffer(
        new Float32Array(0), ctx.DYNAMIC_DRAW, true
    );
    this._vaoPoints = ctx.createVertexArray([
        {location: ctx.ATTRIB_LOCATION_POSITION, buffer: this._bufferPointsPosition, size: 3},
        {location: ctx.ATTRIB_LOCATION_COLOR, buffer: this._bufferPointsColor, size: 4}
    ]);
    console.assert(ctx.getGLError());

    this._tempArrPoints = [];

    // Line

    this._bufferLinePosition = ctx.createVertexBuffer(
        new Float32Array(6), ctx.DYNAMIC_DRAW, true
    );
    this._bufferLineColor = ctx.createVertexBuffer(
        new Float32Array(8), ctx.DYNAMIC_DRAW, true
    );
    this._vaoLine = ctx.createVertexArray([
        {location: ctx.ATTRIB_LOCATION_POSITION, buffer: this._bufferLinePosition, size: 3},
        {location: ctx.ATTRIB_LOCATION_COLOR, buffer: this._bufferLineColor, size: 4}
    ]);
    console.assert(ctx.getGLError());

    // Line strip

    this._bufferLineStripPosition = ctx.createVertexBuffer(
        new Float32Array(0), ctx.DYNAMIC_DRAW, true
    );
    this._bufferLineStripColor = ctx.createVertexBuffer(
        new Float32Array(0), ctx.DYNAMIC_DRAW, true
    );
    this._vaoLineStrip = ctx.createVertexArray([
        {location: ctx.ATTRIB_LOCATION_POSITION, buffer: this._bufferLineStripPosition, size: 3},
        {location: ctx.ATTRIB_LOCATION_COLOR, buffer: this._bufferLineStripColor, size: 4}
    ]);
    console.assert(ctx.getGLError());

    this._tempArrLineStrip = [];

    // Lines

    this._bufferLinesPosition = ctx.createVertexBuffer(
        new Float32Array(0), ctx.DYNAMIC_DRAW, true
    );
    this._bufferLinesColor = ctx.createVertexBuffer(
        new Float32Array(0), ctx.DYNAMIC_DRAW, true
    );
    this._vaoLines = ctx.createVertexArray([
        {location: ctx.ATTRIB_LOCATION_POSITION, buffer: this._bufferLinesPosition, size: 3},
        {location: ctx.ATTRIB_LOCATION_COLOR, buffer: this._bufferLinesColor, size: 4}
    ]);
    console.assert(ctx.getGLError());

    this._tempArrLines = [];

    // Rect points

    this._bufferRectPosition = ctx.createVertexBuffer(
        new Float32Array([0,0, 1,0, 1,1, 0,1]),ctx.STATIC_DRAW
    );
    this._bufferRectTexcoord = ctx.createVertexBuffer(
        new Float32Array([0,0, 1,0, 1,1, 0,1]),ctx.STATIC_DRAW
    );
    this._bufferRectPointsColor = ctx.createVertexBuffer(
        new Float32Array(ArrayUtil.createWithValuesArgs(4,1,1,1,1)), ctx.DYNAMIC_DRAW,true
    );
    this._vaoRectPoints = ctx.createVertexArray([
        {location: ctx.ATTRIB_LOCATION_POSITION, buffer: this._bufferRectPosition, size: 2},
        {location: ctx.ATTRIB_LOCATION_COLOR, buffer: this._bufferRectPointsColor, size: 4},
        {location: ctx.ATTRIB_LOCATION_TEX_COORD, buffer: this._bufferRectTexcoord, size: 2}
    ]);
    console.assert(ctx.getGLError());

    // Rect stroked

    this._bufferRectStrokedColor = ctx.createVertexBuffer(
        new Float32Array(ArrayUtil.createWithValuesArgs(4,1,1,1,1)), ctx.DYNAMIC_DRAW,true
    );
    this._vaoRectStroked = ctx.createVertexArray([
        {location: ctx.ATTRIB_LOCATION_POSITION, buffer: this._bufferRectPosition, size: 2},
        {location: ctx.ATTRIB_LOCATION_COLOR, buffer: this._bufferRectStrokedColor, size: 4},
        {location: ctx.ATTRIB_LOCATION_TEX_COORD, buffer: this._bufferRectTexcoord, size: 2}
    ]);
    console.assert(ctx.getGLError());

    // Rect

    this._bufferRectColor = ctx.createVertexBuffer(
        new Float32Array(ArrayUtil.createWithValuesArgs(4,1,1,1,1)), ctx.DYNAMIC_DRAW, true
    );
    this._bufferRectIndex = ctx.createIndexBuffer(
        new Uint16Array([0,1,2, 2,3,0]),ctx.STATIC_DRAW
    );
    this._vaoRect = ctx.createVertexArray([
        { location : ctx.ATTRIB_LOCATION_POSITION, buffer : this._bufferRectPosition, size : 2},
        { location : ctx.ATTRIB_LOCATION_COLOR, buffer : this._bufferRectColor, size : 4},
        { location : ctx.ATTRIB_LOCATION_TEX_COORD, buffer : this._bufferRectTexcoord, size : 2}
    ], this._bufferRectIndex);
    console.assert(ctx.getGLError());

    // Circle

    this._bufferCirclePosition = ctx.createVertexBuffer(
        new Float32Array(this._numSegmentsCircleMax * 3), ctx.STATIC_DRAW,true
    );
    this._bufferCircleColor = ctx.createVertexBuffer(
        new Float32Array(ArrayUtil.createWithValuesArgs(this._numSegmentsCircleMax,1,1,1,1)), ctx.DYNAMIC_DRAW,true
    );
    this._bufferCircleTexcoord = ctx.createVertexBuffer(
        new Float32Array(this._numSegmentsCircleMax * 2), ctx.DYNAMIC_DRAW,true
    );
    this._bufferCircleNormal = ctx.createVertexBuffer(
        new Float32Array(ArrayUtil.createWithValuesArgs(this._drawState.numSegmentsCircle,1,0,0)), ctx.STATIC_DRAW, true
    );
    this._vaoCircle = ctx.createVertexArray([
        {buffer : this._bufferCirclePosition, location : ctx.ATTRIB_LOCATION_POSITION, size : 2, offset : 0},
        {buffer : this._bufferCircleColor, location : ctx.ATTRIB_LOCATION_COLOR, size : 4, offset : 0},
        {buffer : this._bufferCircleTexcoord, location : ctx.ATTRIB_LOCATION_TEX_COORD, size : 2, offset : 0},
        {buffer : this._bufferCircleNormal, location : ctx.ATTRIB_LOCATION_NORMAL, size : 3, offset : 0}
    ]);
    console.assert(ctx.getGLError());

    //Ellipse

    this._bufferEllipsePosition = ctx.createVertexBuffer(
        new Float32Array(this._numSegmentsEllipseMax * 3), ctx.STATIC_DRAW,true
    );
    this._bufferEllipseColor = ctx.createVertexBuffer(
        new Float32Array(ArrayUtil.createWithValuesArgs(this._numSegmentsEllipseMax,1,1,1,1)), ctx.DYNAMIC_DRAW,true
    );
    this._bufferEllipseTexcoord = ctx.createVertexBuffer(
        new Float32Array(this._numSegmentsEllipseMax * 2), ctx.DYNAMIC_DRAW,true
    );
    this._bufferEllipseNormal = ctx.createVertexBuffer(
        new Float32Array(ArrayUtil.createWithValuesArgs(this._drawState.numSegmentsEllipse,1,0,0)),  ctx.STATIC_DRAW, true
    );
    this._vaoEllipse = ctx.createVertexArray([
        {buffer : this._bufferEllipsePosition, location : ctx.ATTRIB_LOCATION_POSITION, size : 2, offset : 0},
        {buffer : this._bufferEllipseColor, location : ctx.ATTRIB_LOCATION_COLOR, size : 4, offset : 0},
        {buffer : this._bufferEllipseTexcoord, location : ctx.ATTRIB_LOCATION_TEX_COORD, size : 2, offset : 0},
        {buffer : this._bufferEllipseNormal, location : ctx.ATTRIB_LOCATION_NORMAL, size : 3, offset : 0}
    ]);
    console.assert(ctx.getGLError());

    this._bufferTrianglePosition = ctx.createVertexBuffer(
        new Float32Array(9), ctx.DYNAMIC_DRAW, true
    );
    this._bufferTriangleNormal = ctx.createVertexBuffer(
        new Float32Array(9), ctx.DYNAMIC_DRAW, true
    );
    this._bufferTriangleColor = ctx.createVertexBuffer(
        new Float32Array(12), ctx.DYNAMIC_DRAW, true
    );
    this._vaoTriangle = ctx.createVertexArray([
        {buffer: this._bufferTrianglePosition, location: ctx.ATTRIB_LOCATION_POSITION, size: 3},
        {buffer: this._bufferTriangleNormal, location: ctx.ATTRIB_LOCATION_NORMAL, size: 3},
        {buffer: this._bufferTriangleColor, location: ctx.ATTRIB_LOCATION_COLOR, size: 4}
    ]);

    // Cube stroked / points

    this._bufferCubeCornerPosition = ctx.createVertexBuffer(
        new Float32Array([
            -0.5,-0.5,-0.5,
            0.5,-0.5,-0.5,
            0.5,-0.5, 0.5,
            -0.5,-0.5, 0.5,
            -0.5, 0.5,-0.5,
            0.5, 0.5,-0.5,
            0.5, 0.5, 0.5,
            -0.5, 0.5, 0.5
        ]),ctx.STATIC_DRAW
    );
    this._bufferCubeStrokedColor = ctx.createVertexBuffer(
        new Float32Array(ArrayUtil.createWithValuesArgs(8,1,1,1,1)), ctx.DYNAMIC_DRAW, true
    );
    this._bufferCubeStrokedIndex = ctx.createIndexBuffer(
        new Uint16Array([
            0, 1, 1, 2, 2, 3, 3, 0,
            4, 5, 5, 6, 6, 7, 7, 4,
            0, 4,
            1, 5,
            2, 6,
            3, 7
        ]),
        ctx.STATIC_DRAW
    );
    this._bufferCubePointsColor = ctx.createVertexBuffer(
        new Float32Array(ArrayUtil.createWithValuesArgs(8,1,1,1,1)), ctx.DYNAMIC_DRAW, true
    );
    this._vaoCubeStroked = ctx.createVertexArray([
        {buffer : this._bufferCubeCornerPosition, location : ctx.ATTRIB_LOCATION_POSITION, size : 3},
        {buffer : this._bufferCubeStrokedColor, location : ctx.ATTRIB_LOCATION_COLOR, size : 4}
    ], this._bufferCubeStrokedIndex);
    this._vaoCubePoints = ctx.createVertexArray([
        {buffer : this._bufferCubeCornerPosition, location : ctx.ATTRIB_LOCATION_POSITION, size : 3},
        {buffer : this._bufferCubePointsColor, location : ctx.ATTRIB_LOCATION_COLOR, size : 4}
    ]);
    console.assert(ctx.getGLError());

    // Cube colored

    this._bufferCubeColored = ctx.createVertexBuffer(
        new Float32Array([
            //front face
            -0.5, -0.5,  0.5,   1.0,  1.0,  1.0,
            0.5, -0.5,  0.5,   1.0,  1.0,  1.0,
            0.5,  0.5,  0.5,   1.0,  1.0,  1.0,
            -0.5,  0.5,  0.5,   1.0,  1.0,  1.0,
            //back face
            -0.5, -0.5, -0.5,   1.0,  0.0,  0.0,
            -0.5,  0.5, -0.5,   1.0,  0.0,  0.0,
            0.5,  0.5, -0.5,   1.0,  0.0,  0.0,
            0.5, -0.5, -0.5,   1.0,  0.0,  0.0,
            //top face
            -0.5,  0.5, -0.5,   0.0,  1.0,  0.0,
            -0.5,  0.5,  0.5,   0.0,  1.0,  0.0,
            0.5,  0.5,  0.5,   0.0,  1.0,  0.0,
            0.5,  0.5, -0.5,   0.0,  1.0,  0.0,
            //bottom face
            -0.5, -0.5, -0.5,   0.0,  0.0,  1.0,
            0.5, -0.5, -0.5,   0.0,  0.0,  1.0,
            0.5, -0.5,  0.5,   0.0,  0.0,  1.0,
            -0.5, -0.5,  0.5,   0.0,  0.0,  1.0,
            //right face
            0.5, -0.5, -0.5,   1.0,  1.0,  0.0,
            0.5,  0.5, -0.5,   1.0,  1.0,  0.0,
            0.5,  0.5,  0.5,   1.0,  1.0,  0.0,
            0.5, -0.5,  0.5,   1.0,  1.0,  0.0,
            //left face
            -0.5, -0.5, -0.5,   1.0,  0.0,  1.0,
            -0.5, -0.5,  0.5,   1.0,  0.0,  1.0,
            -0.5,  0.5,  0.5,   1.0,  0.0,  1.0,
            -0.5,  0.5, -0.5,   1.0,  0.0,  1.0
        ]),
        ctx.STATIC_DRAW
    );

    this._bufferCubeTexCoord = ctx.createVertexBuffer(
        new Float32Array([]),
        ctx.STATIC_DRAW
    );

    this._bufferCubeIndex = ctx.createIndexBuffer(
        new Uint8Array([
            0,  1,  2,  0,  2,  3,  // front
            4,  5,  6,  4,  6,  7,  // back
            8,  9,  10, 8,  10, 11, // top
            12, 13, 14, 12, 14, 15, // bottom
            16, 17, 18, 16, 18, 19, // right
            20, 21, 22, 20, 22, 23  // left
        ]),
        ctx.STATIC_DRAW
    );

    this._vaoCubeColored = ctx.createVertexArray([
        {buffer : this._bufferCubeColored, location : ctx.ATTRIB_LOCATION_POSITION, size : 3, stride : 6 * 4, offset : 0    },
        {buffer : this._bufferCubeColored, location : ctx.ATTRIB_LOCATION_COLOR,    size : 3, stride : 6 * 4, offset : 3 * 4}
    ], this._bufferCubeIndex);
    console.assert(ctx.getGLError());

    //// Cube

    this._bufferCube = ctx.createVertexBuffer(
        new Float32Array([
            //front face
            -0.5, -0.5,  0.5,  -1.0,  0.0,  0.0,
            0.5, -0.5,  0.5,  -1.0,  0.0,  0.0,
            0.5,  0.5,  0.5,  -1.0,  0.0,  0.0,
            -0.5,  0.5,  0.5,  -1.0,  0.0,  0.0,
            //back face
            -0.5, -0.5, -0.5,   1.0,  0.0,  0.0,
            -0.5,  0.5, -0.5,   1.0,  0.0,  0.0,
            0.5,  0.5, -0.5,   1.0,  0.0,  0.0,
            0.5, -0.5, -0.5,   1.0,  0.0,  0.0,
            //top face
            -0.5,  0.5, -0.5,   0.0,  1.0,  0.0,
            -0.5,  0.5,  0.5,   0.0,  1.0,  0.0,
            0.5,  0.5,  0.5,   0.0,  1.0,  0.0,
            0.5,  0.5, -0.5,   0.0,  1.0,  0.0,
            //bottom face
            -0.5, -0.5, -0.5,   0.0, -1.0,  0.0,
            0.5, -0.5, -0.5,   0.0, -1.0,  0.0,
            0.5, -0.5,  0.5,   0.0, -1.0,  0.0,
            -0.5, -0.5,  0.5,   0.0, -1.0,  0.0,
            //right face
            0.5, -0.5, -0.5,   0.0,  0.0,  1.0,
            0.5,  0.5, -0.5,   0.0,  0.0,  1.0,
            0.5,  0.5,  0.5,   0.0,  0.0,  1.0,
            0.5, -0.5,  0.5,   0.0,  0.0,  1.0,
            //left face
            -0.5, -0.5, -0.5,   0.0,  0.0, -1.0,
            -0.5, -0.5,  0.5,   0.0,  0.0, -1.0,
            -0.5,  0.5,  0.5,   0.0,  0.0, -1.0,
            -0.5,  0.5, -0.5,   0.0,  0.0, -1.0
        ]),
        ctx.STATIC_DRAW
    );
    this._bufferCubeColor = ctx.createVertexBuffer(
        new Float32Array(ArrayUtil.createWithValuesArgs(24,1,1,1,1)), ctx.DYNAMIC_DRAW, true
    );
    this._vaoCube = ctx.createVertexArray([
        { buffer : this._bufferCube, location : ctx.ATTRIB_LOCATION_POSITION, size : 3, stride : 6 * 4, offset : 0     },
        { buffer : this._bufferCube, location : ctx.ATTRIB_LOCATION_NORMAL, size : 3, stride : 6 * 4, offset : 3 * 4 },
        { buffer : this._bufferCubeColor,    location : ctx.ATTRIB_LOCATION_COLOR, size : 4    }
    ], this._bufferCubeIndex);
    console.assert(ctx.getGLError());

    //head
    this._numHeadPoints = 20;
    const positionsHead = new Float32Array(this._numHeadPoints * 3);

    positionsHead[0] = 0.0;
    positionsHead[1] = 1.0;
    positionsHead[2] = 0.0;

    let angle = Math.PI * 2 / ( this._numHeadPoints - 2);
    for(let i = 1; i < this._numHeadPoints; ++i){
        let angle_ = angle * (i - 1);
        positionsHead[i*3  ] = Math.cos(angle_);
        positionsHead[i*3+1] = 0;
        positionsHead[i*3+2] = Math.sin(angle_);
    }

    this._bufferHeadPosition = ctx.createVertexBuffer(
        positionsHead,ctx.STATIC_DRAW
    );
    this._bufferHeadColor = ctx.createVertexBuffer(
        new Float32Array(ArrayUtil.createWithValuesArgs(this._numHeadPoints,1,1,1,1)), ctx.DYNAMIC_DRAW, true
    );
    this._vaoHead = ctx.createVertexArray([
        { buffer : this._bufferHeadPosition, location : ctx.ATTRIB_LOCATION_POSITION, size : 3 },
        { buffer : this._bufferHeadColor,    location : ctx.ATTRIB_LOCATION_COLOR,    size : 4 }
    ]);
    console.assert(ctx.getGLError());

    //tube
    this._numTubePoints   = 20 * 2;
    const numTubePoints_2 = this._numTubePoints / 2;

    const positionsTube = new Float32Array(this._numTubePoints * 3);
    const normalsTube   = new Float32Array(this._numTubePoints * 3);

    angle = Math.PI * 2 / (numTubePoints_2 - 1);
    for(let i = 0; i < this._numTubePoints; ++i){
        let angle_ = angle * (i / 2);
        let x = Math.cos(angle_);
        let z = Math.sin(angle_);

        let a = i * 3;
        let b = i * 3 + 1;
        let c = i * 3 + 2;

        positionsTube[a] = x;
        positionsTube[b] = (i%2==0) ? 0.0 : 1.0;
        positionsTube[c] = z;

        normalsTube[a] = x;
        normalsTube[b] = 0;
        normalsTube[c] = z;
    }

    this._bufferTubePosition = ctx.createVertexBuffer(
        positionsTube, ctx.STATIC_DRAW
    );
    this._bufferTubeNormal = ctx.createVertexBuffer(
        normalsTube, ctx.STATIC_DRAW
    );
    this._bufferTubeColor = ctx.createVertexBuffer(
        new Float32Array(ArrayUtil.createWithValuesArgs(this._numTubePoints,1,1,1,1)),ctx.DYNAMIC_DRAW,true
    );
    this._vaoTube = ctx.createVertexArray([
        {buffer: this._bufferTubePosition, location: ctx.ATTRIB_LOCATION_POSITION, size: 3},
        {buffer: this._bufferTubeNormal, location: ctx.ATTRIB_LOCATION_NORMAL, size: 3},
        {buffer: this._bufferTubeColor, location: ctx.ATTRIB_LOCATION_COLOR, size: 4}
    ]);
    console.assert(ctx.getGLError());

    //Grid

    this._bufferGridPosition = ctx.createVertexBuffer(
        new Float32Array(0), ctx.DYNAMIC_DRAW, true
    );
    this._bufferGridColor = ctx.createVertexBuffer(
        new Float32Array(0), ctx.DYNAMIC_DRAW, true
    );
    this._bufferGridIndex = ctx.createIndexBuffer(
        new Uint16Array(0), ctx.DYNAMIC_DRAW, true
    );

    this._gridSubdivs = null;
    this._gridNumIndices = 0;
    this._gridNumElements = 0;

    this._vaoGrid = ctx.createVertexArray([
        { buffer : this._bufferGridPosition, location : ctx.ATTRIB_LOCATION_POSITION, size : 3 },
        { buffer : this._bufferGridColor,    location : ctx.ATTRIB_LOCATION_COLOR,    size : 4 }
    ], this._bufferGridIndex);
    console.assert(ctx.getGLError());
}

export class QuickDrawError extends Error{
    constructor(msg){
        super(msg);
        this.name = 'QuickDrawError';
    }
}

const STR_ERROR_QUICK_DRAW_NO_ATTRIB_POSITION = "Program has no default attrib 'aPosition'.";

//INTERNAL

QuickDraw.prototype._updateGrid = function(subdivs){
    this._ctx.setVertexBuffer(this._bufferGridColor);
    let colors = this._ctx.getVertexBufferData();

    if(subdivs == this._gridSubdivs){
        if(!Vec4.equals(colors, this._color)){
            ArrayUtil.fillv4(colors, this._color);
            this._ctx.updateVertexBufferData();
        }
        return;
    }

    const subdivs1 = subdivs + 1;
    const num = subdivs1 * subdivs1;

    const positions = new Float32Array(num * 3);
    colors = new Float32Array(ArrayUtil.createWithValuesv(num, this._color));

    const step = 1.0 / subdivs;

    for(let i = 0, j, index; i < subdivs1; ++i){
        for(j = 0; j < subdivs1; ++j){
            index = (i * subdivs1 + j) * 3;
            positions[index] = -0.5 + step * j;
            positions[index + 1] = 0;
            positions[index + 2] = -0.5 + step * i;
        }
    }

    const indices = [];

    for(let i = 0, j, k; i < subdivs1; ++i){
        for(j = 0; j < subdivs1; ++j){
            if(j < subdivs){
                k = i * subdivs1 + j;
                indices.push(k, k + 1);
            }
            if(i < subdivs){
                k = i * subdivs1 + j;
                indices.push(k, k + subdivs1);
            }
        }
    }

    this._ctx.setVertexBuffer(this._bufferGridPosition);
    this._ctx.setVertexBufferData(positions);

    this._ctx.setVertexBuffer(this._bufferGridColor);
    this._ctx.setVertexBufferData(colors);

    this._ctx.setIndexBuffer(this._bufferGridIndex);
    this._ctx.setIndexBufferData(new Uint16Array(indices));

    this._gridSubdivs = subdivs;
    this._gridNumIndices = indices.length;
    this._gridNumElements = positions.length / 3;
};

QuickDraw.prototype._drawGridInternal = function(size, subdivs, mode){
    size    = (size === undefined || (size[0] < 0 || size[1] < 0)) ? VEC2_ONE : size;
    subdivs = (subdivs === undefined || subdivs < 0) ? 1 : subdivs;

    if(!this._ctx._programHasAttribPosition){
        return;
    }

    this._updateGrid(subdivs);

    this._ctx.setVertexArray(this._vaoGrid);
    this._ctx.pushModelMatrix();
    this._ctx.scale3(size[0],1.0,size[1]);
    if(mode === this._ctx.LINES){
        this._ctx.drawElements(this._ctx.LINES, this._gridNumIndices);
    } else {
        this._ctx.drawArrays(this._ctx.POINTS, 0, this._gridNumElements);
    }
    this._ctx.popModelMatrix();
};

QuickDraw.prototype._updateCircleGeom = function(positions, texCoords, numSegments, offsetPositions, offsetTexcoords){
    offsetPositions = offsetPositions === undefined ? 0 : offsetPositions;
    offsetTexcoords = offsetTexcoords === undefined ? 0 : offsetTexcoords;
    var step = Math.PI * 2 / numSegments;
    for(var i = 0, j, k; i < numSegments; ++i){
        j = offsetPositions + i * 2;
        positions[j  ] = Math.cos(step * i);
        positions[j+1] = Math.sin(step * i);

        k = offsetTexcoords + i * 2;
        texCoords[k  ] = 0.5 + positions[j ];
        texCoords[k+1] = 0.5 + positions[j+1]
    }
};

QuickDraw.prototype._drawCircleInternal = function(radius, drawMode){
    if(!this._ctx._programHasAttribPosition){
        throw new QuickDrawError(STR_ERROR_QUICK_DRAW_NO_ATTRIB_POSITION);
    }
    this._ctx.setVertexArray(this._vaoCircle);
    const numSegmentsCircle = this._drawState.numSegmentsCircle;

    if(numSegmentsCircle != this._numSegmentsCirclePrev){
        this._ctx.setVertexBuffer(this._bufferCirclePosition);
        const positions = this._ctx.getVertexBufferData();
        this._ctx.setVertexBuffer(this._bufferCircleTexcoord);
        const texcoords = this._ctx.getVertexBufferData();

        this._updateCircleGeom(positions,texcoords,numSegmentsCircle);

        this._ctx.setVertexBuffer(this._bufferCirclePosition);
        this._ctx.updateVertexBufferData();
        this._ctx.setVertexBuffer(this._bufferCircleTexcoord);
        this._ctx.updateVertexBufferData();

        this._numSegmentsCirclePrev = numSegmentsCircle;
    }

    this._ctx.setVertexBuffer(this._bufferCircleColor);
    const colors = this._ctx.getVertexBufferData();

    if(!Vec4.equals(colors,this._drawState.color)){
        ArrayUtil.fillv4(colors,this._drawState.color);
        this._ctx.updateVertexBufferData();
    }

    this._ctx.pushModelMatrix();
    this._ctx.scale3(radius,radius,1);
    this._ctx.drawArrays(drawMode,0,numSegmentsCircle);
    this._ctx.popModelMatrix();
};

QuickDraw.prototype._drawEllipseInternal = function(radiusX, radiusY, drawMode){
    if(!this._ctx._programHasAttribPosition){
        throw new QuickDrawError(STR_ERROR_QUICK_DRAW_NO_ATTRIB_POSITION);
    }
    this._ctx.setVertexArray(this._vaoEllipse);
    const numSegmentsEllipse = this._drawState.numSegmentsEllipse;

    if(numSegmentsEllipse != this._numSegmentsEllipsePrev){
        this._ctx.setVertexBuffer(this._bufferEllipsePosition);
        const positions = this._ctx.getVertexBufferData();
        this._ctx.setVertexBuffer(this._bufferEllipseTexcoord);
        const texcoords = this._ctx.getVertexBufferData();

        this._updateCircleGeom(positions,texcoords,numSegmentsEllipse);

        this._ctx.setVertexBuffer(this._bufferEllipsePosition);
        this._ctx.updateVertexBufferData();
        this._ctx.setVertexBuffer(this._bufferEllipseTexcoord);
        this._ctx.updateVertexBufferData();

        this._numSegmentsEllipsePrev = numSegmentsEllipse;
    }

    this._ctx.setVertexBuffer(this._bufferEllipseColor);
    const colors = this._ctx.getVertexBufferData();

    if(!Vec4.equals(colors,this._drawState.color)){
        ArrayUtil.fillv4(colors,this._drawState.color);
        this._ctx.updateVertexBufferData();
    }

    this._ctx.pushModelMatrix();
    this._ctx.scale3(radiusX,radiusY,1);
    this._ctx.drawArrays(drawMode,0,numSegmentsEllipse);
    this._ctx.popModelMatrix();
};

QuickDraw.prototype._drawTriangleInternal9 = function(x0,y0,z0,x1,y1,z1,x2,y2,z2,drawMode){
    if(!this._ctx._programHasAttribPosition){
        throw new QuickDrawError(STR_ERROR_QUICK_DRAW_NO_ATTRIB_POSITION);
    }
    this._ctx.setVertexArray(this._vaoTriangle);

    this._ctx.setVertexBuffer(this._bufferTrianglePosition);
    const position = this._ctx.getVertexBufferData();
    if(x0 !== position[0] ||
        y0 !== position[1] ||
        z0 !== position[2] ||
        x1 !== position[3] ||
        y1 !== position[4] ||
        z1 !== position[5] ||
        x2 !== position[6] ||
        y2 !== position[7] ||
        z2 !== position[8]){
        position[0] = x0;
        position[1] = y0;
        position[2] = z0;
        position[3] = x1;
        position[4] = y1;
        position[5] = z1;
        position[6] = x2;
        position[7] = y2;
        position[8] = z2;
        this._ctx.updateVertexBufferData();
    }

    //TODO: Add normals here

    if(this._ctx._programHasAttribColor){
        this._ctx.setVertexBuffer(this._bufferTriangleColor);
        const colors = this._ctx.getVertexBufferData();
        if(!Vec4.equals(colors,this._drawState.color)){
            ArrayUtil.fillv4(colors,this._drawState.color);
        }
        this._ctx.updateVertexBufferData();
    }

    this._ctx.drawArrays(drawMode,0,3);
};

QuickDraw.prototype._drawHead = function(r,g,b,a){
    this._ctx.setVertexArray(this._vaoHead);

    if(this._ctx._programHasAttribColor){
        this._ctx.setVertexBuffer(this._bufferHeadColor);
        const color = this._ctx.getVertexBufferData();
        if(!Vec4.equals4(color,r,g,b,a)){
            ArrayUtil.fill4(color,r,g,b,a);
        }
        this._ctx.updateVertexBufferData();
    }

    this._ctx.drawArrays(this._ctx.TRIANGLE_FAN,0,this._numHeadPoints)
};

QuickDraw.prototype._drawTube = function(r,g,b,a){
    this._ctx.setVertexArray(this._vaoTube);

    if(this._ctx._programHasAttribColor){
        this._ctx.setVertexBuffer(this._bufferTubeColor);
        const color = this._ctx.getVertexBufferData();
        if(!Vec4.equals4(color,r,g,b,a)){
            ArrayUtil.fill4(color,r,g,b,a);
        }
        this._ctx.updateVertexBufferData();
    }

    this._ctx.drawArrays(this._ctx.TRIANGLE_STRIP,0,this._numTubePoints);
};

/**
 * Saves the current quickdraw state.
 * @param [newState]
 */
QuickDraw.prototype.pushDrawState = function(newState){
    this._drawStateStack.push(this._drawState.copy());
    if(newState === undefined){
        return;
    }
    this.setDrawState(newState);
};

/**
 * Restores the previously saved quickdraw staet.
 */
QuickDraw.prototype.popDrawState = function(){
    if(this._drawStateStack.length === 0){
        throw new Error('Invalid stack pop. Stack has length 0.');
    }
    const state = this._drawStateStack.pop();
    this.setDrawColor(state.color);
    this._ctx.setLineWidth(state.lineWidth);
    this.setDrawPointSize(state.pointSize);
    this.setDrawEllipseSegmentsNum(state.numSegmentsEllipse);
    this.setDrawCircleSegmentsNum(state.numSegmentsCircle);
};

/**
 * Sets the current draw state.
 * @param state
 * @example
 * ctx.setDrawState(newState);
 *
 * ctx.setDrawState({
 *     color : [1,1,1,1],
 *     pointSize : 2
 * });
 */
QuickDraw.prototype.setDrawState = function(state){
    if(state.color !== undefined){
        this.setDrawColor(state.color);
    }
    if(state.lineWidth !== undefined){
        this._ctx.setLineWidth(state.lineWidth);
    }
    if(state.pointSize !== undefined){
        this.setDrawPointSize(state.pointSize);
    }
    if(state.numSegmentsEllipse !== undefined){
        this.setDrawEllipseSegmentsNum(state.numSegmentsEllipse);
    }
    if(state.numSegmentsCircle !== undefined){
        this.setDrawEllipseSegmentsNum(state.numSegmentsCircle);
    }
};

/**
 * Returns a copy of the current draw state.
 * @returns {DrawState}
 */
QuickDraw.prototype.getDrawState = function(){
    return this._drawState.copy();
};

/**
 * Sets the draw color.
 * @param color
 */
QuickDraw.prototype.setDrawColor = function(color){
    this.setDrawColor4(color[0],color[1],color[2],color[3]);
};

/**
 * Sets the draw color.
 * @param r
 * @param g
 * @param b
 * @param a
 */
QuickDraw.prototype.setDrawColor4 = function(r,g,b,a){
    Vec4.set4(this._drawState.color,r,g,b,a);
};

/**
 * Sets the draw color.
 * @param r
 * @param g
 * @param b
 */
QuickDraw.prototype.setDrawColor3 = function(r,g,b){
    this.setDrawColor4(r,g,b,1.0);
};

/**
 * Sets the draw color.
 * @param k
 * @param a
 */
QuickDraw.prototype.setDrawColor2 = function(k,a){
    this.setDrawColor4(k,k,k,a);
};

/**
 * Sets the draw color.
 * @param k
 */
QuickDraw.prototype.setDrawColor1 = function(k){
    this.setDrawColor4(k,k,k,1.0);
};

/**
 * Returns a copy of the current draw color.
 * @param out
 * @returns {*}
 */
QuickDraw.prototype.getDrawColor = function(out){
    return Vec4.set(out || Vec4.create(), this._color);
};

/**
 * Sets the draw point size.
 * @param pointSize
 */
QuickDraw.prototype.setDrawPointSize = function(pointSize){
    if(pointSize === this._drawState.pointSize){
        return;
    }
    if(this._ctx._programHasUniformPointSize){
        this._ctx.setProgramUniform(UNIFORM_NAME_POINT_SIZE,pointSize);
    }
    this._drawState.pointSize = pointSize;
};

/**
 * Returns the current draw point size.
 * @returns {Number}
 */
QuickDraw.prototype.getDrawPointSize = function(){
    return this._drawState.pointSize;
};

/**
 * Sets the number of draw ellipse segments.
 * @param num
 */
QuickDraw.prototype.setDrawEllipseSegmentsNum = function(num){
    this._drawState.numSegmentsEllipse = num;
};

/**
 * Returns the current number of draw ellipse segments.
 * @returns {Number}
 */
QuickDraw.prototype.getDrawEllipseSegmentsNum = function(){
    return this._drawState.numSegmentsEllipse;
};

/**
 * Sets the number of draw circle segments.
 * @param num
 */
QuickDraw.prototype.setDrawCircleSegmentsNum = function(num){
    this._drawState.numSegmentsCircle = num;
};

/**
 * Returns the current number of draw circle segments.
 * @returns {Number}
 */
QuickDraw.prototype.getDrawCircleSegmentsNum = function(){
    return this._drawState.numSegmentsCircle;
};

/**
 * Draws a single point.
 * @param point
 */
QuickDraw.prototype.drawPoint = function(point){
    this.drawPoint3(point[0],point[1],point[2]);
};

/**
 * Draws a single point.
 * @param x
 * @param y
 * @param z
 */
QuickDraw.prototype.drawPoint3 = function(x,y,z){
    if(!this._ctx._programHasAttribPosition){
        throw new QuickDrawError(STR_ERROR_QUICK_DRAW_NO_ATTRIB_POSITION);
    }
};

/**
 * Draws a series of points.
 * @param points
 */
QuickDraw.prototype.drawPoints = function(points){
    this.drawPointsFlat(ArrayUtil.unpack3(points,this._tempArrPoints));
};

/**
 * Draws a series of points.
 * @param points
 */
QuickDraw.prototype.drawPointsFlat = function(points){
    if(!this._ctx._programHasAttribPosition){
        throw new QuickDrawError(STR_ERROR_QUICK_DRAW_NO_ATTRIB_POSITION);
    }
};

/**
 * Draws a single line.
 * @param from
 * @param to
 */
QuickDraw.prototype.drawLine = function(from,to){
    this.drawLine6(from[0],from[1],from[2],to[0],to[1],to[2]);
};

/**
 * Draws a single line.
 * @param fromTo - Points [x0,y0,z0,x1,y1,z0]
 */
QuickDraw.prototype.drawLineFlat = function(fromTo){
    this.drawLine6(fromTo[0],fromTo[1],fromTo[2],fromTo[3],fromTo[4],fromTo[5]);
};

/**
 * Draws a single line.
 * @param x0
 * @param y0
 * @param z0
 * @param x1
 * @param y1
 * @param z1
 */
QuickDraw.prototype.drawLine6 = function(x0,y0,z0,x1,y1,z1){
    if(!this._ctx._programHasAttribPosition){
        throw new QuickDrawError(STR_ERROR_QUICK_DRAW_NO_ATTRIB_POSITION);
    }
    this._ctx.setVertexArray(this._vaoLine);

    if(this._ctx._programHasAttribColor){
        this._ctx.setVertexBuffer(this._bufferLineColor);
        const colors = this._ctx.getVertexBufferData();
        if(!Vec4.equals(colors,this._drawState.color)){
            ArrayUtil.fillv4(colors,this._drawState.color);
            this._ctx.updateVertexBufferData();
        }
    }

    this._ctx.setVertexBuffer(this._bufferLinePosition);
    const positions = this._ctx.getVertexBufferData();

    if(positions[0] != x0 ||
        positions[1] != y0 ||
        positions[2] != z0 ||
        positions[3] != x1 ||
        positions[4] != y1 ||
        positions[5] != z1){
        positions[0] = x0;
        positions[1] = y0;
        positions[2] = z0;
        positions[3] = x1;
        positions[4] = y1;
        positions[5] = z1;
        this._ctx.updateVertexBufferData();
    }

    this._ctx.drawArrays(this._ctx.LINES,0,2);
};

/**
 * Draws a line strip.
 * @param points - Points [[x,y,z],[x,y,z],[x,y,z],...]
 * @param loop
 */
QuickDraw.prototype.drawLineStrip = function(points,loop){
    this.drawLineStripFlat(ArrayUtil.unpack3(points,this._tempArrLineStrip),loop);
};

/**
 * Draws a line strip.
 * @param points - Points [x0,y0,z0,x1,y1,z1,...]
 * @param [loop]
 */
QuickDraw.prototype.drawLineStripFlat = function(points,loop){
    if(!this._ctx._programHasAttribPosition || points.length === 0){
        throw new QuickDrawError(STR_ERROR_QUICK_DRAW_NO_ATTRIB_POSITION);
    }
    loop = loop || false;

    this._ctx.setVertexArray(this._vaoLineStrip);

    const srcLen = points.length;
    const numElements = srcLen / 3;

    this._ctx.setVertexBuffer(this._bufferLineStripPosition);
    let positions = this._ctx.getVertexBufferData();
    let exceedsDstLen = srcLen > positions.length;

    if(!exceedsDstLen){
        positions.set(points);
        this._ctx.updateVertexBufferData();
    } else {
        positions = new Float32Array(points);
        this._ctx.setVertexBufferData(positions);
    }

    if(this._ctx._programHasAttribColor){
        this._ctx.setVertexBuffer(this._bufferLineStripColor);
        let colors = this._ctx.getVertexBufferData();
        exceedsDstLen = (numElements * 4) > colors.length;

        if(exceedsDstLen){
            colors = new Float32Array(ArrayUtil.createWithValuesv(numElements,this._drawState.color));
            this._ctx.setVertexBufferData(colors);
        } else {
            if(!Vec4.equals(colors,this._drawState.color)){
                ArrayUtil.fillv4(colors,this._drawState.color);
                this._ctx.updateVertexBufferData();
            }
        }
    }

    this._ctx.drawArrays(loop ? this._ctx.LINE_LOOP : this._ctx.LINE_STRIP,0,numElements)
};

/**
 * Draws a series of lines.
 */
QuickDraw.prototype.drawLines = function(lines){
    this.drawLineFlat(ArrayUtil.unpack3(lines,this._tempArrLines));
};

/**
 * Draws a series of lines.
 * @param lines
 */
QuickDraw.prototype.drawLinesFlat = function(lines){
    if(!this._ctx._programHasAttribPosition || lines.length === 0){
        throw new QuickDrawError(STR_ERROR_QUICK_DRAW_NO_ATTRIB_POSITION);
    }
    this._ctx.setVertexArray(this._vaoLines);

    const srcLen = lines.length;
    const numElements = srcLen / 3;

    this._ctx.setVertexBuffer(this._bufferLinesPosition);
    let positions = this._ctx.getVertexBufferData();
    let exceedsDstLen = srcLen > positions.length;

    if(!exceedsDstLen){
        positions.set(lines);
    } else {
        positions = new Float32Array(lines);
    }
    this._ctx.setVertexBufferData(positions);

    if(this._ctx._programHasAttribColor){
        this._ctx.setVertexBuffer(this._bufferLinesColor);
        let colors = this._ctx.getVertexBufferData();
        exceedsDstLen = (numElements * 4) > colors.length;

        if(exceedsDstLen){
            colors = new Float32Array(ArrayUtil.createWithValuesv(numElements,this._drawState.color));
            this._ctx.setVertexBufferData(colors);
        } else {
            if(!Vec4.equals(colors,this._drawState.color)){
                ArrayUtil.fillv4(colors,this._drawState.color);
                this._ctx.updateVertexBufferData();
            }
        }
    }

    this._ctx.drawArrays(this._ctx.LINES,0,numElements);
};

/**
 * Draws a solid rectangle.
 * @param size
 */
QuickDraw.prototype.drawRect = function(size){
    this.drawRect2(size[0],size[1]);
};

/**
 * Draws a solid rectangle.
 * @param width
 * @param height
 */
QuickDraw.prototype.drawRect2 = function(width,height){
    if(!this._ctx._programHasAttribPosition){
        throw new QuickDrawError(STR_ERROR_QUICK_DRAW_NO_ATTRIB_POSITION);
    }
    width = width === undefined ? 1 : width;
    height = height === undefined ? width : height;

    this._ctx.setVertexArray(this._vaoRect);

    if(this._ctx._programHasAttribColor){
        this._ctx.setVertexBuffer(this._bufferRectColor);
        const colors = this._ctx.getVertexBufferData();
        if(!Vec4.equals(colors,this._drawState.color)){
            ArrayUtil.fillv4(colors,this._drawState.color);
            this._ctx.updateVertexBufferData();
        }
    }

    if(width !== 1 || height !==1){
        this._ctx.pushModelMatrix();
        this._ctx.scale3(width,height,0);
        this._ctx.drawElements(this._ctx.TRIANGLES,6);
        this._ctx.popModelMatrix();
    } else {
        this._ctx.drawElements(this._ctx.TRIANGLES,6);
    }
};

/**
 * Draws rectangle points.
 * @param size
 */
QuickDraw.prototype.drawRectPoints = function(size){
    this.drawRectPoints2(size[0],size[1]);
};

/**
 * Draws rectangle points.
 * @param width
 * @param height
 */
QuickDraw.prototype.drawRectPoints2 = function(width,height){
    if(!this._ctx._programHasAttribPosition){
        throw new QuickDrawError(STR_ERROR_QUICK_DRAW_NO_ATTRIB_POSITION);
    }
    width = width === undefined ? 1 : width;
    height = height === undefined ? width : height;

    this._ctx.setVertexArray(this._vaoRectPoints);

    if(this._ctx._programHasAttribColor){
        this._ctx.setVertexBuffer(this._bufferRectPointsColor);
        const colors = this._ctx.getVertexBufferData();
        if(!Vec4.equals(colors,this._drawState.color)){
            ArrayUtil.fillv4(colors,this._drawState.color);
            this._ctx.updateVertexBufferData();
        }
    }

    if(width !== 1 || height !==1){
        this._ctx.pushModelMatrix();
        this._ctx.scale3(width,height,0);
        this._ctx.drawArrays(this._ctx.POINTS,0,4);
        this._ctx.popModelMatrix();
    } else {
        this._ctx.drawArrays(this._ctx.POINTS,0,4);
    }
};

/**
 * Draws a stroked rectangle.
 * @param size
 */
QuickDraw.prototype.drawRectStroked = function(size){
    this.drawRectStroked2(size[0],size[1]);
};

/**
 * Draws a stroked rectangle.
 * @param width
 * @param height
 */
QuickDraw.prototype.drawRectStroked2 = function(width,height){
    if(!this._ctx._programHasAttribPosition){
        throw new QuickDrawError(STR_ERROR_QUICK_DRAW_NO_ATTRIB_POSITION);
    }
    width = width === undefined ? 1 : width;
    height = height === undefined ? width : height;

    this._ctx.setVertexArray(this._vaoRectStroked);

    if(this._ctx._programHasAttribColor){
        this._ctx.setVertexBuffer(this._bufferRectStrokedColor);
        const colors = this._ctx.getVertexBufferData();
        if(!Vec4.equals(colors,this._drawState.color)){
            ArrayUtil.fillv4(colors,this._drawState.color);
            this._ctx.updateVertexBufferData();
        }
    }

    if(width !== 1 || height !==1){
        this._ctx.pushModelMatrix();
        this._ctx.scale3(width,height,0);
        this._ctx.drawArrays(this._ctx.LINE_LOOP,0,4);
        this._ctx.popModelMatrix();
    } else {
        this._ctx.drawElements(this._ctx.LINE_LOOP,0,4);
    }
};

/**
 * Draws a circle.
 * @param radius
 */
QuickDraw.prototype.drawCircle = function(radius){
    radius = radius === undefined ? 0.5 : radius;
    this._drawCircleInternal(radius, this._ctx.TRIANGLE_FAN);
};

/**
 * Draws a stroked circle.
 * @param radius
 */
QuickDraw.prototype.drawCircleStroked = function(radius){
    radius = radius === undefined ? 0.5 : radius;
    this._drawCircleInternal(radius,this._ctx.LINE_LOOP);
};


QuickDraw.prototype.drawCircles = function(){};

QuickDraw.prototype.drawCirclesStroked = function(){};

/**
 * Draws an ellipse.
 * @param radii
 */
QuickDraw.prototype.drawEllipse = function(radii){
    this.drawEllipse2(radii[0],radii[1]);
};

/**
 * Draws an ellipse.
 * @param radiusX
 * @param radiusY
 */
QuickDraw.prototype.drawEllipse2 = function(radiusX,radiusY){
    radiusX = radiusX === undefined ? 0.5 : radiusX;
    radiusY = radiusY === undefined ? radiusX : radiusY;
    this._drawEllipseInternal(radiusX,radiusY,this._ctx.TRIANGLE_FAN);
};

/**
 * Draws a stroked ellipse.
 * @param radii
 */
QuickDraw.prototype.drawEllipseStroked = function(radii){
    this.drawEllipseStroked2(radii[0],radii[1]);
};

/**
 * Draws a stroked ellipse.
 * @param radiusX
 * @param radiusY
 */
QuickDraw.prototype.drawEllipseStroked2 = function(radiusX,radiusY){
    radiusX = radiusX === undefined ? 0.5 : radiusX;
    radiusY = radiusY === undefined ? radiusX : radiusY;
    this._drawEllipseInternal(radiusX,radiusY,this._ctx.LINE_LOOP);
};

QuickDraw.prototype.drawEllipses = function(){};

QuickDraw.prototype.drawEllipsesStroked = function(){};

/**
 * Draws a single triangle.
 * @param p0
 * @param p1
 * @param p2
 */
QuickDraw.prototype.drawTriangle = function(p0,p1,p2){
    this.drawTriangle9(
        p0[0],p0[1],p0[2],
        p1[0],p1[1],p1[2],
        p2[0],p2[1],p2[2]
    );
};

/**
 * Draws a single triangle.
 * @param points
 */
QuickDraw.prototype.drawTriangleFlat = function(points){
    this.drawTriangle9(
        points[0],points[1],points[2],
        points[3],points[4],points[5],
        points[6],points[7],points[8]
    );
};

/**
 * Draws a single triangle.
 * @param x0
 * @param y0
 * @param z0
 * @param x1
 * @param y1
 * @param z1
 * @param x2
 * @param y2
 * @param z2
 */
QuickDraw.prototype.drawTriangle9 = function(x0,y0,z0,x1,y1,z1,x2,y2,z2){
    this._drawTriangleInternal9(
        x0,y0,z0,
        x1,y1,z1,
        x2,y2,z2,
        this._ctx.TRIANGLES
    );
};

/**
 * Draws a single stroked triangle.
 * @param p0
 * @param p1
 * @param p2
 */
QuickDraw.prototype.drawTriangleStroked = function(p0,p1,p2){
    this.drawTriangleStroked9(
        p0[0],p0[1],p0[2],
        p1[0],p1[1],p1[2],
        p2[0],p2[1],p2[2]
    );
};

/**
 * Draws a single stroked triangle.
 * @param points
 */
QuickDraw.prototype.drawTriangleStrokedFlat = function(points){
    this.drawTriangleStroked9(
        points[0],points[1],points[2],
        points[3],points[4],points[5],
        points[6],points[7],points[8]
    );
};

/**
 * Draws a single stroked triangle.
 * @param x0
 * @param y0
 * @param z0
 * @param x1
 * @param y1
 * @param z1
 * @param x2
 * @param y2
 * @param z2
 */
QuickDraw.prototype.drawTriangleStroked9 = function(x0,y0,z0,x1,y1,z1,x2,y2,z2){
    this._drawTriangleInternal9(
        x0,y0,z0,
        x1,y1,z1,
        x2,y2,z2,
        this._ctx.LINE_LOOP
    );
};

/**
 * Draws triangle points.
 * @param p0
 * @param p1
 * @param p2
 */
QuickDraw.prototype.drawTrianglePoints = function(p0,p1,p2){
    this.drawTrianglePoints9(
        p0[0],p0[1],p0[2],
        p1[0],p1[1],p1[2],
        p2[0],p2[1],p2[2]
    );
};

/**
 * Draws triangle points.
 * @param points
 */
QuickDraw.prototype.drawTrianglePointsFlat = function(points){
    this.drawTrianglePoints9(
        points[0],points[1],points[2],
        points[3],points[4],points[5],
        points[6],points[7],points[8]
    );
};

/**
 * Draws triangle points.
 * @param x0
 * @param y0
 * @param z0
 * @param x1
 * @param y1
 * @param z1
 * @param x2
 * @param y2
 * @param z2
 */
QuickDraw.prototype.drawTrianglePoints9 = function(x0,y0,z0,x1,y1,z1,x2,y2,z2){
    this._drawTriangleInternal9(
        x0,y0,z0,
        x1,y1,z1,
        x2,y2,z2,
        this._ctx.POINTS
    );
};

/**
 * Draws a cube.
 */
QuickDraw.prototype.drawCube = function(scale){
    if(!this._ctx._programHasAttribPosition){
        throw new QuickDrawError(STR_ERROR_QUICK_DRAW_NO_ATTRIB_POSITION);
    }
    this._ctx.setVertexArray(this._vaoCube);

    if(this._ctx._programHasAttribColor){
        this._ctx.setVertexBuffer(this._bufferCubeColor);
        const colors = this._ctx.getVertexBufferData();
        if(!Vec4.equals(colors, this._drawState.color)){
            ArrayUtil.fillv4(colors, this._drawState.color);
        }
        this._ctx.updateVertexBufferData();
    }

    if(scale !== undefined){
        this._ctx.pushModelMatrix();
        this._ctx.scale1(scale);
        this._ctx.drawElements(this._ctx.TRIANGLES,36);
        this._ctx.popModelMatrix();
    } else {
        this._ctx.drawElements(this._ctx.TRIANGLES,36);
    }
};

/**
 * Draws a colored cube.
 */
QuickDraw.prototype.drawCubeColored = function(scale){
    if(!this._ctx._programHasAttribPosition){
        throw new QuickDrawError(STR_ERROR_QUICK_DRAW_NO_ATTRIB_POSITION);
    }
    this._ctx.setVertexArray(this._vaoCubeColored);

    if(scale !== undefined){
        this._ctx.pushModelMatrix();
        this._ctx.scale(scale);
        this._ctx.drawElements(this._ctx.TRIANGLES, 36);
        this._ctx.popModelMatrix();
    } else {
        this._ctx.drawElements(this._ctx.TRIANGLES,36);
    }
};

/**
 * Draws cube corner points.
 * @param scale
 */
QuickDraw.prototype.drawCubePoints = function(scale){
    if(!this._ctx._programHasAttribPosition){
        throw new QuickDrawError(STR_ERROR_QUICK_DRAW_NO_ATTRIB_POSITION);
    }
    this._ctx.setVertexArray(this._vaoCubePoints);

    if(this._ctx._programHasAttribColor){
        this._ctx.setVertexBuffer(this._bufferCubePointsColor);
        const colors = this._ctx.getVertexBufferData();
        if(!Vec4.equals(colors,this._drawState.color)){
            ArrayUtil.fillv4(colors,this._drawState.color);
            this._ctx.updateVertexBufferData();
        }
    }

    if(scale !== undefined){
        this._ctx.pushModelMatrix();
        this._ctx.scale1(scale);
        this._ctx.drawArrays(this._ctx.POINTS,0,8);
        this._ctx.popModelMatrix();
    } else {
        this._ctx.drawArrays(this._ctx.POINTS,0,8);
    }
};

/**
 * Draws a stroked cube.
 * @param scale
 */
QuickDraw.prototype.drawCubeStroked = function(scale){
    if(!this._ctx._programHasAttribPosition){
        throw new QuickDrawError(STR_ERROR_QUICK_DRAW_NO_ATTRIB_POSITION);
    }
    this._ctx.setVertexArray(this._vaoCubeStroked);

    if(this._ctx._programHasAttribColor){
        this._ctx.setVertexBuffer(this._bufferCubeStrokedColor);
        const colors = this._ctx.getVertexBufferData();
        if(!Vec4.equals(colors,this._drawState.color)){
            ArrayUtil.fillv4(colors,this._drawState.color);
            this._ctx.updateVertexBufferData();
        }
    }

    if(scale !== undefined){
        this._ctx.pushModelMatrix();
        this._ctx.scale1(scale);
        this._ctx.drawElements(this._ctx.LINES,24);
        this._ctx.popModelMatrix();
    } else {
        this._ctx.drawElements(this._ctx.LINES,24);
    }
};

QuickDraw.prototype.drawSphere = function(){};

QuickDraw.prototype.drawSpherePoints = function(){};

QuickDraw.prototype.drawSphereStroked = function(){};

QuickDraw.prototype.drawCylinder = function(){};

/**
 * Draws a fullscreen rectangle.
 * @param size
 */
QuickDraw.prototype.drawFullscreenRect = function(size){
    if(size === undefined){
        this.drawFullscreenRect2(size[0],size[1]);
        return;
    }
    this.drawFullscreenRect2(size[0],size[1]);
};

/**
 * Draws a fullscreen rectangle.
 * @param width
 * @param height
 */
QuickDraw.prototype.drawFullscreenRect2 = function(width,height){
    width = width === undefined ? 1.0 : width;
    height = height === undefined ? 1.0 : height;
    this.drawScreenAlignedRect6(0,0,width,height,width,height);
};

/**
 * Draws a screen aligned rectangle.
 * @param pos
 * @param size
 * @param windowSize
 * @param topleft
 */
QuickDraw.prototype.drawScreenAlignedRect = function(pos,size,windowSize,topleft){
    this.drawScreenAlignedRect6(
        pos[0],pos[1],
        size[0],size[1],
        windowSize[0],windowSize[1],
        topleft
    );
};

/**
 * Draws a screen aligned rectangle.
 * @param x
 * @param y
 * @param width
 * @param height
 * @param windowWidth
 * @param windowHeight
 * @param topleft
 */
QuickDraw.prototype.drawScreenAlignedRect6 = function(x,y,width,height,windowWidth,windowHeight,topleft){
    if(!this._ctx._programHasAttribPosition){
        throw QuickDrawError(STR_ERROR_QUICK_DRAW_NO_ATTRIB_POSITION);
    }
    topleft = topleft === undefined ? true : topleft;
    this._ctx.pushMatrices();
    this._ctx.setWindowMatrices2(windowWidth,windowHeight,topleft);
    this._ctx.translate3(x,y,0);
    this.drawRect2(width,height);
    this._ctx.popMatrices();
};

QuickDraw.prototype.drawPivotAxes = function(axesLength,headLength){
    if(!this._ctx._programHasAttribPosition){
        throw new QuickDrawError(STR_ERROR_QUICK_DRAW_NO_ATTRIB_POSITION);
    }
    axesLength = axesLength === undefined ? 1.0 : axesLength;
    headLength = headLength === undefined ? 0.25 : headLength;

    this._colorPrev = Vec4.set(this._colorPrev,this._drawState.color);

    this.setDrawColor3(1,0,0);
    this.drawLine6(0,0,0,axesLength,0,0);
    this.setDrawColor3(0,1,0);
    this.drawLine6(0,0,0,0,axesLength,0);
    this.setDrawColor3(0,0,1);
    this.drawLine6(0,0,0,0,0,axesLength);

    const headSize = headLength * 0.35;
    const tubeSize = 0.025;
    const offset = axesLength - headLength;

    //tubes

    this._ctx.pushModelMatrix();
    this._ctx.rotateXYZ3(0,0,-Math.PI * 0.5);
    this._ctx.scale3(tubeSize,offset,tubeSize);
    this._drawTube(1,0,0,1);
    this._ctx.popModelMatrix();

    this._ctx.pushModelMatrix();
    this._ctx.scale3(tubeSize,offset,tubeSize);
    this._drawTube(0,1,0,1);
    this._ctx.popModelMatrix();

    this._ctx.pushModelMatrix();
    this._ctx.rotateXYZ3(Math.PI * 0.5,0,0);
    this._ctx.scale3(tubeSize,offset,tubeSize);
    this._drawTube(0,0,1,1);
    this._ctx.popModelMatrix();

    //heads

    this._ctx.pushModelMatrix();
    this._ctx.translate3(0,offset,0);
    this._ctx.scale3(headSize,headLength,headSize);
    this._drawHead(0,1,0,1);
    this._ctx.popModelMatrix();

    this._ctx.pushModelMatrix();
    this._ctx.translate3(offset,0,0);
    this._ctx.rotateXYZ3(0,0,-Math.PI*0.5);
    this._ctx.scale3(headSize,headLength,headSize);
    this._drawHead(1,0,0,1);
    this._ctx.popModelMatrix();

    this._ctx.pushModelMatrix();
    this._ctx.translate3(0,0,offset);
    this._ctx.rotateXYZ3(Math.PI*0.5,0,0);
    this._ctx.scale3(headSize,headLength,headSize);
    this._drawHead(0,0,1,1);
    this._ctx.popModelMatrix();

    this._drawState.color = Vec4.set(this._drawState.color,this._colorPrev);
};

/**
 * Draws axes and axes grids.
 * @param scale
 */
QuickDraw.prototype.drawCoordinateFrame = function(scale){};

QuickDraw.prototype.drawGizmoTranslation = function(){};

QuickDraw.prototype.drawGizmoRotation = function(){};

QuickDraw.prototype.drawQuat = function(){};

/**
 * Draws a vector.
 * @param vector
 */
QuickDraw.prototype.drawVector = function(vector){
    this.drawVector3(vector[0],vector[1],vector[2]);
};

/**
 * Draws a vector.
 * @param x
 * @param y
 * @param z
 */
QuickDraw.prototype.drawVector3 = function(x,y,z){
    if(!this._ctx._programHasAttribPosition){
        throw new QuickDrawError(STR_ERROR_QUICK_DRAW_NO_ATTRIB_POSITION);
    }
    this._ctx.pushModelMatrix();
    //this.rotateQuat(Quat.create)
    this._ctx.popModelMatrix();
};

/**
 * Draws a vector.
 * @param from
 * @param to
 */
QuickDraw.prototype.drawVectorFromTo = function(from,to){
    this.drawVectorFromTo6(
        from[0],from[1],from[2],
        to[0],to[1],to[2]
    );
};

/**
 * Draws a vector.
 * @param fromTo
 */
QuickDraw.prototype.drawVectorFromToFlat = function(fromTo){
    this.drawVectorFromTo6(
        fromTo[0],fromTo[1],fromTo[2],
        fromTo[3],fromTo[4],fromTo[5]
    );
};

/**
 * Draws a vector.
 * @param x0
 * @param y0
 * @param z0
 * @param x1
 * @param y1
 * @param z1
 */
QuickDraw.prototype.drawVectorFromTo6 = function(x0,y0,z0,x1,y1,z1){
    let x = x1 - x0;
    let y = y1 - y0;
    let z = z1 - z0;
    const d = 1.0 / (Math.sqrt(x * x + y * y + z * z) || 1.0);
    x *= d;
    y *= d;
    z *= d;
    this._ctx.pushModelMatrix();
    this._ctx.translate3(x0,y0,z0);
    this.drawVector3(x,y,z);
    this._ctx.popModelMatrix();
};

/**
 * Draws a grid.
 * @param size
 * @param subdivs
 */
QuickDraw.prototype.drawGrid = function(size, subdivs){
    this._drawGridInternal(size,subdivs,this._ctx.LINES);
};

/**
 * Draws points of grid.
 * @param size
 * @param subdivs
 */
QuickDraw.prototype.drawGridPoints = function(size, subdivs){
    this._drawGridInternal(size,subdivs,this._ctx.POINTS);
};

QuickDraw.prototype.drawDebugFrustum = function(){};

QuickDraw.prototype.drawDebugOnB = function(){};

QuickDraw.prototype.drawDebugRect = function(){};

QuickDraw.prototype.drawDebugAABB = function(){};

QuickDraw.prototype.drawDebugAABR = function(){};

QuickDraw.prototype.drawDebugRay = function(){};

QuickDraw.prototype.drawDebugPlane = function(){};

QuickDraw.prototype.drawDebugNormals = function(position,normals){

};

QuickDraw.prototype.drawDebugNormalsFlat = function(positions,normals){

};

/*--------------------------------------------------------------------------------------------------------------------*/
// OPTIONAL SHARED CONTEXT
/*--------------------------------------------------------------------------------------------------------------------*/

QuickDraw.prototype.makeShared = function(){
    QuickDraw.__sharedQuickDraw = this;
};

QuickDraw.sharedContext = function(){
    return QuickDraw.__sharedQuickDraw;
};

QuickDraw.__sharedQuickDraw = null;

/*--------------------------------------------------------------------------------------------------------------------*/
// EXPORT
/*--------------------------------------------------------------------------------------------------------------------*/

export default QuickDraw;