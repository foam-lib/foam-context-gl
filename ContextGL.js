import validateOption from 'validate-option';

import * as Mat33 from 'foam-math/Mat33';
import * as Mat44 from 'foam-math/Mat44';

import * as Vec2 from 'foam-math/Vec2';
import * as Vec3 from 'foam-math/Vec3';
import * as Vec4 from 'foam-math/Vec4';
import * as Quat from 'foam-math/Quat';
import * as Rect from 'foam-geom/Rect';

import * as ArrayUtil from 'foam-util/ArrayUtil';

import {
    ViewportState,
    CullingState,
    ScissorState,
    StencilState,
    DepthState,
    ColorState,
    LineWidthState,
    BlendState,
    DrawState,
    TextureState,
    VertexArrayBindingState
} from './State';

//Safari does not expose static WebGLRenderingContext constants
//TODO: remove and get internally needed static constants from instance,
//this should not be managed manually
import * as WebGLStaticConstants from  './Constants';

/*--------------------------------------------------------------------------------------------------------------------*/
// DEFINES
/*--------------------------------------------------------------------------------------------------------------------*/

const WEBGL_1_CONTEXT_IDS = ['webkit-3d','webgl','experimental-webgl'];
const WEBGL_2_CONTEXT_IDS = ['webgl2'];
const WEBGL_1_VERSION = 1;
const WEBGL_2_VERSION = 2;

function getWebGLRenderingContext(canvas,contextIds,options){
    for(let i = 0; i < contextIds.length; ++i){
        const gl = canvas.getContext(contextIds[i],options);
        if(gl){
            return gl;
        }
    }
    return null;
}

const GLEnumStringMap = {};
for(let key in WebGLStaticConstants){
    GLEnumStringMap[WebGLStaticConstants[key]] = key;
}

const INVALID_ID = null;

/**
 * The default config a context gets initialized with.
 * @type {Object}
 */
export const DefaultConfig = Object.freeze({
    //ContextGL specific
    warn : true,
    version: 1,
    fallback: true,
    //WebGLRenderingContext specific
    alpha : true,
    depth : true,
    stencil : false,
    antialias : true,
    premultipliedAlpha : true,
    preserveDrawingBuffer : false,
    failIfMajorPerformanceCaveat : false
});

// STATE BITS

/**
 * State bit for viewport
 * @type {number}
 */
const VIEWPORT_BIT = 1 << 0;
/**
 * State bit for cullFace, cullFaceMode
 * @type {number}
 */
const CULLING_BIT = 1 << 1;
/**
 * State but for scissorTest, scissor
 * @type {number}
 */
const SCISSOR_BIT = 1 << 2;
/**
 * State bit for stencilTest, stencilFunc, stencilFuncSeparate, stencilOp, stencilOpSeparate, clearStencil
 * @type {number}
 */
const STENCIL_BIT = 1 << 3;
/**
 * State bit for clearColor, colorMask
 * @type {number}
 */
const COLOR_BIT = 1 << 4;
/**
 * State bit for depthTest, depthMask, depthFunc, clearDepth, depthRange, polygonOffset
 * @type {number}
 */
const DEPTH_BIT = 1 << 5;
/**
 * State bit for line width.
 * @type {number}
 */
const LINE_WIDTH_BIT = 1 << 6;
/**
 * State bit for blend, blendColor, blendEquation, blendEquationSeparate, blendFunc, blendFuncSeparate
 * @type {number}
 */
const BLEND_BIT = 1 << 7;
/**
 * State bit for array buffer binding.
 * @type {number}
 */
const ARRAY_BUFFER_BINDING_BIT = 1 << 8;
/**
 * State bit for element array buffer binding.
 * @type {number}
 */
const ELEMENT_ARRAY_BUFFER_BINDING_BIT = 1 << 9;
/**
 * State bit for vertex array binding.
 * @type {number}
 */
const VERTEX_ARRAY_BINDING_BIT = 1 << 10;
/**
 * State bit for program binding.
 * @type {number}
 */
const PROGRAM_BINDING_BIT = 1 << 11;
/**
 * State bit for texture binding.
 * @type {number}
 */
const TEXTURE_BINDING_BIT = 1 << 12;
/**
 * State bit for framebuffer binding.
 * @type {number}
 */
const FRAMEBUFFER_BINDING_BIT = 1 << 13;
/**
 * State bit for projection matrix.
 * @type {number}
 */
const MATRIX_PROJECTION_BIT = 1 << 27;
/**
 * State bit for view matrix.
 * @type {number}
 */
const MATRIX_VIEW_BIT = 1 << 28;
/**
 * State bit for model matrix.
 * @type {number}
 */
const MATRIX_MODEL_BIT = 1 << 29;

const ALL_BIT = (1 << 30) - 1;

// MATRIX

const MATRIX_PROJECTION = 'matrixProjection';
const MATRIX_VIEW = 'matrixView';
const MATRIX_MODEL = 'matrixModel';
const MATRIX_NORMAL = 'matrixNormal';
const MATRIX_INVERSE_VIEW = 'matrixInverseView';

// PROGRAM

// uniforms

export const ProgramUniform = {
    PROJECTION_MATRIX : 'uProjectionMatrix',
    VIEW_MATRIX : 'uViewMatrix',
    MODEL_MATRIX : 'uModelMatrix',
    NORMAL_MATRIX : 'uNormalMatrix',
    INVERSE_VIEW_MATRIX : 'uInverseViewMatrix'
};

export const ProgramMatrixUniform = {
    PROJECTION_MATRIX : ProgramUniform.PROJECTION_MATRIX,
    VIEW_MATRIX : ProgramUniform.VIEW_MATRIX,
    MODEL_MATRIX : ProgramUniform.MODEL_MATRIX,
    NORMAL_MATRIX : ProgramUniform.NORMAL_MATRIX,
    INVERSE_VIEW_MATRIX : ProgramUniform.INVERSE_VIEW_MATRIX
};


export const ProgramUniformByMatrixTypeMap = {};
ProgramUniformByMatrixTypeMap[ProgramMatrixUniform.PROJECTION_MATRIX] = MATRIX_PROJECTION;
ProgramUniformByMatrixTypeMap[ProgramMatrixUniform.VIEW_MATRIX] = MATRIX_VIEW;
ProgramUniformByMatrixTypeMap[ProgramMatrixUniform.MODEL_MATRIX] = MATRIX_MODEL;
ProgramUniformByMatrixTypeMap[ProgramMatrixUniform.NORMAL_MATRIX] = MATRIX_NORMAL;
ProgramUniformByMatrixTypeMap[ProgramMatrixUniform.INVERSE_VIEW_MATRIX] = MATRIX_INVERSE_VIEW;

export const UNIFORM_NAME_POINT_SIZE = 'uPointSize';

// attributes

const ATTRIB_LOCATION_POSITION = 0;
const ATTRIB_LOCATION_COLOR = 1;
const ATTRIB_LOCATION_TEX_COORD = 2;
const ATTRIB_LOCATION_NORMAL = 3;

const ATTRIB_NAME_POSITION = 'aPosition';
const ATTRIB_NAME_COLOR = 'aColor';
const ATTRIB_NAME_TEX_COORD = 'aTexCoord';
const ATTRIB_NAME_NORMAL = 'aNormal;';

export const ProgramDefaultAttribLocationBinding = [
    {name:ATTRIB_NAME_POSITION, location:ATTRIB_LOCATION_POSITION},
    {name:ATTRIB_NAME_COLOR, location:ATTRIB_LOCATION_COLOR},
    {name:ATTRIB_NAME_TEX_COORD, location:ATTRIB_LOCATION_TEX_COORD},
    {name:ATTRIB_NAME_NORMAL, location:ATTRIB_LOCATION_NORMAL}
];

export const ProgramDefaultAttributeByLocationMap = {};
ProgramDefaultAttributeByLocationMap[ATTRIB_LOCATION_POSITION] = ATTRIB_NAME_POSITION;
ProgramDefaultAttributeByLocationMap[ATTRIB_LOCATION_COLOR] = ATTRIB_NAME_COLOR;
ProgramDefaultAttributeByLocationMap[ATTRIB_LOCATION_TEX_COORD] = ATTRIB_NAME_TEX_COORD;
ProgramDefaultAttributeByLocationMap[ATTRIB_LOCATION_NORMAL] = ATTRIB_NAME_NORMAL;

const STR_ERROR_INVALID_STACK_POP = 'Invalid stack pop. Stack has length 0.';

/*--------------------------------------------------------------------------------------------------------------------*/
// BLIT
/*--------------------------------------------------------------------------------------------------------------------*/

const glslBlitScreen = `
#ifdef VERTEX_SHADER
precision highp float;
attribute vec4 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;
uniform vec2 uScreenSize;

void main(){
    vTexCoord = aTexCoord;
    gl_Position = -1.0 + aPosition * 2.0;
}
#endif
#ifdef FRAGMENT_SHADER
precision highp float;
varying vec2 vTexCoord;
uniform sampler2D uTexture;

uniform vec4 uOffsetScale;

void main(){
    vec2 offset   = uOffsetScale.xy;
    vec2 scale    = uOffsetScale.zw;
    vec2 texCoord = offset + vTexCoord * scale;
    gl_FragColor = texture2D(uTexture,texCoord);
}
#endif
`;

/*--------------------------------------------------------------------------------------------------------------------*/
// UTILS & TEMPS
/*--------------------------------------------------------------------------------------------------------------------*/

function strWrongNumArgs(has,expectedMust, expectedOpt){
    return `Wrong number of arguments. Expected ${expectedMust + expectedOpt === undefined ? ' or ' + expectedOpt : ''}, has ${has}.`;
}

/**
 * Converts a GL parameter array object to a js array.
 * @param obj
 * @returns {*}
 */
export function glObjToArray(obj){
    if(Array.isArray(obj)){
        return obj;
    }
    var out = new Array(Object.keys(obj).length);
    for(var entry in obj){
        out[+entry] = obj[entry];
    }
    return out;
}

/**
 * Returns a string representation of a gl constant / enum.
 * @param enum_
 * @returns {*}
 */
export function glEnumToString(enum_){
    return GLEnumStringMap[enum_] || enum_;
}

/**
 * Throws an error if the passed context`s active program does not match the program passed.
 * @param ctx
 * @param program
 */
export function assertProgramBinding(ctx,program){
    if(ctx.getProgram() !== program){
        throw new ProgramError(`Program with id ${program} not active.`);
    }
}

const VEC2_ZERO = [0,0];
const VEC2_ONE = [1,1];
const AXIS_Y = [0,1,0];

const TEMP_VEC2_0 = [0,0];
const TEMP_RECT_0 = [0,0,0,0];

/*--------------------------------------------------------------------------------------------------------------------*/
// CONSTRUCTOR
/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * A ContextGL representation.
 * @param canvas
 * @param options
 * @constructor
 */
function ContextGL(canvas,options){
    options = validateOption(options,DefaultConfig);

    if(options.version !== WEBGL_1_VERSION &&
       options.version !== WEBGL_2_VERSION){
        throw new Error(`Invalid context version ${options.version}.`);
    }

    /*----------------------------------------------------------------------------------------------------------------*/
    // gl
    /*----------------------------------------------------------------------------------------------------------------*/

    this._glVersion = -1;
    this._gl = null;

    //capabiliies for context version
    let glCapabilities;

    //WebGLRenderingContext
    if(options.version === WEBGL_1_VERSION){
        glCapabilities = {
            INSTANCED_ARRAYS : false,
            VERTEX_ARRAYS : false,
            ELEMENT_INDEX_UINT : false,
            DRAW_BUFFERS:  false,
            DEPTH_TEXTURE : false,
            FLOAT_TEXTURE : false,
            HALF_FLOAT: false,
            FLOAT_TEXTURE_LINEAR: false,
            HALF_FLOAT_TEXTURE_LINEAR : false
        };
        this._glVersion = options.version;
        this._gl = getWebGLRenderingContext(canvas,WEBGL_1_CONTEXT_IDS,options);

    //WebGL2RenderingContext
    } else {
        glCapabilities = {
            DEPTH_TEXTURE : false,
            FLOAT_TEXTURE : false,
            HALF_FLOAT : false,
            FLOAT_TEXTURE_LINEAR : false,
            HALF_FLOAT_TEXTURE_LINEAR : false
        };
        this._glVersion = options.version;
        this._gl = getWebGLRenderingContext(canvas,WEBGL_2_CONTEXT_IDS,options);

        //not available, use allowed fallback version
        if(!this._gl && options.fallback){
            this._glVersion = WEBGL_1_VERSION;
            this._gl = getWebGLRenderingContext(canvas,WEBGL_1_CONTEXT_IDS,options);
        }
    }

    //WebGLRenderingContext creation failed
    if(!this._gl){
        const msgFallback = options.version === WEBGL_2_VERSION ? !options.fallback ? ' No fallback set.' : ' Fallback version 1 not available.' : '';
        const msgError = `ContextGL not available. Requested WebGL version ${options.version} not available.${msgFallback}`;
        throw new Error(msgError);
    }

    if(options.warn && this._glVersion !== options.version){
        console.info('Requested WebGL version 2 not available. Using fallback version 1.');
    }

    // check config request
    if(options.warn){
        const contextAttributes = this._gl.getContextAttributes();
        for(let option in options){
            if(option === 'warn' || option === 'version' || option === 'fallback'){
                continue;
            }
            if(options[option] !== contextAttributes[option]){
                console.warn(`${option} requested but not available.`);
            }
        }
    }

    // EXTENSIONS

    // instanced arrays
    if(!this._gl.drawElementsInstanced){
        const ext = this._gl.getExtension('ANGLE_instanced_arrays');
        if(!ext){
            this._gl.drawElementsInstanced =
            this._gl.drawArraysInstanced =
            this._gl.vertexAttribDivisor = function(){
                throw new Error('ANGLE_instanced_arrays not supported.');
            };
        } else {
            this._gl.drawElementsInstanced = ext.drawElementsInstancedANGLE.bind(ext);
            this._gl.drawArraysInstanced = ext.drawArraysInstancedANGLE.bind(ext);
            this._gl.vertexAttribDivisor = ext.vertexAttribDivisorANGLE.bind(ext);
            glCapabilities.INSTANCED_ARRAYS = true;
        }
    }

    //vertex arrays
    if(!this._gl.createVertexArray){
        const ext = this._gl.getExtension('OES_vertex_array_object');
        if(!ext){
            this.createVertexArray = this._createVertexArrayShim;
            this.deleteVertexArray = this._deleteVertexArrayShim;
            this.setVertexArray = this._setVertexArrayShim;
            this.invalidateVertexArray = this._invalidateVertexArrayShim;
        } else {
            this._gl.VERTEX_ARRAY_BINDING = ext.VERTEX_ARRAY_BINDING_OES;
            this._gl.createVertexArray = ext.createVertexArrayOES.bind(ext);
            this._gl.deleteVertexArray = ext.deleteVertexArrayOES.bind(ext);
            this._gl.bindVertexArray = ext.bindVertexArrayOES.bind(ext);
            this.createVertexArray = this._createVertexArrayNative;
            this.deleteVertexArray = this._deleteVertexArrayNative;
            this.setVertexArray = this._setVertexArrayNative;
            this.invalidateVertexArray = this._invalidateVertexArrayNative;
            glCapabilities.VERTEX_ARRAYS = true;
        }
    } else {
        this.createVertexArray = this._createVertexArrayNative;
        this.deleteVertexArray = this._deleteVertexArrayNative;
        this.setVertexArray = this._setVertexArrayNative;
        this.invalidateVertexArray = this._invalidateVertexArrayNative;
    }

    //draw buffers, no shim
    if(!this._gl.drawBuffers){
        const ext = this._gl.getExtension('WEBGL_draw_buffers');
        let maxDrawBuffers = 1;
        let maxColorAttachments = 1;
        if(ext){
            maxDrawBuffers = this._gl.getParameter(ext.MAX_DRAW_BUFFERS_WEBGL);
            maxColorAttachments = this._gl.getParameter(ext.MAX_COLOR_ATTACHMENTS_WEBGL);
            this._gl.drawBuffers = ext.drawBuffersWEBGL.bind(ext);
            this._setFramebufferColorAttachment = this._setFramebufferColorAttachmentDrawBuffersSupported;
            this.drawBuffers = this._drawBuffersSupported;
            glCapabilities.DRAW_BUFFERS = true;
        } else {
            this._setFramebufferColorAttachment = this._setFramebufferColorAttachmentDrawBuffersNotSupported;
            this.drawBuffers = this._drawBuffersNotSupported;
        }
        this.MAX_DRAW_BUFFERS = maxDrawBuffers;
        this.MAX_COLOR_ATTACHMENTS = maxColorAttachments;
    } else {
        this.MAX_DRAW_BUFFERS = this._gl.MAX_DRAW_BUFFERS;
        this.MAX_COLOR_ATTACHMENTS = this._gl.MAX_COLOR_ATTACHMENTS;
        this._setFramebufferColorAttachment = this._setFramebufferColorAttachmentDrawBuffersSupported;
        this.drawBuffers = this._drawBuffersSupported;
    }

    //depth texture, no shim
    //TODO: angle?
    const extDepthTexture = this._gl.getExtension('WEBGL_depth_texture');
    if(extDepthTexture){
        this.UNSIGNED_INT_24_8 = extDepthTexture.UNSIGNED_INT_24_8_WEBGL;
    }
    glCapabilities.DEPTH_TEXTURE = !!extDepthTexture;

    //float texture
    const extFloatTexture = this._gl.getExtension('OES_texture_float');
    glCapabilities.FLOAT_TEXTURE = !!extFloatTexture;

    //half float texture
    if(!this._gl.HALF_FLOAT){
        const ext = this._gl.getExtension('OES_texture_half_float');
        if(ext){
            this.HALF_FLOAT = ext.HALF_FLOAT_OES;
        }
        glCapabilities.HALF_FLOAT = !!ext;
    } else {
        this.HALF_FLOAT = this._gl.HALF_FLOAT;
    }

    //float texture linear
    const extFloatTextureLinear = this._gl.getExtension('OES_texture_float_linear');
    glCapabilities.FLOAT_TEXTURE_LINEAR = !!extFloatTextureLinear;

    //half float texture linear
    const extHalfFloatTextureLinear = this._gl.getExtension('OES_texture_half_float_linear');
    glCapabilities.HALF_FLOAT_TEXTURE_LINEAR = !!extHalfFloatTextureLinear;

    //anisotropy
    glCapabilities.ELEMENT_INDEX_UINT = !!this._gl.getExtension('OES_element_index_uint');
    this._glCapabilites = Object.freeze(glCapabilities);

    /*----------------------------------------------------------------------------------------------------------------*/
    // Overall
    /*----------------------------------------------------------------------------------------------------------------*/

    //internal object counter, with offset for internal ids
    this._uid = 64;
    this._mask = -1;
    this._maskStack = [];

    this._clearBitMap = {};
    this._clearBitMap[DEPTH_BIT] = this._gl.DEPTH_BUFFER_BIT;
    this._clearBitMap[COLOR_BIT] = this._gl.COLOR_BUFFER_BIT;
    this._clearBitMap[STENCIL_BIT] = this._gl.STENCIL_BUFFER_BIT;
    this._clearBitMap[DEPTH_BIT | COLOR_BIT] = this._gl.DEPTH_BUFFER_BIT | this._gl.COLOR_BUFFER_BIT;
    this._clearBitMap[DEPTH_BIT | STENCIL_BIT] = this._gl.DEPTH_BUFFER_BIT | this._gl.STENCIL_BUFFER_BIT;
    this._clearBitMap[COLOR_BIT | STENCIL_BIT] = this._gl.COLOR_BUFFER_BIT | this._gl.STENCIL_BUFFER_BIT;

    this.ALL_BIT = ALL_BIT;

    this.ALIASED_LINE_WIDTH_RANGE = glObjToArray(this._gl.getParameter(this._gl.ALIASED_LINE_WIDTH_RANGE));
    this.ALIASED_POINT_SIZE_RANGE = glObjToArray(this._gl.getParameter(this._gl.ALIASED_POINT_SIZE_RANGE));

    /*----------------------------------------------------------------------------------------------------------------*/
    // Viewport
    /*----------------------------------------------------------------------------------------------------------------*/

    this.VIEWPORT_BIT = VIEWPORT_BIT;
    this._viewportState = new ViewportState(glObjToArray(this._gl.getParameter(this._gl.VIEWPORT)).slice(0, 4));
    this._viewportStack = [];

    /*----------------------------------------------------------------------------------------------------------------*/
    // Culling
    /*----------------------------------------------------------------------------------------------------------------*/

    this.CULLING_BIT = CULLING_BIT;
    this._cullingState = new CullingState(
        this._gl.getParameter(this._gl.CULL_FACE),
        this._gl.getParameter(this._gl.CULL_FACE_MODE)
    );
    this._cullingStateDefault = this._cullingState.copy();
    this._cullStack = [];

    this.FRONT = this._gl.FRONT;
    this.BACK = this._gl.BACK;
    this.FRONT_AND_BACK = this._gl.FRONT_AND_BACK;

    /*----------------------------------------------------------------------------------------------------------------*/
    // Scissor
    /*----------------------------------------------------------------------------------------------------------------*/

    this.SCISSOR_BIT = SCISSOR_BIT;
    this._scissorState = new ScissorState(
        this._gl.getParameter(this._gl.SCISSOR_TEST),
        glObjToArray(this._gl.getParameter(this._gl.SCISSOR_BOX)).slice(0, 4)
    );
    this._scissorStateDefault = this._scissorState.copy();
    this._scissorStack = [];

    /*----------------------------------------------------------------------------------------------------------------*/
    // Stencil
    /*----------------------------------------------------------------------------------------------------------------*/

    this.STENCIL_BIT = STENCIL_BIT;
    this._stencilState = new StencilState(
        this._gl.getParameter(this._gl.STENCIL_TEST),[
            //front
            this._gl.getParameter(this._gl.STENCIL_FUNC),
            this._gl.getParameter(this._gl.STENCIL_REF),
            this._gl.getParameter(this._gl.STENCIL_VALUE_MASK),
            //back
            this._gl.getParameter(this._gl.STENCIL_FUNC),
            this._gl.getParameter(this._gl.STENCIL_REF),
            this._gl.getParameter(this._gl.STENCIL_VALUE_MASK)
        ], [
            //front
            this._gl.getParameter(this._gl.STENCIL_FAIL),
            this._gl.getParameter(this._gl.STENCIL_PASS_DEPTH_FAIL),
            this._gl.getParameter(this._gl.STENCIL_PASS_DEPTH_PASS),
            //back
            this._gl.getParameter(this._gl.STENCIL_FAIL),
            this._gl.getParameter(this._gl.STENCIL_PASS_DEPTH_FAIL),
            this._gl.getParameter(this._gl.STENCIL_PASS_DEPTH_PASS)
        ]
    );
    this._stencilStateDefault = this._stencilState.copy();
    this._stencilStack = [];

    this.NEVER = this._gl.NEVER;
    this.LESS = this._gl.LESS;
    this.LEQUAL = this._gl.LEQUAL;
    this.GREATER = this._gl.GREATER;
    this.GEQUAL = this._gl.GEQUAL;
    this.EQUAL = this._gl.EQUAL;
    this.NOTEQUAL = this._gl.NOTEQUAL;
    this.ALWAYS = this._gl.ALWAYS;

    this.KEEP = this._gl.KEEP;
    this.REPLACE = this._gl.REPLACE;
    this.INCR = this._gl.INCR;
    this.INCR_WRAP = this._gl.INCR_WRAP;
    this.DECR = this._gl.DECR;
    this.DECR_WRAP = this._gl.DECR_WRAP;
    this.INVERT = this._gl.INVERT;
    this.REPLACE = this._gl.REPLACE;

    /*----------------------------------------------------------------------------------------------------------------*/
    // Depth
    /*----------------------------------------------------------------------------------------------------------------*/

    this.DEPTH_BIT = DEPTH_BIT;
    this._depthState = new DepthState(
        this._gl.getParameter(this._gl.DEPTH_TEST),
        this._gl.getParameter(this._gl.DEPTH_WRITEMASK),
        this._gl.getParameter(this._gl.DEPTH_FUNC),
        this._gl.getParameter(this._gl.DEPTH_CLEAR_VALUE),
        glObjToArray(this._gl.getParameter(this._gl.DEPTH_RANGE)).slice(0, 2),[
            this._gl.getParameter(this._gl.POLYGON_OFFSET_FACTOR),
            this._gl.getParameter(this._gl.POLYGON_OFFSET_UNITS)
        ]
    );
    this._depthStateDefault = this._depthState.copy();
    this._depthStack = [];

    /*----------------------------------------------------------------------------------------------------------------*/
    // Color
    /*----------------------------------------------------------------------------------------------------------------*/

    this.COLOR_BIT = COLOR_BIT;
    this._colorState = new ColorState(
        glObjToArray(this._gl.getParameter(this._gl.COLOR_CLEAR_VALUE)),
        glObjToArray(this._gl.getParameter(this._gl.COLOR_WRITEMASK))
    );
    this._colorStateDefault = this._colorState.copy();
    this._colorStack = [];

    /*----------------------------------------------------------------------------------------------------------------*/
    // Line Width
    /*----------------------------------------------------------------------------------------------------------------*/

    this.LINE_WIDTH_BIT = LINE_WIDTH_BIT;
    this._lineWidthState = new LineWidthState(this._gl.getParameter(this._gl.LINE_WIDTH));
    this._lineWidthStateDefault = this._lineWidthState.copy();
    this._lineWidthStack = [];

    /*----------------------------------------------------------------------------------------------------------------*/
    // Blend
    /*----------------------------------------------------------------------------------------------------------------*/

    this.BLEND_BIT = BLEND_BIT;
    this._blendState = new BlendState(
        this._blend = this._gl.getParameter(this._gl.BLEND),
        glObjToArray(this._gl.getParameter(this._gl.BLEND_COLOR)).slice(0, 4),[
            this._gl.getParameter(this._gl.BLEND_EQUATION_RGB),
            this._gl.getParameter(this._gl.BLEND_EQUATION_ALPHA)
        ],[
            this._gl.getParameter(this._gl.BLEND_SRC_RGB),
            this._gl.getParameter(this._gl.BLEND_DST_RGB),
            this._gl.getParameter(this._gl.BLEND_SRC_ALPHA),
            this._gl.getParameter(this._gl.BLEND_DST_ALPHA)
        ]
    );
    this._blendStateDefault = this._blendState.copy();
    this._blendStack = [];

    this.FUNC_ADD = this._gl.FUNC_ADD;
    this.FUNC_SUBTRACT = this._gl.FUNC_SUBTRACT;
    this.FUNC_REVERSE_SUBTRACT = this._gl.FUNC_REVERSE_SUBTRACT;
    this.ZERO = this._gl.ZERO;
    this.ONE = this._gl.ONE;
    this.SRC_COLOR = this._gl.SRC_COLOR;
    this.ONE_MINUS_SRC_COLOR = this._gl.ONE_MINUS_SRC_COLOR;
    this.DST_COLOR = this._gl.DST_COLOR;
    this.ONE_MINUS_DST_COLOR = this._gl.ONE_MINUS_DST_COLOR;
    this.SRC_ALPHA = this._gl.SRC_ALPHA;
    this.ONE_MINUS_SRC_ALPHA = this._gl.ONE_MINUS_SRC_ALPHA;
    this.DST_ALPHA = this._gl.DST_ALPHA;
    this.ONE_MINUS_DST_ALPHA = this._gl.ONE_MINUS_DST_ALPHA;
    this.SRC_ALPHA_SATURATE = this._gl.SRC_ALPHA_SATURATE;
    this.CONSTANT_COLOR = this._gl.CONSTANT_COLOR;
    this.ONE_MINUS_CONSTANT_COLOR = this._gl.ONE_MINUS_CONSTANT_COLOR;
    this.CONSTANT_ALPHA = this._gl.CONSTANT_ALPHA;
    this.ONE_MINUS_CONSTANT_ALPHA = this._gl.ONE_MINUS_CONSTANT_ALPHA;

    /*----------------------------------------------------------------------------------------------------------------*/
    // Program
    /*----------------------------------------------------------------------------------------------------------------*/

    this.PROGRAM_BINDING_BIT = PROGRAM_BINDING_BIT;
    this._programs = {};
    this._programActive = null;
    this._programStack = [];

    this.UNIFORM_PROJECTION_MATRIX = ProgramMatrixUniform.PROJECTION_MATRIX;
    this.UNIFORM_VIEW_MATRIX = ProgramMatrixUniform.VIEW_MATRIX;
    this.UNIFORM_MODEL_MATRIX = ProgramMatrixUniform.MODEL_MATRIX;
    this.UNIFORM_NORMAL_MATRIX = ProgramMatrixUniform.NORMAL_MATRIX;
    this.UNIFORM_INVERSE_VIEW_MATRIX = ProgramMatrixUniform.INVERSE_VIEW_MATRIX;

    this.ATTRIB_LOCATION_POSITION =  ATTRIB_LOCATION_POSITION;
    this.ATTRIB_LOCATION_COLOR = ATTRIB_LOCATION_COLOR;
    this.ATTRIB_LOCATION_TEX_COORD = ATTRIB_LOCATION_TEX_COORD;
    this.ATTRIB_LOCATION_NORMAL = ATTRIB_LOCATION_NORMAL;

    this.ATTRIB_NAME_POSITION = ATTRIB_NAME_POSITION;
    this.ATTRIB_NAME_COLOR = ATTRIB_NAME_COLOR;
    this.ATTRIB_NAME_TEX_COORD = ATTRIB_NAME_TEX_COORD;
    this.ATTRIB_NAME_NORMAL = ATTRIB_NAME_NORMAL;

    this.MAX_VERTEX_ATTRIBS = this._gl.getParameter(this._gl.MAX_VERTEX_ATTRIBS);
    this.MAX_VERTEX_UNIFORM_VECTORS = this._gl.getParameter(this._gl.MAX_VERTEX_UNIFORM_VECTORS);
    this.MAX_VERTEX_TEXTURE_IMAGE_UNITS = this._gl.getParameter(this._gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
    this.MAX_VARYING_VECTORS = this._gl.getParameter(this._gl.MAX_VARYING_VECTORS);
    this.MAX_FRAGMENT_UNIFORM_VECTORS = this._gl.getParameter(this._gl.MAX_FRAGMENT_UNIFORM_VECTORS);
    console.assert(this.getGLError());

    /*----------------------------------------------------------------------------------------------------------------*/
    // Buffers
    /*----------------------------------------------------------------------------------------------------------------*/

    this.ARRAY_BUFFER_BINDING_BIT = ARRAY_BUFFER_BINDING_BIT;
    this.ELEMENT_ARRAY_BUFFER_BINDING_BIT = ELEMENT_ARRAY_BUFFER_BINDING_BIT;
    this._buffers = {};
    this._buffers[this._gl.ARRAY_BUFFER] = {};
    this._buffers[this._gl.ELEMENT_ARRAY_BUFFER] = {};
    this._bufferActive = {};
    this._bufferActive[this._gl.ARRAY_BUFFER] = INVALID_ID;
    this._bufferActive[this._gl.ELEMENT_ARRAY_BUFFER] = INVALID_ID;
    this._bufferStack = {};
    this._bufferStack[this._gl.ARRAY_BUFFER] = [];
    this._bufferStack[this._gl.ELEMENT_ARRAY_BUFFER] = [];

    this.STATIC_DRAW = this._gl.STATIC_DRAW;
    this.DYNAMIC_DRAW = this._gl.DYNAMIC_DRAW;
    this.STREAM_DRAW = this._gl.STREAM_DRAW;

    this.ARRAY_BUFFER = this._gl.ARRAY_BUFFER;
    this.ELEMENT_ARRAY_BUFFER = this._gl.ELEMENT_ARRAY_BUFFER;

    this.BYTE = this._gl.BYTE;
    this.UNSIGNED_BYTE = this._gl.UNSIGNED_BYTE;
    this.SHORT = this._gl.SHORT;
    this.UNSIGNED_SHORT = this._gl.UNSIGNED_SHORT;
    this.INT = this._gl.INT;
    this.UNSIGNED_INT = this._gl.UNSIGNED_INT;
    this.FLOAT = this._gl.FLOAT;

    /*----------------------------------------------------------------------------------------------------------------*/
    // Vertex Arrays
    /*----------------------------------------------------------------------------------------------------------------*/

    this.VERTEX_ARRAY_BINDING_BIT = VERTEX_ARRAY_BINDING_BIT;

    this._vertexArrays = {};
    this._vertexArrayState = new VertexArrayBindingState(INVALID_ID);
    this._vertexArrayHasIndexBuffer = false;
    this._vertexArrayIndexBufferDataType = null;
    this._vertexArrayHasDivisor = false;

    this._vertexArrayStack = [];

    /*----------------------------------------------------------------------------------------------------------------*/
    // Texture2d & TextureCube
    /*----------------------------------------------------------------------------------------------------------------*/

    this.TEXTURE_BINDING_BIT = TEXTURE_BINDING_BIT;
    this.MAX_TEXTURE_IMAGE_UNITS = this._gl.getParameter(this._gl.MAX_TEXTURE_IMAGE_UNITS);

    this._textures = {};
    this._textureState = new TextureState(new Array(this.MAX_TEXTURE_IMAGE_UNITS),0);
    this._textureStack = [];

    this.NEAREST = this._gl.NEAREST;
    this.LINEAR = this._gl.LINEAR;
    this.NEAREST_MIPMAP_NEAREST = this._gl.NEAREST_MIPMAP_NEAREST;
    this.LINEAR_MIPMAP_NEAREST = this._gl.LINEAR_MIPMAP_NEAREST;
    this.NEAREST_MIPMAP_LINEAR = this._gl.NEAREST_MIPMAP_LINEAR;
    this.LINEAR_MIPMAP_LINEAR = this._gl.LINEAR_MIPMAP_LINEAR;
    this.TEXTURE_MAG_FILTER = this._gl.TEXTURE_MAG_FILTER;
    this.TEXTURE_MIN_FILTER = this._gl.TEXTURE_MIN_FILTER;
    this.TEXTURE_WRAP_S = this._gl.TEXTURE_WRAP_S;
    this.TEXTURE_WRAP_T = this._gl.TEXTURE_WRAP_T;
    this.TEXTURE_2D = this._gl.TEXTURE_2D;
    this.TEXTURE = this._gl.TEXTURE;
    this.TEXTURE_CUBE_MAP = this._gl.TEXTURE_CUBE_MAP;
    this.TEXTURE_BINDING_CUBE_MAP = this._gl.TEXTURE_BINDING_CUBE_MAP;
    this.TEXTURE_CUBE_MAP_POSITIVE_X = this._gl.TEXTURE_CUBE_MAP_POSITIVE_X;
    this.TEXTURE_CUBE_MAP_NEGATIVE_X = this._gl.TEXTURE_CUBE_MAP_NEGATIVE_X;
    this.TEXTURE_CUBE_MAP_POSITIVE_Y = this._gl.TEXTURE_CUBE_MAP_POSITIVE_Y;
    this.TEXTURE_CUBE_MAP_NEGATIVE_Y = this._gl.TEXTURE_CUBE_MAP_NEGATIVE_Y;
    this.TEXTURE_CUBE_MAP_POSITIVE_Z = this._gl.TEXTURE_CUBE_MAP_POSITIVE_Z;
    this.TEXTURE_CUBE_MAP_NEGATIVE_Z = this._gl.TEXTURE_CUBE_MAP_NEGATIVE_Z;
    this.MAX_CUBE_MAP_TEXTURE_SIZE = this._gl.MAX_CUBE_MAP_TEXTURE_SIZE;
    this.TEXTURE0 = this._gl.TEXTURE0;
    this.REPEAT = this._gl.REPEAT;
    this.CLAMP_TO_EDGE = this._gl.CLAMP_TO_EDGE;
    this.MIRRORED_REPEAT = this._gl.MIRRORED_REPEAT;

    this.MAX_TEXTURE_SIZE = this._gl.getParameter(this._gl.MAX_TEXTURE_SIZE);
    this.MAX_CUBE_MAP_TEXTURE_SIZE = this._gl.getParameter(this._gl.MAX_CUBE_MAP_TEXTURE_SIZE);
    this.MAX_COMBINED_TEXTURE_IMAGE_UNITS = this._gl.getParameter(this._gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
    
    this.ALPHA = this._gl.ALPHA;
    this.RGB = this._gl.RGB;
    this.RGBA = this._gl.RGBA;
    
    console.assert(this.getGLError());

    /*----------------------------------------------------------------------------------------------------------------*/
    // Renderbuffers
    /*----------------------------------------------------------------------------------------------------------------*/

    this._renderbuffers = {};

    /*----------------------------------------------------------------------------------------------------------------*/
    // Framebuffers
    /*----------------------------------------------------------------------------------------------------------------*/

    this.FRAMEBUFFER_BINDING_BIT = FRAMEBUFFER_BINDING_BIT;
    this._framebuffers = {};
    this._framebufferActive = null;
    this._framebufferStack = [];

    //max color buffers
    this.RED_BITS = this._gl.getParameter(this._gl.RED_BITS);
    this.GREEN_BITS = this._gl.getParameter(this._gl.GREEN_BITS);
    this.BLUE_BITS = this._gl.getParameter(this._gl.BLUE_BITS);
    this.ALPHA_BITS = this._gl.getParameter(this._gl.ALPHA_BITS);
    this.DEPTH_BITS = this._gl.getParameter(this._gl.DEPTH_BITS);
    this.STENCIL_BITS = this._gl.getParameter(this._gl.STENCIL_BITS);
    this.MAX_RENDERBUFFER_SIZE = this._gl.getParameter(this._gl.MAX_RENDERBUFFER_SIZE);
    this.MAX_VIEWPORT_DIMS = glObjToArray(this._gl.getParameter(this._gl.MAX_VIEWPORT_DIMS));
    console.assert(this.getGLError());

    this.DEPTH_ATTACHMENT = this._gl.DEPTH_ATTACHMENT;
    this.DEPTH_STENCIL_ATTACHMENT = this._gl.DEPTH_STENCIL_ATTACHMENT;
    this.DEPTH_COMPONENT = this._gl.DEPTH_COMPONENT;
    this.DEPTH_STENCIL = this._gl.DEPTH_STENCIL;
    this.COLOR_ATTACHMENT0 = this._gl.COLOR_ATTACHMENT0;

    /*----------------------------------------------------------------------------------------------------------------*/
    // Matrix
    /*----------------------------------------------------------------------------------------------------------------*/

    this.MATRIX_PROJECTION_BIT = MATRIX_PROJECTION_BIT;
    this.MATRIX_VIEW_BIT = MATRIX_VIEW_BIT;
    this.MATRIX_MODEL_BIT = MATRIX_MODEL_BIT;

    this._matrix = {};
    this._matrix[MATRIX_PROJECTION] = Mat44.create();
    this._matrix[MATRIX_VIEW] = Mat44.create();
    this._matrix[MATRIX_MODEL] = Mat44.create();
    this._matrix[MATRIX_NORMAL] = Mat33.create();
    this._matrix[MATRIX_INVERSE_VIEW] = Mat44.create();

    this._matrixStack = {};
    this._matrixStack[MATRIX_PROJECTION_BIT] = [];
    this._matrixStack[MATRIX_VIEW_BIT] = [];
    this._matrixStack[MATRIX_MODEL_BIT] = [];

    this._matrixTypeByUniformNameMap = {};
    this._matrixTypeByUniformNameMap[ProgramMatrixUniform.PROJECTION_MATRIX] = MATRIX_PROJECTION;
    this._matrixTypeByUniformNameMap[ProgramMatrixUniform.VIEW_MATRIX] = MATRIX_VIEW;
    this._matrixTypeByUniformNameMap[ProgramMatrixUniform.MODEL_MATRIX] = MATRIX_MODEL;
    this._matrixTypeByUniformNameMap[ProgramMatrixUniform.NORMAL_MATRIX] = MATRIX_NORMAL;
    this._matrixTypeByUniformNameMap[ProgramMatrixUniform.INVERSE_VIEW_MATRIX] = MATRIX_INVERSE_VIEW;

    // MATRIX TEMP

    this._matrix44Temp = Mat44.create();
    this._matrix44TempF32 = new Float32Array(16);
    this._matrix33TempF32 = new Float32Array(9);

    this._matrixTempByTypeMap = {};
    this._matrixTempByTypeMap[MATRIX_PROJECTION] =
    this._matrixTempByTypeMap[MATRIX_VIEW] =
    this._matrixTempByTypeMap[MATRIX_MODEL] =
    this._matrixTempByTypeMap[MATRIX_INVERSE_VIEW] = this._matrix44TempF32;
    this._matrixTempByTypeMap[MATRIX_NORMAL] = this._matrix33TempF32;

    this._matrixSend = {};
    this._matrixSend[MATRIX_PROJECTION] = false;
    this._matrixSend[MATRIX_VIEW] = false;
    this._matrixSend[MATRIX_MODEL] = false;
    this._matrixSend[MATRIX_NORMAL] = false;
    this._matrixSend[MATRIX_INVERSE_VIEW] = false;

    this._matrixTypesByUniformInProgram = {};
    this._matrixTypesByUniformInProgramToUpdate = {};

    /*----------------------------------------------------------------------------------------------------------------*/
    // Data Types & Sizes
    /*----------------------------------------------------------------------------------------------------------------*/

    this.POINTS = this._gl.POINTS;
    this.LINES = this._gl.LINES;
    this.LINE_STRIP = this._gl.LINE_STRIP;
    this.LINE_LOOP = this._gl.LINE_LOOP;
    this.TRIANGLES = this._gl.TRIANGLES;
    this.TRIANGLE_STRIP = this._gl.TRIANGLE_STRIP;
    this.TRIANGLE_FAN = this._gl.TRIANGLE_FAN;

    this.SIZE_VEC2 = 2;
    this.SIZE_VEC3 = 3;
    this.SIZE_VEC4 = 4;

    /*----------------------------------------------------------------------------------------------------------------*/
    // Quickdraw
    /*----------------------------------------------------------------------------------------------------------------*/

    this._programHasAttribPosition = false;
    this._programHasAttribNormal = false;
    this._programHasAttribColor = false;
    this._programHasAttribTexCoord = false;
    this._programHasUniformPointSize = false;


    /*----------------------------------------------------------------------------------------------------------------*/
    // Blit
    /*----------------------------------------------------------------------------------------------------------------*/

    //blit
    this._bufferBlitRectPosition = this.createVertexBuffer(
        new Float32Array([0,0, 1,0, 1,1, 0,1]),this.STATIC_DRAW,false
    );
    this._bufferBlitRectTexCoord = this.createVertexBuffer(
        new Float32Array([0,0, 1,0, 1,1, 0,1]),this.DYNAMIC_DRAW,true
    );
    this._vertexArrayBlitRect = this.createVertexArray([
        {location: this.ATTRIB_LOCATION_POSITION, buffer: this._bufferBlitRectPosition, size: this.SIZE_VEC2},
        {location: this.ATTRIB_LOCATION_TEX_COORD, buffer: this._bufferBlitRectTexCoord, size: this.SIZE_VEC2}
    ]);

    this._programBlit = this.createProgram(glslBlitScreen);
    this.pushProgramBinding();
        this.setProgram(this._programBlit);
        this.setProgramUniform('uTexture',0);
        this.setProgramUniform('uOffsetScale',0,0,1,1);
    this.popProgramBinding();
}

/**
 * @example
 * console.assert(ctx.getGLError());
 * @returns {boolean}
 */
ContextGL.prototype.getGLError = function(){
    let error = this._gl.getError();
    switch(error){
        case 0:
            return true;
        case this._gl.INVALID_OPERATION:
            console.warn('GL ERROR GL_INVALID_OPERATION');
            return false;
            break;
        case this._gl.INVALID_ENUM:
            console.warn('GL ERROR INVALID_ENUM');
            return false;
            break;
        case this._gl.INVALID_VALUE:
            console.warn('GL ERROR INVALID_VALUE');
            return false;
            break;
        case this._gl.OUT_OF_MEMORY:
            console.warn('GL ERROR OUT_OF_MEMORY');
            return false;
            break;
        case this._gl.INVALID_FRAMEBUFFER_OPERATION:
            console.warn('GL ERROR GL_INVALID_OPERATION');
            return false;
            break;
        default:
            console.warn('GL ERROR ' + error);
            return false;
            break;
    }
};

/**
 * Returns the underlying WebGLRenderingContext
 * @returns {CanvasRenderingContext2D|*}
 */
ContextGL.prototype.getGL = function(){
    return this._gl;
};

/**
 * Returns the WebGL version used.
 * @returns {number}
 */
ContextGL.prototype.getGLVersion = function(){
    return this._glVersion;
};

/**
 * Returns all capabilities relative to the gl version.
 * @returns {Object}
 */
ContextGL.prototype.getGLCapabilities = function(){
    return this._glCapabilites;
};

/**
 * Returns the drawing buffer size.
 * @param out
 * @returns {*}
 */
ContextGL.prototype.getDrawingbufferSize = function(out){
    return Vec2.set2(out || Vec2.create(), this._gl.drawingBufferWidth,this._gl.drawingBufferHeight);
};

/**
 * Returns the drawing buffer width.
 * @returns {Number}
 */
ContextGL.prototype.getDrawingbufferWidth = function(){
    return this._gl.drawingBufferWidth;
};

/**
 * Returns the drawing buffer height.
 * @returns {Number}
 */
ContextGL.prototype.getDrawingbufferHeight = function(){
    return this._gl.drawingBufferHeight;
};

/**
 * Returns the underlying HTMLCanvasElement.
 * @returns {HTMLCanvasElement}
 */
ContextGL.prototype.getCanvas = function(){
    return this._gl.canvas;
}

/*--------------------------------------------------------------------------------------------------------------------*/
// VIEWPORT
/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * Saves the current viewport state.
 * @param [newState] - Optional new state to set
 * @example
 * ctx.pushViewport();
 * ctx.pushViewport(newState);
 */
ContextGL.prototype.pushViewport = function(newState){
    this._viewportStack.push(this._viewportState.copy());
    if(newState === undefined){
        return;
    }
    this.setViewportState(newState);
};

/**
 * Restores the previous viewport state.
 */
ContextGL.prototype.popViewport = function(){
    if(this._viewportStack.length === 0){
        throw new Error(STR_ERROR_INVALID_STACK_POP);
    }
    this.setViewport(this._viewportStack.pop().viewport);
};

/**
 * Sets the current viewport state, equals setViewport
 * @param state
 */
ContextGL.prototype.setViewportState = function(state){
    this.setViewport(state.viewport);
};

/**
 * Returns a copy of the current viewport state.
 * @returns {ViewportState}
 */
ContextGL.prototype.getViewportState = function(){
    return this._viewportState.copy();
};

/**
 * Sets the viewport.
 * @param {Array} rect
 */
ContextGL.prototype.setViewport = function(rect){
    this.setViewport4(rect[0],rect[1],rect[2],rect[3]);
};

/**
 * Sets the viewport.
 * @param {Number} x - origin x (lower left corner)
 * @param {Number} y - origin y (lower left corner)
 * @param {Number} w - rectangle width
 * @param {Number} h - rectangle height
 */
ContextGL.prototype.setViewport4 = function(x,y,w,h){
    const viewport = this._viewportState.viewport;
    if(Vec4.equals(viewport,x,y,w,h)){
        return;
    }
    Vec4.set4(viewport,x,y,w,h);
    this._gl.viewport(x,y,w,h);
};

/**
 * Returns the current viewport bounds.
 * @param {Array} [out]
 * @returns {Array}
 */
ContextGL.prototype.getViewport = function(out){
    return Rect.set(out || Rect.create(),this._viewportState.viewport);
};

/**
 * Returns the current viewport size.
 * @param out
 * @returns {*}
 */
ContextGL.prototype.getViewportSize = function(out){
    return Vec2.set2(out || Vec2.create(),this._viewportState.viewport[2],this._viewportState.viewport[3]);
};

/**
 * Returns the current viewport width.
 * @returns {*}
 */
ContextGL.prototype.getViewportWidth = function(){
    return this._viewportState.viewport[2];
};

/**
 * Returns the current viewport height.
 * @returns {*}
 */
ContextGL.prototype.getViewportHeight = function(){
    return this._viewportState.viewport[3];
};

/*--------------------------------------------------------------------------------------------------------------------*/
// CULLING
/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * Saves the current culling state.
 * @param [newState] - Optional new state to set
 * @example
 * ctx.pushCulling();
 * ctx.pushCulling(newState);
 * ctx.pushCulling({
 *     cullFace: ctx.FRONT
 * });
 */
ContextGL.prototype.pushCulling = function(newState){
    this._cullStack.push(this._cullingState.copy());
    if(newState === undefined){
        return;
    }
    this.setCullingState(newState);
};

/**
 * Restores the previous culling state.
 */
ContextGL.prototype.popCulling = function(){
    if(this._cullStack.length === 0){
        throw new Error(STR_ERROR_INVALID_STACK_POP);
    }
    const state = this._cullStack.pop();
    this.setCullFace(state.cullFace);
    this.setCullFaceMode(state.cullFaceMode);
};

/**
 * Sets the current culling state.
 * @param state
 * @example
 * ctx.setCullingState(newState);
 * ctx.setCullingState({
 *     cullFace: ctx.FRONT
 * });
 */
ContextGL.prototype.setCullingState = function(state){
    if(state.cullFace !== undefined){
        this.setCullFace(state.cullFace);
    }
    if(state.cullFaceMode !== undefined){
        this.setCullFaceMode(state.cullFaceMode);
    }
};

/**
 * Returns a copy of the current culling state.
 * @returns {CullingState}
 */
ContextGL.prototype.getCullingState = function(){
    return this._cullingState.copy();
};

/**
 * Returns a copy of the default culling state.
 * @returns {CullingState}
 */
ContextGL.prototype.getCullingStateDefault = function(){
    return this._cullingStateDefault.copy();
};

/**
 * Enables / disables culling polygons based on their winding in window coordinates.
 * @param {Boolean} cullFace
 */
ContextGL.prototype.setCullFace = function(cullFace){
    if(cullFace === this._cullingState.cullFace){
        return;
    }
    if(cullFace){
        this._gl.enable(this._gl.CULL_FACE);
    } else {
        this._gl.disable(this._gl.CULL_FACE);
    }
    this._cullingState.cullFace = cullFace;
};

/**
 * Returns true if culling is enabled.
 * @returns {Boolean}
 */
ContextGL.prototype.getCullFace = function(){
    return this._cullingState.cullFace;
};

/**
 * Specify whether front- or back-facing polygons can be culled.
 * @param {Number} mode
 */
ContextGL.prototype.setCullFaceMode = function(mode){
    if(mode === this._cullingState.cullFaceMode){
        return;
    }
    this._gl.cullFace(mode);
    this._cullingState.cullFaceMode = mode;
};

/**
 * Returns the current cull face mode.
 * @returns {Number}
 */
ContextGL.prototype.getCullFaceMode = function(){
    return this._cullingState.cullFaceMode;
};

/*--------------------------------------------------------------------------------------------------------------------*/
// SCISSOR
/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * Saves the current scissor state.
 * @param [newState] - Optional new state to set
 * @example
 * ctx.pushScissor();
 * ctx.pushScissor(newState);
 * ctx.pushScissor({
 *     scissorTest: false
 * });
 */
ContextGL.prototype.pushScissor = function(newState){
    this._scissorStack.push(this._scissorState.copy());
    if(newState === undefined){
        return;
    }
    this.setScissorState(newState);
};

/**
 * Restore the previous scissor state
 */
ContextGL.prototype.popScissor = function(){
    if(this._scissorStack.length === 0){
        throw new Error(STR_ERROR_INVALID_STACK_POP);
    }
    const state = this._scissorStack.pop();
    this.setScissorTest(state.scissorTest);
    this.setScissor(state.scissorBox);
};

/**
 * Returns a copy of the default scissor state.
 * @returns {ScissorState}
 */
ContextGL.prototype.getScissorStateDefault = function(){
    return this._scissorStateDefault.copy();
};

/**
 * Sets the current scissor state.
 * @param state
 * ctx.setScissorState(newState);
 * ctx.setScissorState({
 *     scissorTest : false
 * });
 */
ContextGL.prototype.setScissorState = function(state){
    if(state.scissorTest !== undefined){
        this.setScissorTest(state.scissorTest);
    }
    if(state.scissorBox !== undefined){
        this.setScissor(state.scissorBox);
    }
};

/**
 * Returns a copy of the current scissor state.
 * @returns {ScissorState}
 */
ContextGL.prototype.getScissorState = function(){
    return this._scissorState.copy();
};

/**
 * Enables / disables discarding fragments that are outside the scissor rectangle.
 * @param {Boolean} scissor
 */
ContextGL.prototype.setScissorTest = function(scissor){
    if(scissor === this._scissorState.scissorTest){
        return;
    }
    if(scissor){
        this._gl.enable(this._gl.SCISSOR_TEST)
    } else {
        this._gl.disable(this._gl.SCISSOR_TEST);
    }
    this._scissorState.scissorTest = scissor;
};

/**
 * Returns true if scissor test is enabled.
 * @returns {Boolean}
 */
ContextGL.prototype.getScissorTest = function(){
    return this._scissorState.scissorTest;
};

/**
 * Defines the scissor box.
 * @param {Array} rect
 */
ContextGL.prototype.setScissor = function(rect){
    this.setScissor4(rect[0],rect[1],rect[2],rect[3]);
};

/**
 * Defines the scissor box.
 * @param {Number} x - origin x (lower left corner)
 * @param {Number} y - origin y (lower left corner)
 * @param {Number} w - width of the rectangle
 * @param {Number} h - height of the rectangle
 */
ContextGL.prototype.setScissor4 = function(x,y,w,h){
    if(Vec4.equals4(this._scissorState.scissorBox,x,y,w,h)){
        return;
    }
    this._gl.scissor(x,y,w,h);
    Vec4.set4(this._scissorState.scissorBox,x,y,w,h);
};

/**
 * Returns the current scissor box.
 * @param {Array} [out]
 * @returns {Array}
 */
ContextGL.prototype.getScissor = function(out){
    return Vec4.set(out || Vec4.create(), this._scissorState.scissorBox);
};

/*--------------------------------------------------------------------------------------------------------------------*/
// STENCIL
/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * Saves the current stencil state.
 * @param [newState] - Optional new state to set
 * @example
 * ctx.pushStencil();
 * ctx.pushStencil(newState);
 * ctx.pushStencil({
 *     stencilTest: false
 * });
 */
ContextGL.prototype.pushStencil = function(newState){
    this._stencilStack.push(this._stencilState.copy());
    if(newState === undefined){
        return;
    }
    this.setStencilState(newState);
};

/**
 * Restore the previous stencil state.
 */
ContextGL.prototype.popStencil = function(){
    const state = this._stencilStack.pop();
    this.setStencilTest(state.stencilTest);
    //front
    this.setStencilFuncSeparate(
        this._gl.FRONT,
        state.stencilFuncSeparate[0],
        state.stencilFuncSeparate[1],
        state.stencilFuncSeparate[2]
    );
    //back
    this.setStencilFuncSeparate(
        this._gl.BACK,
        state.stencilFuncSeparate[3],
        state.stencilFuncSeparate[4],
        state.stencilFuncSeparate[5]
    );
    //front
    this.setStencilOpSeparate(
        this._gl.FRONT,
        state.stencilOpSeparate[0],
        state.stencilOpSeparate[1],
        state.stencilOpSeparate[2]
    );
    //back
    this.setStencilOpSeparate(
        this._gl.BACK,
        state.stencilOpSeparate[3],
        state.stencilOpSeparate[4],
        state.stencilOpSeparate[5]
    );
};

/**
 * Sets the current stencil state.
 * @param state
 * @example
 * ctx.setStencilState(newState);
 * ctx.setStencilState({
 *     stencilTest : false
 * });
 */
ContextGL.prototype.setStencilState = function(state){
    if(state.stencilTest !== undefined){
        this.setStencilTest(state);
    }
    if(state.stencilFunc !== undefined){
        this.setStencilFunc(
            state.stencilFunc[0],
            state.stencilFunc[1],
            state.stencilFunc[2]
        );
    }
    if(state.stencilFuncSeparate !== undefined){
        //front
        this.setStencilFuncSeparate(
            this._gl.FRONT,
            state.stencilFuncSeparate[0],
            state.stencilFuncSeparate[1],
            state.stencilFuncSeparate[2]
        );
        //back
        this.setStencilFuncSeparate(
            this._gl.BACK,
            state.stencilFuncSeparate[3],
            state.stencilFuncSeparate[4],
            state.stencilFuncSeparate[5]
        );
    }
    if(state.stencilOp !== undefined){
        this.setStencilOp(
            state.stencilOp[0],
            state.stencilOp[1],
            state.stencilOp[2]
        );
    }
    if(state.setStencilOpSeparate !== undefined){
        //front
        this.setStencilOpSeparate(
            this._gl.FRONT,
            state.stencilOpSeparate[0],
            state.stencilOpSeparate[1],
            state.stencilOpSeparate[2]
        );
        //back
        this.setStencilOpSeparate(
            this._gl.FRONT,
            state.stencilOpSeparate[3],
            state.stencilOpSeparate[4],
            state.stencilOpSeparate[5]
        );
    }
};

/**
 * Returns a copy of the current stencil state.
 * @returns {StencilState}
 */
ContextGL.prototype.getStencilState = function(){
    return this._stencilState.copy();
};

/**
 * Returns a copy of the default stencil state.
 * @returns {StencilState}
 */
ContextGL.prototype.getStencilStateDefault = function(){
    return this._stencilStateDefault.copy();
};

/**
 * Enables / disables stencil testing and updating the stencil buffer.
 * @param {Boolean} stencilTest
 */
ContextGL.prototype.setStencilTest = function(stencilTest){
    if(stencilTest === this._stencilState.stencilTest){
        return;
    }
    if(stencilTest){
        this._gl.enable(this._gl.STENCIL_TEST);
    } else{
        this._gl.disable(this._gl.STENCIL_TEST);
    }
    this._stencilState.stencilTest = stencilTest;
};

/**
 * Returns true if stencil testing is enabled.
 * @returns {Boolean}
 */
ContextGL.prototype.getStencilTest = function(){
    return this._stencilState.stencilTest;
};

/**
 * Sets the front and back function and reference value for stencil testing.
 * @param {Number} func - The test function
 * @param {Number} ref - The reference value for the stencil test
 * @param {Number} mask - A mask that is ANDed with both the reference value and the stored stencil value whe the test is done
 */
ContextGL.prototype.setStencilFunc = function(func,ref,mask){
    const stencilFuncSeparate = this._stencilState.stencilFuncSeparate;
    if(stencilFuncSeparate[0] === func &&
       stencilFuncSeparate[1] === ref &&
       stencilFuncSeparate[2] === mask &&
       stencilFuncSeparate[3] === func &&
       stencilFuncSeparate[4] === ref &&
       stencilFuncSeparate[5] === mask){
        return;
    }
    this._gl.stencilFunc(func,ref,mask);
    //front
    stencilFuncSeparate[0] = func;
    stencilFuncSeparate[1] = ref;
    stencilFuncSeparate[2] = mask;
    //back
    stencilFuncSeparate[3] = func;
    stencilFuncSeparate[4] = ref;
    stencilFuncSeparate[5] = mask;
};

/**
 * Returns the current stencil func set.
 * @param {Array} [out]
 * @returns {Array}
 */
ContextGL.prototype.getStencilFunc = function(out){
    out = out || [];
    const stencilFuncSeparate = this._stencilState.stencilFuncSeparate;
    //front
    out[0] = stencilFuncSeparate[0];
    out[1] = stencilFuncSeparate[1];
    out[2] = stencilFuncSeparate[2];
    //back
    out[3] = stencilFuncSeparate[3];
    out[4] = stencilFuncSeparate[4];
    out[5] = stencilFuncSeparate[5];
    return out;
};

/**
 * Sets the front and back function and reference value for stencil testing.
 * @param {Number} face - Either front and/or back stencil to be updated
 * @param {Number} func - The test function
 * @param {Number} ref - The reference value for the stencil test
 * @param {Number} mask - A mask that is ANDed with both the reference value and the stored stencil value whe the test is done
 */
ContextGL.prototype.setStencilFuncSeparate = function(face, func, ref, mask){
    const stencilFuncSeparate = this._stencilState.stencilFuncSeparate;
    if(face === this._gl.FRONT){
        if(stencilFuncSeparate[0] === func &&
           stencilFuncSeparate[1] === ref &&
           stencilFuncSeparate[2] === mask){
            return;
        }
    } else {
        if(stencilFuncSeparate[3] === func &&
           stencilFuncSeparate[4] === ref &&
           stencilFuncSeparate[5] === mask){
            return;
        }
    }
    this._gl.stencilFuncSeparate(face,func,ref,mask);
    //front
    if(face === this._gl.FRONT){
        stencilFuncSeparate[0] = func;
        stencilFuncSeparate[1] = ref;
        stencilFuncSeparate[2] = mask;
        //back
    } else {
        stencilFuncSeparate[3] = func;
        stencilFuncSeparate[4] = ref;
        stencilFuncSeparate[5] = mask;
    }
};

/**
 * Returns the current stencil func separate set.
 * @param {Array} [out]
 * @returns {Array}
 */
ContextGL.prototype.getStencilFuncSeparate = function(face,out){
    let index = face === this._gl.FRONT ? 0 : 3;
    const stencilFuncSeparate = this._stencilState.stencilFuncSeparate;
    return Vec3.set3(out || Vec3.create(),
        stencilFuncSeparate[index  ],
        stencilFuncSeparate[index+1],
        stencilFuncSeparate[index+2]
    );
};

/**
 * Sets the front and back stencil test actions.
 * @param {Number} fail - The action to take when stencil test fails
 * @param {Number} zfail - The stencil action when the stencil passes, but the depth test fails
 * @param {Number} zpass - The stencil action when both the stencil and the depth test pass, or when the stencil passes and either there is no depth buffer or depth testing is not enabled
 */
ContextGL.prototype.setStencilOp = function(fail,zfail,zpass){
    const stencilOpSeparate = this._stencilState.stencilOpSeparate;
    if(stencilOpSeparate[0] === fail &&
       stencilOpSeparate[1] === zfail &&
       stencilOpSeparate[2] === zpass &&
       stencilOpSeparate[3] === fail &&
       stencilOpSeparate[4] === zfail &&
       stencilOpSeparate[5] === zpass){
        return;
    }
    this._gl.stencilOp(fail,zfail,zpass);
    //front
    stencilOpSeparate[0] = fail;
    stencilOpSeparate[1] = zfail;
    stencilOpSeparate[2] = zpass;
    //back
    stencilOpSeparate[3] = fail;
    stencilOpSeparate[4] = zfail;
    stencilOpSeparate[5] = zpass;
};

/**
 * Returns the current front and back stencil test actions set.
 * @param {Array} [out]
 * @returns {Array}
 */
ContextGL.prototype.getStencilOp = function(out){
    out = out || [];
    const stencilOpSeparate = this._stencilState.stencilOpSeparate;
    //front
    out[0] = stencilOpSeparate[0];
    out[1] = stencilOpSeparate[1];
    out[2] = stencilOpSeparate[2];
    //back
    out[3] = stencilOpSeparate[3];
    out[4] = stencilOpSeparate[4];
    out[5] = stencilOpSeparate[5];
    return out;
};

/**
 * Sets the front and/or back stencil test actions.
 * @param {Number} face - Either the front and/or back stencil to be updated
 * @param {Number} fail - The action to take when stencil test fails
 * @param {Number} zfail - The stencil action when the stencil passes, but the depth test fails
 * @param {Number} zpass - The stencil action when both the stencil and the depth test pass, or when the stencil passes and either there is no depth buffer or depth testing is not enabled
 */
ContextGL.prototype.setStencilOpSeparate = function(face,fail,zfail,zpass){
    const stencilOpSeparate = this._stencilState.stencilOpSeparate;
    if(face === this._gl.FRONT){
        if(stencilOpSeparate[0] === fail &&
           stencilOpSeparate[1] === zfail &&
           stencilOpSeparate[2] === zpass){
            return;
        }
    } else {
        if(stencilOpSeparate[3] === fail &&
           stencilOpSeparate[4] === zfail &&
           stencilOpSeparate[5] === zpass){
            return;
        }
    }
    this._gl.stencilOpSeparate(face,fail,zfail,zpass);
    //front
    if(face === this._gl.FRONT){
        stencilOpSeparate[0] = fail;
        stencilOpSeparate[1] = zfail;
        stencilOpSeparate[2] = zpass;
    //back
    } else {
        stencilOpSeparate[3] = fail;
        stencilOpSeparate[4] = zfail;
        stencilOpSeparate[5] = zpass;
    }
};

/**
 * Returns the current stencil test separate set.
 * @param {Number} face
 * @param {Array} [out]
 * @returns {Array}
 */
ContextGL.prototype.getStencilOpSeparate = function(face,out){
    let index = face === this._gl.FRONT ? 0 : 3;
    const stencilOpSeparate = this._stencilState.stencilOpSeparate;
    return Vec3.set3(out || Vec3.create(),
        stencilOpSeparate[index  ],
        stencilOpSeparate[index+1],
        stencilOpSeparate[index+2]
    );
};

/**
 * Sets the clear value for the stencil buffer.
 * @param {Number} s - The index to be used when the stencil buffer is cleared.
 */
ContextGL.prototype.clearStencil = function(s){
    //TODO: add state
    this._gl.clearStencil(s);
};

/*--------------------------------------------------------------------------------------------------------------------*/
// DEPTH
/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * Saves the current depth state.
 * @param [newState] - Optional new state to set
 * @example
 * ctx.pushDepth();
 * ctx.pushDepth(newState);
 * ctx.pushDepth({
 *     depthTest: false
 * });
 */
ContextGL.prototype.pushDepth = function(newState){
    this._depthStack.push(this._depthState.copy());
    if(newState === undefined){
        return;
    }
    this.setDepthState(newState);
};

/**
 * Restores the previous depth state.
 */
ContextGL.prototype.popDepth = function(){
    if(this._depthStack.length === 0){
        throw new Error(STR_ERROR_INVALID_STACK_POP);
    }
    const state = this._depthStack.pop();
    this.setDepthTest(state.depthTest);
    this.setDepthMask(state.depthMask);
    this.setDepthFunc(state.depthFunc);
    this.setClearDepth(state.depthClearValue);
    this.setDepthRange(state.depthRange[0],state.depthRange[1]);
    this.setPolygonOffset(state.polygonOffset[0],state.polygonOffset[1]);
};

/**
 * Sets the current depth state.
 * @param state
 * @example
 * ctx.setDepthState(newState);
 * ctx.setDepthState({
 *     depthTest: false
 * });
 */
ContextGL.prototype.setDepthState = function(state){
    if(state.depthTest !== undefined){
        this.setDepthTest(state.depthTest);
    }
    if(state.depthMask !== undefined){
        this.setDepthMask(state.depthMask);
    }
    if(state.depthFunc !== undefined){
        this.setDepthFunc(state.depthFunc);
    }
    if(state.depthClearValue !== undefined){
        this.setClearDepth(state.depthClearValue);
    }
    if(state.depthRange !== undefined){
        this.setDepthRange(state.depthRange[0],state.depthRange[1]);
    }
    if(state.polygonOffset !== undefined){
        this.setPolygonOffset(state.polygonOffset[0],state.polygonOffset[1]);
    }
};

/**
 * Returns a copy of the current depth state.
 * @returns {DepthState}
 */
ContextGL.prototype.getDepthState = function(){
    return this._depthState.copy();
};

/**
 * Returns a copy of the default depth state.
 * @returns {DepthState}
 */
ContextGL.prototype.getDepthStateDefault = function(){
    return this._depthStateDefault.copy();
};

/**
 * Enables / disables depth comparisons and updating the depth buffer.
 * @param {Boolean} depthTest
 */
ContextGL.prototype.setDepthTest = function(depthTest){
    if(depthTest === this._depthState.depthTest){
        return;
    }
    if(depthTest){
        this._gl.enable(this._gl.DEPTH_TEST);
    } else {
        this._gl.disable(this._gl.DEPTH_TEST);
    }
    this._depthState.depthTest = depthTest;
};

/**
 * Returns true if depth testing is enabled.
 * @returns {Boolean}
 */
ContextGL.prototype.getDepthTest = function(){
    return this._depthState.depthTest;
};

/**
 * Enables / disables writing into the depth buffer.
 * @param {Boolean} flag
 */
ContextGL.prototype.setDepthMask = function(flag){
    if(flag === this._depthState.depthMask){
        return;
    }
    this._gl.depthMask(flag);
    this._depthState.depthMask = flag;
};

/**
 * Returns true if writing into depth buffer is enabled.
 * @returns {Boolean}
 */
ContextGL.prototype.getDepthMask = function(){
    return this._depthState.depthMask;
};

/**
 * Sets the value used for depth comparisons.
 * @param {Number} func
 */
ContextGL.prototype.setDepthFunc = function(func){
    if(func === this._depthState.depthFunc){
        return;
    }
    this._gl.depthFunc(func);
    this._depthState.depthFunc = func;
};

/**
 * Returns the current depth func set.
 * @returns {Number}
 */
ContextGL.prototype.getDepthFunc = function(){
    return this._depthState.depthFunc;
};

/**
 * Sets the clear value for the depth buffer.
 * @param {Number} depth
 */
ContextGL.prototype.setClearDepth = function(depth){
    if(depth === this._depthState.depthClearValue){
        return;
    }
    this._gl.clearDepth(depth);
    this._depthState.depthClearValue = depth;
};

/**
 * Returns the current depth buffer clear value set.
 * @returns {Number}
 */
ContextGL.prototype.getClearDepth = function(){
    return this._depthState.depthClearValue;
};

/**
 * Sets the mapping of depth values from normalized device coordinates to window coordinates.
 * @param {Number} znear - The mapping of the near clipping plane to window coordinates
 * @param {Number} zfar - The mapping of the far clipping plane to window coordinates
 */
ContextGL.prototype.setDepthRange = function(znear,zfar){
    const depthRange = this._depthState.depthRange;
    if(Vec2.equals2(depthRange,znear,zfar)){
        return;
    }
    this._gl.depthRange(znear,zfar);
    depthRange[0] = znear;
    depthRange[1] = zfar;
};

/**
 * Returns the current depth range values set.
 * @param {Array} [out]
 * @returns {Array}
 */
ContextGL.prototype.getDepthRange = function(out){
    return Vec2.set(out || Vec2.create(), this._depthState.depthRange);
};

/**
 * Sets the scale and units used to calculate depth values
 * @param {Number} factor
 * @param {Number} units
 */
ContextGL.prototype.setPolygonOffset = function(factor,units){
    const polygonOffset= this._depthState.polygonOffset;
    if(Vec2.equals(polygonOffset,factor,units)){
        return;
    }
    this._gl.polygonOffset(factor,units);
    polygonOffset[0] = factor;
    polygonOffset[1] = units;
};

/**
 * Returns the current polygon offset values.
 * @param {Array} [out]
 * @returns {Array}
 */
ContextGL.prototype.getPolygonOffset = function(out){
    return Vec2.set(out || Vec2.create(),this._depthState.polygonOffset);
};

/*--------------------------------------------------------------------------------------------------------------------*/
// COLOR
/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * Saves the current clear color & color mask state.
 * @param [newState] - Optional new state to set
 * ctx.pushColor();
 * ctx.pushColor(newState);
 * ctx.pushColor({
 *     clearColor : [1,1,1,1]
 * });
 */
ContextGL.prototype.pushColor = function(newState){
    this._colorStack.push(this._colorState.copy());
    if(newState === undefined){
        return;
    }
    this.setColorState(newState);
};

/**
 * Restores the previous clear color & color mask state.
 */
ContextGL.prototype.popColor = function(){
    if(this._colorStack.length === 0){
        throw new Error(STR_ERROR_INVALID_STACK_POP);
    }
    const state = this._colorStack.pop();
    const colorMask = state.colorMask;
    this.setClearColor(state.clearColor);
    this.setColorMask(colorMask[0],colorMask[1],colorMask[2],colorMask[3]);
};

/**
 * Sets the current color state.
 * @param state
 * ctx.setColorState(newState);
 * ctx.setColorState({
 *     clearColor : [1,1,1,1];
 * });
 */
ContextGL.prototype.setColorState = function(state){
    if(state.clearColor !== undefined){
        this.setClearColor(state.clearColor);
    }
    const colorMask = state.colorMask;
    if(colorMask !== undefined){
        this.setColorMask(colorMask[0],colorMask[1],colorMask[2],colorMask[3]);
    }
};

/**
 * Returns a copy of the current color state.
 * @returns {ColorState}
 */
ContextGL.prototype.getColorState = function(){
    return this._colorState.copy();
};

/**
 * Returns the default color state.
 * @returns {ColorState}
 */
ContextGL.prototype.getColorStateDefault = function(){
    return this._colorStateDefault.copy();
};

/**
 * Sets the clear values for the color buffers.
 * @param color
 */
ContextGL.prototype.setClearColor = function(color){
    this.setClearColor4(color[0],color[1],color[2],color[3]);
};

/**
 * Sets the clear values for the color buffers.
 * @param {Number} r - Red value
 * @param {Number} g - Green value
 * @param {Number} b - Blue value
 * @param {Number} a - Alpha value
 */
ContextGL.prototype.setClearColor4 = function(r,g,b,a){
    if(Vec4.equals4(this._colorState.clearColor,r,g,b,a)){
        return;
    }
    this._gl.clearColor(r,g,b,a);
    Vec4.set4(this._colorState.clearColor,r,g,b,a);
};

/**
 * Sets the clear values for the color buffers.
 * @param {Number} r - Red value
 * @param {Number} g - Green value
 * @param {Number} b - Blue value
 */
ContextGL.prototype.setClearColor3 = function(r,g,b){
    this.setClearColor4(r,g,b,1.0);
};

/**
 * Sets the clear values for the color buffers.
 * @param {Number} k - RGB value
 * @param {Number} a - Alpha value
 */
ContextGL.prototype.setClearColor2 = function(k,a){
    this.setClearColor4(k,k,k,a);
};

/**
 * Sets the clear values for the color buffers.
 * @param {Number} k - RGB value
 */
ContextGL.prototype.setClearColor1 = function(k){
    this.setClearColor4(k,k,k,1.0);
};

/**
 * Returns the current clear color set.
 * @param {Array} [out]
 * @returns {Array}
 */
ContextGL.prototype.getClearColor = function(out){
    return Vec4.set(out || Vec4.create(),this._colorState.clearColor);
};

/**
 * Enables / disables writing of frame buffer color components.
 * @param {Boolean} r
 * @param {Boolean} g
 * @param {Boolean} b
 * @param {Boolean} a
 */
ContextGL.prototype.setColorMask = function(r,g,b,a){
    if(Vec4.equals4(this._colorState.colorMask,r,g,b,a)){
        return;
    }
    this._gl.colorMask(r,g,b,a);
    Vec4.set4(this._colorState.colorMask,r,g,b,a);
};

/**
 * Returns the current color mask set.
 * @param {Array} [out]
 * @returns {Array}
 */
ContextGL.prototype.getColorMask = function(out){
    return Vec4.set(out || Vec4.create(),this._colorState.colorMask);
};

/*--------------------------------------------------------------------------------------------------------------------*/
// LINE WIDTH
/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * Saves the current line width state.
 */
ContextGL.prototype.pushLineWidth = function(newState){
    this._lineWidthStack.push(this._lineWidthState.copy());
    if(newState === undefined){
        return;
    }
    this.setLineWidth(newState);
};

/**
 * Restores the previous line width state.
 */
ContextGL.prototype.popLineWidth = function(){
    if(this._lineWidthStack.length === 0){
        throw new Error(STR_ERROR_INVALID_STACK_POP);
    }
    this.setLineWidthState(this._lineWidthStack.pop());
};

/**
 * Sets the current linewidth state, equals setLineWidth
 * @param state
 */
ContextGL.prototype.setLineWidthState = function(state){
    this.setLineWidth(state.lineWidth);
};

/**
 * Returns a copy of the current line width state.
 * @returns {LineWidthState}
 */
ContextGL.prototype.getLineWidthState = function(){
    return this._lineWidthState.copy();
};

/**
 * Returns the default line width state.
 * @returns {LineWidthState}
 */
ContextGL.prototype.getLineWidthStateDefault = function(){
    return this._lineWidthStateDefault.copy();
};

/**
 * Sets the width of rasterized lines.
 * @param {Number} lineWidth
 */
ContextGL.prototype.setLineWidth = function(lineWidth){
    if(this._lineWidthState.lineWidth === lineWidth){
        return;
    }
    this._gl.lineWidth(lineWidth);
    this._lineWidthState.lineWidth = lineWidth;
};

ContextGL.prototype.getLineWidth = function(){
    return this._lineWidthState.lineWidth;
};

/*--------------------------------------------------------------------------------------------------------------------*/
// BLEND
/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * Saves the current blend state.
 * @param [newState]
 * ctx.pushBlend();
 * ctx.pushBlend(newState);
 * ctx.pushBlend({
 *     blend: true
 * });
 */
ContextGL.prototype.pushBlend = function(newState){
    this._blendStack.push(this._blendState.copy());
    if(newState === undefined){
        return;
    }
    this.setBlendState(newState);
};

/**
 * Restores the previous blend state.
 */
ContextGL.prototype.popBlend = function(){
    if(this._blendStack.length === 0){
        throw new Error(STR_ERROR_INVALID_STACK_POP);
    }
    const state = this._blendStack.pop();
    const blendEquationSeparate = state.blendEquationSeparate;
    const blendFuncSeparate = state.blendFuncSeparate;
    this.setBlend(state.blend);
    this.setBlendColor(state.blendColor);
    this.setBlendEquationSeparate(
        blendEquationSeparate[0],
        blendEquationSeparate[1]
    );
    this.setBlendFuncSeparate(
        blendFuncSeparate[0],
        blendFuncSeparate[1],
        blendFuncSeparate[2],
        blendFuncSeparate[3]
    );
};

/**
 * Sets the current blend state
 * @param state
 * ctx.setBlendState({
 *     blend: true
 * });
 */
ContextGL.prototype.setBlendState = function(state){
    if(state.blend !== undefined){
        this.setBlend(state.blend);
    }
    if(state.blendColor !== undefined){
        this.setBlendColor(state.blendColor);
    }
    if(state.blendEquation !== undefined){
        this.setBlendEquation(state.blendEquation);
    }
    const blendEquationSeparate = state.blendEquationSeparate;
    if(blendEquationSeparate !== undefined){
        this.setBlendEquationSeparate(
            blendEquationSeparate[0],
            blendEquationSeparate[1]
        );
    }
    if(state.blendFunc !== undefined){
        this.setBlendFunc(state.blendFunc[0],state.blendFunc[1]);
    }
    const blendFuncSeparate = state.blendFuncSeparate;
    if(blendFuncSeparate !== undefined){
        this.setBlendFuncSeparate(
            blendFuncSeparate[0],
            blendFuncSeparate[1],
            blendFuncSeparate[2],
            blendFuncSeparate[3]
        );
    }
};

/**
 * Returns a copy of the current blend state.
 * @returns {BlendState}
 */
ContextGL.prototype.getBlendState = function(){
    return this._blendState.copy();
};

/**
 * Returns a copy of the default blend state.
 * @returns {BlendState}
 */
ContextGL.prototype.getBlendStateDefault = function(){
    return this._blendStateDefault.copy();
};

/**
 * Enables / disables blending the computed fragment color values with the values in the color buffers.
 * @param {Boolean} blend
 */
ContextGL.prototype.setBlend = function(blend){
    if(blend === this._blendState.blend){
        return;
    }
    if(blend){
        this._gl.enable(this._gl.BLEND);
    } else {
        this._gl.disable(this._gl.BLEND);
    }
    this._blendState.blend = blend;
};

/**
 * Returns true if blending is enabled.
 * @returns {Boolean}
 */
ContextGL.prototype.getBlend = function(){
    return this._blendState.blend;
};

/**
 * Sets the blend color.
 * @param {Array} color
 */
ContextGL.prototype.setBlendColor = function(color){
    this.setBlendColor4(color[0],color[1],color[2],color[3]);
};

/**
 * Sets the blend color.
 * @param {Number} r
 * @param {Number} g
 * @param {Number} b
 * @param {Number} a
 */
ContextGL.prototype.setBlendColor4 = function(r,g,b,a){
    if(Vec4.equals4(this._blendState.blendColor,r,g,b,a)){
        return;
    }
    this._gl.blendColor(r,g,b,a);
    Vec4.set4(this._blendState.blendColor,r,g,b,a);
};

/**
 * Sets the blend color.
 * @param r
 * @param g
 * @param b
 */
ContextGL.prototype.setBlendColor3 = function(r,g,b){
    this.setBlendColor4(r,g,b,1.0);
};

/**
 * Sets the blend color.
 * @param k
 * @param a
 */
ContextGL.prototype.setBlendColor2 = function(k,a){
    this.setBlendColor4(k,k,k,a);
};

/**
 * Sets the blend color.
 * @param k
 */
ContextGL.prototype.setBlendColor1 = function(k){
    this.setBlendColor4(k,k,k,1.0);
};

/**
 * Return the current blend color set.
 * @param {Array} [out]
 * @returns {Array}
 */

ContextGL.prototype.getBlendColor = function(out){
    return Vec4.set(out || Vec4.create(),this._blendState.blendColor);
};

/**
 * Sets the equation used for both the RGB blend equation and the alpha blend equation.
 * @param {Number} mode
 */
ContextGL.prototype.setBlendEquation = function(mode){
    const blendEquationSeparate = this._blendState.blendEquationSeparate;
    if(mode == blendEquationSeparate[0] &&
       mode == blendEquationSeparate[1]){
        return;
    }
    this._gl.blendEquation(mode);
    blendEquationSeparate[0] = mode;
    blendEquationSeparate[1] = mode;
};

/**
 * Returns the current blend equation set.
 * @returns {Number}
 */
ContextGL.prototype.getBlendEquation = function(){
    return this._blendState.blendEquationSeparate[0];
};

/**
 * Sets the RGB blend equation and the alpha blend equation separately.
 * @param {Number} modeRGB
 * @param {Number} modeAlpha
 */
ContextGL.prototype.setBlendEquationSeparate = function(modeRGB, modeAlpha){
    const blendEquationSeparate = this._blendState.blendEquationSeparate;
    if(Vec2.equals2(blendEquationSeparate,modeRGB,modeAlpha)){
        return;
    }
    this._gl.blendEquationSeparate(modeRGB,modeAlpha);
    Vec2.set2(blendEquationSeparate,modeRGB,modeAlpha);
};

/**
 * Returns the current RGB and alpha blend equation set.
 * @param {Array} [out]
 * @returns {Array}
 */
ContextGL.prototype.getBlendEquationSeparate = function(out){
    return Vec2.set(out || Vec2.create(), this._blendState.blendEquationSeparate);
};

/**
 * Sets the pixel arithmetic.
 * @param {Number} sfactor - Specifies how the red, green, blue, and alpha source blending factors are computed
 * @param {Number} dfactor - Specifies how the red, green, blue, and alpha destination blending factors are computed
 */
ContextGL.prototype.setBlendFunc = function(sfactor,dfactor){
    const blendFuncSeparate = this._blendState.blendFuncSeparate;
    if(blendFuncSeparate[0] === sfactor &&
       blendFuncSeparate[1] === sfactor &&
       blendFuncSeparate[2] === dfactor &&
       blendFuncSeparate[3] === dfactor){
        return;
    }
    this._gl.blendFunc(sfactor,dfactor);
    //srcRGB = srcAlpha
    blendFuncSeparate[0] = sfactor;
    blendFuncSeparate[1] = dfactor;
    //dstRGB = dstAlpha
    blendFuncSeparate[2] = sfactor;
    blendFuncSeparate[3] = dfactor;
};

/**
 * Returns the current pixel arithmetic set.
 * @param {Array} [out]
 * @returns {Array}
 */
ContextGL.prototype.getBlendFunc = function(out){
    const blendFuncSeparate = this._blendState.blendFuncSeparate;
    return Vec2.set2(
        out || Vec2.create(),
        blendFuncSeparate[0],blendFuncSeparate[1]
    );
};

/**
 * Sets the pixel arithmetic for RGB and alpha components separately.
 * @param {Number} srcRGB - Specifies how the red, green, and blue blending factors are computed
 * @param {Number} dstRGB - Specifies how the red, green, and blue destination blending factors are computed
 * @param {Number} srcAlpha - Specifies how the alpha source blending factor is computed
 * @param {Number} dstAlpha Specifies how the alpha destination blending factor is computed
 */
ContextGL.prototype.setBlendFuncSeparate = function(srcRGB,dstRGB,srcAlpha,dstAlpha){
    const blendFuncSeparate = this._blendState.blendFuncSeparate;
    if(Vec4.equals4(blendFuncSeparate,srcRGB,dstRGB,srcAlpha,dstAlpha)){
        return;
    }
    this._gl.blendFuncSeparate(srcRGB,dstRGB,srcAlpha,dstAlpha);
    Vec4.set4(blendFuncSeparate,srcRGB,dstRGB,srcAlpha,dstAlpha);
};

/**
 * Returns the current pixel arithmetic for RGB and alpha components separately set.
 * @param {Array} [out]
 * @returns {Array}
 */
ContextGL.prototype.getBlendFuncSeparate = function(out){
    return Vec4.set(out || Vec4.create(), this._blendState.blendFuncSeparate);
};

/*--------------------------------------------------------------------------------------------------------------------*/
// PROGRAM
/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * Program error representation.
 */
export class ProgramError extends Error{
    constructor(msg){
        super(msg);
        this.name = 'ProgramError';
    }
}

function strProgramErrorInvalidId(id){
    return `Invalid program id ${id}.`;
}

const STR_PROGRAM_ERROR_NOTHING_BOUND = 'No program active.';

function strProgramErrorNoValidUniform(name){
    return `Uniform '${name}' not present in program.`;
}

function strProgramErrorNotPresent(obj){
    return `${obj} not present in program.`;
}

/** INTERNAL **/

ContextGL.prototype._compileShaderSource = function(type,source){
    let shader = this._gl.createShader(type);

    this._gl.shaderSource(shader,source + '\n');
    this._gl.compileShader(shader);

    if(!this._gl.getShaderParameter(shader,this._gl.COMPILE_STATUS)){
        throw new Error(`${type === this._gl.VERTEX_SHADER ? 'Vertex' : 'Fragment'} shader error: ${this._gl.getShaderInfoLog(shader)}.`)
    }
    return shader;
};

ContextGL.prototype._updateProgram = function(id, vertSrc_or_vertAndFragSrc,
                                                  fragSrc_or_attribLocationBinding,
                                                  attribLocationBinding){
    const program = this._programs[id];

    if(program.handleVertexShader){
        //detach previous shaders for program reuse
        this._gl.detachShader(program.handle,program.handleVertexShader);
        this._gl.detachShader(program.handle,program.handleFragmentShader);
        //remove shader references
        program.handleVertexShader = null;
        program.handleFragmentShader = null;
    }

    let vertSrcPrefix = '';
    let fragSrcPrefix = '';

    let vertSrc = vertSrc_or_vertAndFragSrc;
    let fragSrc;
    let attribLocationBinding_;

    //vert and frag src in same string
    if(fragSrc_or_attribLocationBinding === undefined ||
       typeof fragSrc_or_attribLocationBinding === 'object'){
        vertSrcPrefix = '#define VERTEX_SHADER\n';
        fragSrcPrefix = '#define FRAGMENT_SHADER\n';
        fragSrc = vertSrc;
        attribLocationBinding_ = fragSrc_or_attribLocationBinding;

    //vert and frag src splitted
    } else {
        vertSrc = vertSrc_or_vertAndFragSrc;
        fragSrc = fragSrc_or_attribLocationBinding;
        attribLocationBinding_ = attribLocationBinding;
    }

    //validate user bindings
    if(attribLocationBinding_){
        const locations = [];
        for(let i = 0; i < attribLocationBinding_.length; ++i){
            const binding = attribLocationBinding_[i];
            if(binding.location === undefined){
                throw new ProgramError(`Attribute binding at index ${i} has no location specified.`);
            }
            if(binding.name === undefined){
                throw new ProgramError(`Attribute binding at index ${i} has no name specified.`);
            }
            if(locations.indexOf(binding.location) !== -1){
                throw new ProgramError(`Attribute binding at index ${i} has duplicate location ${binding.location}.`);
            }
            locations.push(binding.location);
        }
    //use default bindings
    } else {
        attribLocationBinding_ = ProgramDefaultAttribLocationBinding;
    }

    //compile and attach shaders
    program.handleVertexShader   = this._compileShaderSource(this._gl.VERTEX_SHADER,vertSrcPrefix + vertSrc);
    program.handleFragmentShader = this._compileShaderSource(this._gl.FRAGMENT_SHADER,fragSrcPrefix + fragSrc);

    this._gl.attachShader(program.handle,program.handleVertexShader);
    this._gl.attachShader(program.handle,program.handleFragmentShader);

    //track attribs bound by map
    let boundAttributeNames = [];
    for(let i = 0; i < attribLocationBinding_.length; ++i){
        const binding = attribLocationBinding_[i];
        this._gl.bindAttribLocation(
            program.handle,
            binding.location,
            binding.name
        );
        boundAttributeNames.push(binding.name);
    }

    //link program
    this._gl.linkProgram(program.handle);
    if(!this._gl.getProgramParameter(program.handle,this._gl.LINK_STATUS)){
        throw new ProgramError(`Program Error: ${this._gl.getProgramInfoLog(program.handle)}`);
    }

    //mark shader to be deleted
    this._gl.deleteShader(program.handleVertexShader);
    this._gl.deleteShader(program.handleFragmentShader);

    //get actual active program attribs
    const numAttributes = this._gl.getProgramParameter(program.handle,this._gl.ACTIVE_ATTRIBUTES);
    program.attributes = {};
    program.attributesPerLocation = {};

    for(let i = 0; i < numAttributes; ++i){
        const info = this._gl.getActiveAttrib(program.handle, i);
        const name = info.name;
        const attrib = program.attributes[name] = {
            //type value
            type : info.type,
            //type description
            typeName : GLEnumStringMap[info.type],
            //location
            location : this._gl.getAttribLocation(program.handle,name),
            //defined with attribLocationBinding
            bindingDefined : boundAttributeNames.indexOf(name) !== -1
        };
        //duplicate location binding, conflict user / default / auto
        if(!!program.attributesPerLocation[attrib.location]){
            throw new ProgramError(`Attribute with name ${name} bound to location already bound.`);
        }
        program.attributesPerLocation[attrib.location] = attrib;
    }

    //validate user set attribLocationBinding map
    if(attribLocationBinding_ !== ProgramDefaultAttribLocationBinding){
        for(let i = 0; i < attribLocationBinding_.length; ++i){
            const binding = attribLocationBinding_[i];
            if(program.attributes[binding.name] === undefined){
                throw new ProgramError(`Attribute with name '${binding.name}' and location ${binding.location} is not present in program.`);
            }
        }
    //remove non-existent default
    } else {
        for(let i = 0; i < attribLocationBinding_.length; ++i){
            const binding = attribLocationBinding_[i];
            if(program.attributes[binding.name]){
                continue;
            }
            delete program.attributes[binding.name];
        }
    }

    //check for unbound attributes
    for(const name in program.attributes){
        if(program.attributes[name].bindingDefined){
           continue;
        }
        //check if default binding available
        let defaultBinding = null;
        for(let i = 0; i < ProgramDefaultAttribLocationBinding.length; ++i){
            const binding = ProgramDefaultAttribLocationBinding[i];
            if(binding.name === name){
                defaultBinding = binding;
                break;
            }
        }
        //no binding defined
        if(!defaultBinding){
            throw new ProgramError(`Attribute binding not defined for attribute '${name}'.`);
        }
    }

    //get uniforms
    const numUniforms = this._gl.getProgramParameter(program.handle,this._gl.ACTIVE_UNIFORMS);
    program.uniforms = {};

    for(let i = 0; i < numUniforms; ++i){
        const info = this._gl.getActiveUniform(program.handle,i);
        const name = info.name;
        program.uniforms[name] = {
            //type value
            type : info.type,
            //type description
            typeName : GLEnumStringMap[info.type],
            //location
            location : this._gl.getUniformLocation(program.handle,name)
        };
    }

    //create uniform setter map
    const gl = this._gl;
    program.uniformSetterMap = {};
    for(let entry in program.uniforms){
        const type = program.uniforms[entry].type;
        if(program.uniformSetterMap[type] === undefined){
            switch (type){
                case this._gl.INT:
                case this._gl.BOOL:
                case this._gl.SAMPLER_2D:
                case this._gl.SAMPLER_CUBE:
                    program.uniformSetterMap[this._gl.INT] =
                        program.uniformSetterMap[this._gl.INT] ||
                        function setUniform_INT_BOOL_SAMPLER_2D_SAMPLER_CUBE(location,x,y,z,w){
                            if(x === undefined || y !== undefined){
                                throw new ProgramError(strWrongNumArgs(arguments.length,2));
                            }
                            gl.uniform1i(location,x);
                        };
                    program.uniformSetterMap[type] = program.uniformSetterMap[this._gl.INT];
                    break;

                case this._gl.FLOAT:
                    program.uniformSetterMap[type] =
                        function setUniform_FLOAT(location,x,y,z,w){
                            if(x === undefined || y !== undefined){
                                throw new ProgramError(strWrongNumArgs(arguments.length,2));
                            }
                            gl.uniform1f(location,x);
                        };
                    break;

                case this._gl.FLOAT_VEC2:
                    program.uniformSetterMap[type] =
                        function setUniform_FLOAT_VEC2(location,x,y,z,w){
                            if(x === undefined || z !== undefined){
                                throw new ProgramError(strWrongNumArgs(arguments.length,2,3));
                            }
                            if(y === undefined){
                                gl.uniform2fv(location,x);
                                return;
                            }
                            gl.uniform2f(location,x,y);
                        };
                    break;

                case this._gl.FLOAT_VEC3:
                    program.uniformSetterMap[type] =
                        function setUniform_FLOAT_VEC3(location,x,y,z,w){
                            if(x === undefined || w !== undefined || (y !== undefined && z === undefined)){
                                throw new ProgramError(strWrongNumArgs(arguments.length,1,3));
                            }
                            if(y === undefined){
                                gl.uniform3fv(location,x);
                                return;
                            }
                            gl.uniform3f(location,x,y,z);
                        };
                    break;

                case this._gl.FLOAT_VEC4:
                    program.uniformSetterMap[type] =
                        function setUniform_FLOAT_VEC3(location,x,y,z,w){
                            if(x === undefined || (y !== undefined && z === undefined) || (z !== undefined && w === undefined)){
                                throw new ProgramError(strWrongNumArgs(arguments.length,1,4));
                            }
                            if(y === undefined){
                                gl.uniform4fv(location,x);
                                return;
                            }
                            gl.uniform4f(location,x,y,z,w);
                        };
                    break;

                case this._gl.FLOAT_MAT2:
                    program.uniformSetterMap[type] =
                        function setUniform_FLOAT_MAT2(location,x,y,z,w){
                            if(x === undefined || y!== undefined){
                                throw new ProgramError(strWrongNumArgs(arguments.length,2));
                            }
                            gl.uniformMatrix2fv(location,false,x);
                        };
                    break;

                case this._gl.FLOAT_MAT3:
                    program.uniformSetterMap[type] =
                        function setUniform_FLOAT_MAT3(location,x,y,z,w){
                            if(x === undefined || y !== undefined){
                                throw new ProgramError(strWrongNumArgs(arguments.length,2));
                            }
                            gl.uniformMatrix3fv(location,false,x);
                        };
                    break;

                case this._gl.FLOAT_MAT4:
                    program.uniformSetterMap[type] =
                        function setUniform_FLOAT_MAT4(location,x,y,z,w){
                            if(x === undefined || y !== undefined){
                                throw new ProgramError(strWrongNumArgs(arguments.length,2));
                            }
                            gl.uniformMatrix4fv(location,false,x);
                        };
                    break;

                default:
                    throw new Error(`Program invalid uniform type '${type}'.`);
                    break;

            }
        }
    }
};

ContextGL.prototype._setProgramUniform = function(name,x,y,z,w){
    let program = this._programs[this._programActive];
    let uniform = program.uniforms[name];
    if(!uniform){
        throw new ProgramError(strProgramErrorNoValidUniform(name));
    }
    program.uniformSetterMap[uniform.type](uniform.location,x,y,z,w);
};

/**
 * Saves the current program binding.
 */
ContextGL.prototype.pushProgramBinding = function(newState){
    this._programStack.push(this._programActive);
    if(newState === undefined){
        return;
    }
    this.setProgram(newState);
};

/**
 * Restores the previously saved program binding.
 */
ContextGL.prototype.popProgramBinding = function(){
    if(this._programStack.length === 0){
        throw new Error(STR_ERROR_INVALID_STACK_POP);
    }
    this.setProgram(this._programStack.pop());
};

/**
 * Creates a program object.
 *
 * @example
 * //separate vertex and fragment source, attribute location definition
 * const program = ctx.createProgram(vertSrc,fragSrc,[
 *     {location: 0, name: 'aPosition'},
 *     {location: 1, name: 'aNormal'},
 *     {location: 2, name: 'aColor'}
 * ]);
 *
 * //unified vertex and fragment source, attribute location definition
 * const program = ctx.createProgram(vertAndFragSrc,[
 *     {location: 0, name: 'aPosition'},
 *     {location: 1, name: 'aNormal'},
 *     {location: 2, name: 'aColor'}
 * ]);
 *
 * //separate vertex and fragment source, defines attribute location with default bindings
 * const program = ctx.createProgram(vertSrc,fragSrc);
 *
 * //unified vertex and fragment source, defines attribute location with default bindings
 * const program = ctx.createProgram(vertAndFragSrc);
 *
 * @param vertSrc_or_vertAndFragSrc
 * @param [fragSrc_or_attribLocationBinding]
 * @param [attribLocationBinding]
 * @returns {number}
 */
ContextGL.prototype.createProgram = function(vertSrc_or_vertAndFragSrc,
                                             fragSrc_or_attribLocationBinding,
                                             attribLocationBinding){
    let id = this._uid++;
    this._programs[id] = {
        handle : this._gl.createProgram(),
        handleVertexShader : null,
        handleFragmentShader : null,
        attributes : {},
        attributesPerLocation : {},
        uniforms : {},
        uniformSetterMap : {}
    };
    if(vertSrc_or_vertAndFragSrc){
        this._updateProgram(
            id,
            vertSrc_or_vertAndFragSrc,
            fragSrc_or_attribLocationBinding,
            attribLocationBinding
        );
    }
    return id;
};

/**
 * Deletes a program object.
 * @param id
 */
ContextGL.prototype.deleteProgram = function(id){
    let program = this._programs[id];
    if(!program){
        throw new ProgramError(strProgramErrorInvalidId(id));
    }
    this._gl.deleteProgram(program.handle);
    delete this._programs[id];

    if(this._programActive === id){
        this.invalidateProgram();
    }
};

/**
 * Returns true if program is present.
 * @param id
 * @returns {boolean}
 */
ContextGL.prototype.hasProgram = function(id){
    return !!this._programs[id];
};

/**
 * Sets the current active program.
 * @param id
 */
ContextGL.prototype.setProgram = function(id){
    if(id === this._programActive){
        return;
    }
    if(id === null || id === undefined){
        this.invalidateProgram();
        return;
    }
    const program = this._programs[id];
    if(!program){
        throw new ProgramError(strProgramErrorInvalidId(id));
    }
    this._gl.useProgram(program.handle);
    this._programActive = id;

    //reset matrix send state
    this._matrixSend[MATRIX_PROJECTION]   = false;
    this._matrixSend[MATRIX_VIEW]         = false;
    this._matrixSend[MATRIX_MODEL]        = false;
    this._matrixSend[MATRIX_NORMAL]       = false;
    this._matrixSend[MATRIX_INVERSE_VIEW] = false;

    //extract all matrices in program
    this._matrixTypesByUniformInProgram = {};
    for(let entry in ProgramMatrixUniform){
        const uniformName = ProgramMatrixUniform[entry];
        if(!!program.uniforms[uniformName]){
            this._matrixTypesByUniformInProgram[uniformName] = this._matrixTypeByUniformNameMap[uniformName];
        }
    }

    //flag all matrices in program to be updated
    this._matrixTypesByUniformInProgramToUpdate = {};
    for(let entry in this._matrixTypesByUniformInProgram){
        this._matrixTypesByUniformInProgramToUpdate[entry] = this._matrixTypesByUniformInProgram[entry];
    }

    this._programHasAttribPosition = !!program.attributes[ATTRIB_NAME_POSITION];
    this._programHasAttribNormal = !!program.attributes[ATTRIB_NAME_NORMAL];
    this._programHasAttribColor = !!program.attributes[ATTRIB_NAME_COLOR];
    this._programHasAttribTexCoord = !!program.attributes[ATTRIB_NAME_TEX_COORD];
    this._programHasUniformPointSize = !!program.uniforms[UNIFORM_NAME_POINT_SIZE];
};

/**
 * Invalidates the current active program.
 */
ContextGL.prototype.invalidateProgram = function(){
    if(this._programActive === null){
        return;
    }
    this._gl.useProgram(null);
    this._programActive = null;
    this._matrixTypesByUniformInProgram = {};
    this._matrixTypesByUniformInProgramToUpdate = {};

    this._programHasAttribPosition = false;
    this._programHasAttribNormal = false;
    this._programHasAttribColor = false;
    this._programHasAttribTexCoord = false;
    this._programHasUniformPointSize = false;
};

/**
 * Returns the current active program, returns INVALID_ID if no program is active.
 * @returns {number|*}
 */
ContextGL.prototype.getProgram = function(){
    return this._programActive;
};

/**
 * Returns the program state.
 * @returns {*}
 */
ContextGL.prototype.getProgramInfo = function(id){
    let program;
    //active program
    if(id === undefined){
        if(this._programActive === INVALID_ID){
            throw new ProgramError(STR_PROGRAM_ERROR_NOTHING_BOUND)
        }
        program = this._programs[this._programActive];
    //specific program
    } else {
        program = this._programs[id];
        if(!program){
            throw new ProgramError(strProgramErrorInvalidId(id));
        }
    }
    return program;
};

/**
 * Updates the program shaders and attribute location bindings.
 * @param vertSrc_or_vertAndFragSrc
 * @param [fragSrc_or_attribLocationBinding]
 * @param [attribLocationBinding]
 */
ContextGL.prototype.updateProgram = function(vertSrc_or_vertAndFragSrc,
                                             fragSrc_or_attribLocationBinding,
                                             attribLocationBinding){
    if(this._programActive === INVALID_ID){
        throw new ProgramError(STR_PROGRAM_ERROR_NOTHING_BOUND);
    }
    this._updateProgram(
        this._programActive,
        vertSrc_or_vertAndFragSrc,
        fragSrc_or_attribLocationBinding,
        attribLocationBinding
    );
};

/**
 * Retutns true if program has uniform name.
 * @param name
 * @returns {boolean}
 */
ContextGL.prototype.hasProgramUniform = function(name){
    if(this._programActive === INVALID_ID){
        throw new ProgramError(STR_PROGRAM_ERROR_NOTHING_BOUND);
    }
    return !!this._programs[this._programActive].uniforms[name];
};

/**
 * Returns true if program has attribute location.
 * @param name
 * @returns {boolean}
 */
ContextGL.prototype.hasProgramAttributeLocation = function(name){
    if(this._programActive === INVALID_ID){
        throw new ProgramError(STR_PROGRAM_ERROR_NOTHING_BOUND);
    }
    return !!this._programs[this._programActive].attributes[name];
};

/**
 * Updates a program uniform
 * @param name
 * @param x
 * @param y
 * @param z
 * @param w
 */
ContextGL.prototype.setProgramUniform = function(name, x, y, z, w){
    if(this._programActive === INVALID_ID){
        throw new ProgramError(STR_PROGRAM_ERROR_NOTHING_BOUND);
    }
    this._setProgramUniform(name,x,y,z,w);
};

/**
 * Updates a group of program uniforms.
 * @param group
 */
ContextGL.prototype.setProgramUniformGroup = function(group){
    if(this._programActive === INVALID_ID){
        throw new ProgramError(STR_PROGRAM_ERROR_NOTHING_BOUND);
    }
    let program = this._programs[this._programActive];
    for(let name in group){
        let uniform = program.uniforms[name];
        if(!uniform){
            throw new ProgramError(strProgramErrorNoValidUniform(name));
        }
        program.uniformSetterMap[uniform.type](name,group[name]);
    }
};

/*--------------------------------------------------------------------------------------------------------------------*/
// BUFFER
/*--------------------------------------------------------------------------------------------------------------------*/

// ERROR

/**
 * Buffer error representation.
 */
export class BufferError extends Error{
    constructor(msg){
        super(msg);
        this.name = 'BufferError';
    }
}

// INTERNAL

function strBufferErrorInvalidId(id){
    return `Invalid buffer with id ${id}`;
}
function strBufferErrorNothingBound(target){
    return `No buffer for target '${target === WebGLStaticConstants.ARRAY_BUFFER ? 'ARRAY_BUFFER' :
                                    target === WebGLStaticConstants.ELEMENT_ARRAY_BUFFER ? 'ELEMENT_ARRAY_BUFFER' :
                                    'INVALID'}' bound.`
}

ContextGL.prototype._invalidateBuffer = function(target){
    if(this._bufferActive[target] === null){
        return;
    }
    this._gl.bindBuffer(target,null);
    this._bufferActive[target] = null;
};

ContextGL.prototype._createBuffer = function(target,size_or_data,usage,preserveData){
    target = target === undefined ? this._gl.ARRAY_BUFFER : target;
    usage  = usage  === undefined ? this._gl.STATIC_DRAW : usage;
    preserveData = preserveData === undefined ? false : preserveData;

    let id = this._uid++;
    this._buffers[target][id] = {
        handle : this._gl.createBuffer(),
        target : target,
        usage  : usage,
        usageName : null,
        length : 0,
        byteLength : 0,
        data : null,
        dataType : null,
        dataTypeName : null,
        preserveData : preserveData
    };

    //initial data upload
    if(size_or_data !== undefined && size_or_data !== 0){
        let prevId = this._bufferActive[target];
        this._setBuffer(target,id);
        this._setBufferData(target,id,size_or_data);
        if(prevId === INVALID_ID){
            this._invalidateBuffer(target);
        } else {
            this._setBuffer(target,prevId);
        }
    }
    return id;
};

ContextGL.prototype._deleteBuffer = function(target,id){
    let buffer = this._buffers[target][id];
    if(!buffer){
        throw new BufferError(id);
    }
    delete this._buffers[target][id];

    if(this._bufferActive[target] === id){
        this._bufferActive[target] = INVALID_ID;
        this._gl.bindBuffer(target,null);
    }
};

ContextGL.prototype._setBuffer = function(target, id){
    if(id === this._bufferActive[target]){
        return;
    }
    if(id === null){
        this._invalidateBuffer(target);
        return;
    }
    let buffer = this._buffers[target][id];
    if(!buffer){
        throw new BufferError(strBufferErrorInvalidId(id));
    }
    this._gl.bindBuffer(target,buffer.handle);
    this._bufferActive[target] = id;
};

ContextGL.prototype._setBufferData = function(target, id, size_or_data){
    const buffer = this._buffers[target][id];

    if(size_or_data === undefined){
        //reupload preserved data
        if(buffer.data){
            this._gl.bufferData(target,buffer.data,buffer.usage);
            return;
        }
        //ERROR no data or size or preserved data
        throw new Error('No size or data passed. Or no preserved data set.');
    }

    //update buffer state
    if(size_or_data !== buffer.data){
        //is typed data
        if(size_or_data.byteLength !== undefined){

            buffer.length = size_or_data.length;
            buffer.byteLength = size_or_data.byteLength;

            //update data type
            const data_ctor = size_or_data.constructor;
            if(target === this._gl.ARRAY_BUFFER){
                switch(data_ctor){
                    case Float32Array:
                        buffer.dataType = this._gl.FLOAT;
                        break;
                    case Uint8Array:
                        buffer.dataType = this._gl.UNSIGNED_BYTE;
                        break;
                    case Uint16Array:
                        buffer.dataType = this._gl.UNSIGNED_SHORT;
                        break;
                    case Uint32Array:
                        buffer.dataType = this._gl.UNSIGNED_INT;
                        break;
                    default:
                        throw new TypeError(`Unsupported data type '${data_ctor}'.`);
                        break;
                }
            } else {
                switch(data_ctor){
                    case Uint8Array:
                        buffer.dataType = this._gl.UNSIGNED_BYTE;
                        break;
                    case Uint16Array:
                        buffer.dataType = this._gl.UNSIGNED_SHORT;
                        break;
                    case Uint32Array:
                        buffer.dataType = this._gl.UNSIGNED_INT;
                        break;
                    default:
                        throw new TypeError(`Unsupported data type '${data_ctor}'.`);
                        break;
                }
            }
            buffer.targetName   = GLEnumStringMap[buffer.target];
            buffer.usageName    = GLEnumStringMap[buffer.usage];
            buffer.dataTypeName = GLEnumStringMap[buffer.dataType];

            //update with new preserved data
            if(buffer.preserveData && size_or_data){
                //new data is same length
                if(buffer.data !== null && buffer.data.length == size_or_data.length){
                    buffer.data.set(size_or_data);
                //new data has new length
                } else {
                    buffer.data = new data_ctor(size_or_data);
                }
            }
        //no data, reset and set length
        } else {
            buffer.length = size_or_data;
            buffer.byteLength = null;
            buffer.dataType = null;
            buffer.data = null;
        }
    }
    this._gl.bufferData(target,size_or_data,buffer.usage);
};

ContextGL.prototype._setBufferSubData = function(target, id, offset, data){
    let buffer = this._buffers[target][id];
    this._gl.bufferSubData(target,offset,data);

    if(buffer.preserveData && data !== buffer.data){
        offset = offset / buffer.data.BYTES_PER_ELEMENT;
        for(let i = 0; offset < buffer.data.length; ++i, offset+=1){
            buffer.data[offset] = data[i];
        }
    }
};

/**
 * Saves the current buffer binding state.
 */
ContextGL.prototype.pushBufferBinding = function(newState){
    this._bufferStack[this._gl.ARRAY_BUFFER].push(this._bufferActive[this._gl.ARRAY_BUFFER]);
    this._bufferStack[this._gl.ELEMENT_ARRAY_BUFFER].push(this._bufferActive[this._gl.ELEMENT_ARRAY_BUFFER]);
    if(newState === undefined){
        return;
    }
    if(newState.vertexBufferBinding){
        this.setVertexBuffer(newState.vertexBufferBinding);
    }
    if(newState.indexBufferBinding){
        this.setVertexBuffer(newState.indexBufferBinding);
    }
};

/**
 * Restores the previous buffer binding state.
 */
ContextGL.prototype.popBufferBinding = function(){
    if(this._bufferStack[this._gl.ARRAY_BUFFER].length === 0 ||
       this._bufferStack[this._gl.ELEMENT_ARRAY_BUFFER].length === 0){
        throw new Error(STR_ERROR_INVALID_STACK_POP);
    }
    this.setVertexBuffer(this._bufferStack[this._gl.ARRAY_BUFFER].pop());
    this.setIndexBuffer(this._bufferStack[this._gl.ELEMENT_ARRAY_BUFFER].pop());
};

// VERTEX BUFFER

/**
 * Creates a new vertex buffer.
 * @param size_or_data
 * @param usage
 * @param preserveData
 */
ContextGL.prototype.createVertexBuffer = function(size_or_data, usage, preserveData){
    return this._createBuffer(this._gl.ARRAY_BUFFER,size_or_data,usage,preserveData);
};

/**
 * Deletes a vertex buffer.
 * @param id
 */
ContextGL.prototype.deleteVertexBuffer = function(id){
    this._deleteBuffer(this._gl.ARRAY_BUFFER,id);
};

/**
 * Returns true if vertex buffer is present.
 * @param id
 * @returns {boolean}
 */
ContextGL.prototype.hasVertexBuffer = function(id){
    return !!this._buffers[this._gl.ARRAY_BUFFER][id];
};

/**
 * Sets the active vertex buffer.
 * @param id
 */
ContextGL.prototype.setVertexBuffer = function(id){
    this._setBuffer(this._gl.ARRAY_BUFFER,id);
};

/**
 * Returns the current active vertex buffer id.
 * @returns {Number}
 */
ContextGL.prototype.getVertexBuffer = function(){
    return this._bufferActive[this._gl.ARRAY_BUFFER];
};

/**
 * Allocates a size or copies vertex data into the data store.
 * @param {Number|Uint8Array|Uint16Array|Uint32Array|Float32Array} [size_or_data]
 */
ContextGL.prototype.setVertexBufferData = function(size_or_data){
    const target = this._gl.ARRAY_BUFFER;
    const id = this._bufferActive[target];
    if(id === INVALID_ID){
        throw new BufferError(strBufferErrorNothingBound(target));
    }
    this._setBufferData(target,this._bufferActive[target],size_or_data);
};

/**
 * Updates the vertex buffer internal preserved data.
 */
ContextGL.prototype.updateVertexBufferData = function(){
    //TODO: unroll
    this.setVertexBufferData();
};

/**
 * Redefines some or all of the data store.
 * @param {Number} offset - The offset into the buffers data store where the data replacement will begin, measure in bytes
 * @param {Uint8Array|Uint16Array|Uint32Array|Float32Array} data - The new data that will be copied into the data store
 */
ContextGL.prototype.setVertexBufferSubData = function(offset, data){
    const target = this._gl.ARRAY_BUFFER;
    const id = this._bufferActive[target];
    if(id === INVALID_ID){
        throw new BufferError(strBufferErrorNothingBound(target));
    }
    this._setBufferSubData(target,id,offset,data);
};

/**
 * Returns the data send to the vertex buffer. (Returns null if preserveData is set to false on creation)
 * @param {Number} [id] - Optional specific buffer
 * @returns {null|Uint8Array|Uint16Array|Uint32Array|Float32Array}
 */
ContextGL.prototype.getVertexBufferData = function(id){
    return this.getVertexBufferInfo(id).data;
};

/**
 * Returns vertex buffer´s data byte length.
 * @param {Number} [id] - Optional specific buffer
 * @returns {number|*|null|byteLength}
 */
ContextGL.prototype.getVertexBufferDataByteLength = function(id){
    return this.getVertexBufferInfo(id).byteLength;
};

/**
 * Returns vertex buffer´s data length.
 * @param {Number} [id] - Optional specific buffer
 * @returns {number|*|null|byteLength}
 */
ContextGL.prototype.getVertexBufferDataLength = function(id){
    return this.getVertexBufferInfo(id).length;
};

/**
 * Sets the usage pattern of the vertex buffer data store.
 * @param usage
 */
ContextGL.prototype.setVertexBufferUsage = function(usage){
    const target = this._gl.ARRAY_BUFFER;
    const id = this._bufferActive[target];
    if(id === INVALID_ID){
        throw new BufferError(strBufferErrorNothingBound(target));
    }
    this._buffers[target][id].usage = usage;
};

/**
 * Returns the usage pattern of the vertex data store set.
 * @params {Number} [id] - Optional specific vertex buffer
 * @returns {Number}
 */
ContextGL.prototype.getVertexBufferUsage = function(id){
    return this.getVertexBufferInfo(id).usage;
};

/**
 * Returns the current vertex buffer state.
 * @params {Number} [id] - Optional specific vertex buffer
 * @returns {*}
 */
ContextGL.prototype.getVertexBufferInfo = function(id){
    const target = this._gl.ARRAY_BUFFER;
    let buffer;
    //active program
    if(id === undefined){
        buffer = this._buffers[target][this._bufferActive[target]];
        if(!buffer){
            throw new BufferError(strBufferErrorNothingBound(target));
        }
    //specific program
    } else {
        buffer = this._buffers[target][id];
        if(!buffer){
            throw new BufferError(strBufferErrorInvalidId(id));
        }
    }
    return buffer;
};

// INDEX BUFFER

/**
 * Creates a new index buffer.
 * @param size_or_data
 * @param usage
 * @param preserveData
 */
ContextGL.prototype.createIndexBuffer = function(size_or_data, usage, preserveData){
    return this._createBuffer(this._gl.ELEMENT_ARRAY_BUFFER,size_or_data,usage,preserveData);
};

/**
 * Deletes a index buffer.
 * @param id
 */
ContextGL.prototype.deleteIndexBuffer = function(id){
    this._deleteBuffer(this._gl.ELEMENT_ARRAY_BUFFER,id);
};

/**
 * Returns true if index buffer is present.
 * @param id
 * @returns {boolean}
 */
ContextGL.prototype.hasIndexBuffer = function(id){
    return !!this._buffers[this._gl.ELEMENT_ARRAY_BUFFER][id];
};

/**
 * Sets the active index buffer.
 * @param id
 */
ContextGL.prototype.setIndexBuffer = function(id){
    this._setBuffer(this._gl.ELEMENT_ARRAY_BUFFER,id);
    //sync vertex array index buffer tracking
    const vertexArray = this._vertexArrayState.binding;
    if(vertexArray === INVALID_ID){
        return;
    }
    this._vertexArrays[vertexArray].indexBuffer = id;
};

/**
 * Returns the current active index buffer id.
 * @returns {Number}
 */
ContextGL.prototype.getIndexBuffer = function(){
    return this._bufferActive[this._gl.ELEMENT_ARRAY_BUFFER];
};

/**
 * Allocates a size or copies index data into the data store.
 * @param {Number|Uint8Array|Uint16Array|Uint32Array} [size_or_data]
 */
ContextGL.prototype.setIndexBufferData = function(size_or_data){
    const target = this._gl.ELEMENT_ARRAY_BUFFER;
    const id = this._bufferActive[target];
    if(id === INVALID_ID){
        throw new BufferError(strBufferErrorNothingBound(target));
    }
    this._setBufferData(target,this._bufferActive[target],size_or_data);
};

/**
 * Updates the index buffer internal preserved data.
 */
ContextGL.prototype.updateIndexBufferData = function(){
    //TODO: unroll
    this.setIndexBufferData();
};

/**
 * Redefines some or all of the data store.
 * @param {Number} offset - The offset into the buffers data store where the data replacement will begin, measure in bytes
 * @param {Uint8Array|Uint16Array|Uint32Array} data - The new data that will be copied into the data store
 */
ContextGL.prototype.setIndexBufferSubData = function(offset,data){
    const target = this._gl.ELEMENT_ARRAY_BUFFER;
    const id = this._bufferActive[target];
    if(id === INVALID_ID){
        throw new BufferError(strBufferErrorNothingBound(target));
    }
    this._setBufferSubData(target,id,offset,data);
};

/**
 * Returns the data send to the index buffer. (Returns null if preserveData is set to false on creation)
 * @param {Number} [id] - Optional specific buffer
 * @returns {null|Uint8Array|Uint16Array|Uint32Array}
 */
ContextGL.prototype.getIndexBufferData = function(id){
    return this.getIndexBufferInfo(id).data;
};

/**
 * Sets the usage pattern of the index buffer data store.
 * @param usage
 */
ContextGL.prototype.setIndexBufferUsage = function(usage){
    const target = this._gl.ELEMENT_ARRAY_BUFFER;
    const id = this._bufferActive[target];
    if(id === INVALID_ID){
        throw new BufferError(strBufferErrorNothingBound(target));
    }
    this._buffers[target][id].usage = usage;
};

/**
 * Returns the usage pattern of the index data store set.
 * @param {Number} [id] - Optional specific buffer
 * @returns {Number}
 */
ContextGL.prototype.getIndexBufferUsage = function(id){
    return this.getIndexBufferInfo(id).usage;
};

/**
 * Returns index buffer´s data byte length.
 * @param {Number} [id] - Optional specific buffer
 * @returns {number|*|null|byteLength}
 */
ContextGL.prototype.getIndexBufferDataLength = function(id){
    return this.getIndexBufferInfo(id).length;
};

/**
 * Returns index buffer´s data length.
 * @param {Number} [id] - Optional specific buffer
 * @returns {number|*|null|byteLength}
 */
ContextGL.prototype.getIndexBufferDataByteLength = function(id){
    return this.getIndexBufferInfo(id).byteLength;
};

/**
 * Returns the current vertex buffer state.
 * @params {Number} [id] - Optional specific index buffer
 * @returns {*}
 */
ContextGL.prototype.getIndexBufferInfo = function(id){
    const target = this._gl.ELEMENT_ARRAY_BUFFER;
    let buffer;
    //active program
    if(id === undefined){
        buffer = this._buffers[target][this._bufferActive[target]];
        if(!buffer){
            throw new BufferError(strBufferErrorNothingBound(target));
        }
    //specific program
    } else {
        buffer = this._buffers[target][id];
        if(!buffer){
            throw new BufferError(strBufferErrorInvalidId(id));
        }
    }
    return buffer;
};

/*--------------------------------------------------------------------------------------------------------------------*/
// VERTEX ARRAY
/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * Vertex error representation.
 */
export class VertexArrayError extends Error{
    constructor(msg){
        super(msg);
        this.name = 'VertexArrayError';
    }
}

const STR_VERTEX_ARRAY_ERROR_NOTHING_BOUND = 'No vertex array active';

function strVertexArrayErrorInvalidId(id){
    return `Invalid vertex array id ${id}.`;
}

function strVertexArrayErrorAttribPropMissing(name){
    return `Attribute property '${name}' missing.`;
}

function strVertexArrayErrorAttribPropInvalid(name){
    return `Attribute property '${name}' not valid.`;
}

function strVertexArrayErrorAttribLocDuplicate(location){
    return `Attribute at location '${location}' has already been defined.`;
}

// INTERNAL

const DefaultVertexArrayAttrib = Object.freeze({
    location : -1,
    buffer : -1,
    size : -1
});

const DefaultVertexAttrib = Object.freeze({
    enabled : true,
    location : -1,
    size : -1,
    type : null,
    normalized : false,
    stride : 0,
    offset : 0,
    divisor : null,
    prevEnabled : false
});

/**
 * Validates vertex array attributes.
 * @param vertexArray
 * @param attribute
 * @returns {{}}
 * @private
 */
ContextGL.prototype._validateVertexArrayAttrib = function(vertexArray,attribute){
    // check if attribute has all necessary initial properties
    // location, buffer, size
    for(let property in DefaultVertexArrayAttrib){
        if(attribute[property] === undefined){
            throw new VertexArrayError(
                strVertexArrayErrorAttribPropMissing(property)
            );
        }
    }
    // attribute validated
    let attribute_ = {};
    //Check if all passed parameters are valid (e.g. no typos)
    for(let property in attribute){
        let defaultProp = DefaultVertexAttrib[property];
        if(defaultProp === undefined && property !== 'buffer'){
            throw new VertexArrayError(
                strVertexArrayErrorAttribPropInvalid(property)
            );
        }
        attribute_[property] = attribute[property];
    }
    //Assign default values, if necessary
    for(let property in DefaultVertexAttrib){
        let defaultProp = DefaultVertexAttrib[property];
        if(attribute_[property] === undefined){
            attribute_[property] = defaultProp;
        }
    }
    //Check if location for that attribute is not taken already
    for(let bufferAttributeKey in vertexArray.attributes){
        let attributesPerBuffer = vertexArray.attributes[bufferAttributeKey];
        for(var j = 0; j < attributesPerBuffer.length; ++j){
            if(attributesPerBuffer[j].location === attribute.location){
                throw new VertexArrayError(
                    strVertexArrayErrorAttribLocDuplicate(attribute.location)
                );
            }
        }
    }
    return attribute_;
};

/**
 * Sets vertex buffer attributes, binds index buffer
 * @param vertexArray
 * @private
 */
ContextGL.prototype._vertexArraySetupBuffers = function(vertexArray){
    for(let i = 0; i < vertexArray.vertexBuffers.length; ++i){
        const bufferAttributes = vertexArray.attributesPerBuffer[i];
        this.setVertexBuffer(vertexArray.vertexBuffers[i]);
        for(let j = 0; j < bufferAttributes.length; ++j){
            const attribute = bufferAttributes[j];
            const location  = attribute.location;

            if(!attribute.enabled){
                this._gl.disableVertexAttribArray(location);
                continue;
            }

            this._gl.enableVertexAttribArray(location);
            this._gl.vertexAttribPointer(
                location,
                attribute.size,
                attribute.type,
                attribute.normalized,
                attribute.stride,
                attribute.offset
            );

            if(attribute.divisor === null){
                continue;
            }
            this._gl.vertexAttribDivisor(location,attribute.divisor);
        }
    }

    if(vertexArray.indexBuffer){
        this._setBuffer(this._gl.ELEMENT_ARRAY_BUFFER, vertexArray.indexBuffer);
    }
};

/**
 * Validates and adds buffer attributes to saved vertex array lookup object.
 * @param vertexArray
 * @param attributes
 * @param indexBuffer
 * @private
 */
ContextGL.prototype._vertexArrayAddBuffers = function(vertexArray,attributes,indexBuffer){
    for(let i = 0; i < attributes.length; ++i){
        const attribute = this._validateVertexArrayAttrib(vertexArray,attributes[i]);

        const buffer = attribute.buffer;
        let bufferIndex = vertexArray.vertexBuffers.indexOf(buffer);
        if(bufferIndex === -1){
            vertexArray.vertexBuffers.push(buffer);
            bufferIndex = vertexArray.vertexBuffers.length - 1;
            vertexArray.attributesPerBuffer[bufferIndex] = [];
        }

        attribute.type = this._buffers[this._gl.ARRAY_BUFFER][buffer].dataType;
        delete attribute.buffer;

        vertexArray.hasDivisor = vertexArray.hasDivisor || attribute.divisor !== null;
        vertexArray.attributesPerBuffer[bufferIndex].push(attribute);
        vertexArray.attributesPerLocation[attribute.location] = attribute;
    }

    //set index buffer
    if(indexBuffer && indexBuffer !== INVALID_ID){
        vertexArray.indexBuffer = indexBuffer;
    }
};

// shim

/**
 * Creates a shim vertex array and setup all the buffer attributes + index buffer bindings.
 * @param attributes
 * @param indexBuffer
 * @returns {number}
 * @private
 */
ContextGL.prototype._createVertexArrayShim = function(attributes,indexBuffer){
    if(!attributes){
        throw new ProgramError('No attributes passed.');
    } else if(!Array.isArray(attributes)){
        throw new ProgramError('Attribute argument type passed is not of type Array.')
    }

    const id = this._uid++;
    const vertexArray = this._vertexArrays[id] = {
        //attributes sorted by vertex buffer
        attributes : {},
        //attributes sorted by location
        attributesPerLocation : {},
        //vertexBuffer ids
        vertexBuffers : {},
        //indexBuffer id
        indexBuffer : null,
        hasDivisor : false
    };

    this.pushBufferBinding();
    this.pushVertexArrayBinding();
        this._vertexArrayState.binding = id;
        this._vertexArrayAddBuffers(vertexArray,attributes,indexBuffer);
        this._vertexArraySetupBuffers(vertexArray);
        console.assert(this.getGLError());
    this.popVertexArrayBinding();
    this.popBufferBinding();

    return id;
};

ContextGL.prototype._deleteVertexArrayShim = function(id){};

/**
 * Rebinds all shim buffers and resetups all locations.
 * @param id
 * @private
 */
ContextGL.prototype._setVertexArrayShim = function(id){
    if(id === this._vertexArrayState.binding){
        return;
    }
    if(id === null){
        this._invalidateVertexArrayShim();
        return;
    }
    const vertexArray = this._vertexArrays[id];
    if(!vertexArray){
        throw new VertexArrayError(strVertexArrayErrorInvalidId(id));
    }
    //rebind/setup all buffers, no vao here
    this._vertexArraySetupBuffers(vertexArray);
    this._vertexArrayState.binding = id;

    this._vertexArrayHasIndexBuffer = !!vertexArray.indexBuffer;
    this._vertexArrayIndexBufferDataType =
        this._vertexArrayHasIndexBuffer ?
        this._buffers[this._gl.ELEMENT_ARRAY_BUFFER][vertexArray.indexBuffer].dataType :
        null;
    this._vertexArrayHasDivisor = vertexArray.hasDivisor;
};

ContextGL.prototype._invalidateVertexArrayShim = function(){};

// native

/**
 * Creates a native vertex array and setup all the buffer attributes + index buffer bindings.
 * @param attributes
 * @param indexBuffer
 * @returns {number}
 * @private
 */
ContextGL.prototype._createVertexArrayNative = function(attributes,indexBuffer){
    if(!attributes){
        throw new ProgramError('No attributes passed.');
    } else if(!Array.isArray(attributes)){
        throw new ProgramError('Attribute argument type passed is not of type Array.')
    }

    const id = this._uid++;
    const vertexArray = this._vertexArrays[id] = {
        //webgl handle
        handle : this._gl.createVertexArray(),
        //attributes sorted by vertex buffer
        attributesPerBuffer : {},
        //attributes sorted by location
        attributesPerLocation : {},
        //vertexBuffer ids
        vertexBuffers : [],
        //indexBuffer id
        indexBuffer : null,
        hasDivisor : false
    };

    this.pushBufferBinding();
    this.pushVertexArrayBinding();
        this._vertexArrayState.binding = id;
        this._gl.bindVertexArray(vertexArray.handle);
        this._vertexArrayAddBuffers(vertexArray,attributes,indexBuffer);
        this._vertexArraySetupBuffers(vertexArray);
        console.assert(this.getGLError());
    this.popVertexArrayBinding();
    this.popBufferBinding();

    return id;
};

ContextGL.prototype._deleteVertexArrayNative = function(id){
    let vertexArray = this._vertexArrays[id];
    if(!vertexArray){
        throw new VertexArrayError(strVertexArrayErrorInvalidId(id));
    }
    this._gl.deleteVertexArray(vertexArray.handle);
    delete this._vertexArrays[id];

    if(this._vertexArrayState.binding === id){
        this._invalidateVertexArrayNative();
    }
};

/**
 * Binds a native vertex array.
 * @param id
 * @private
 */
ContextGL.prototype._setVertexArrayNative = function(id){
    if(id === this._vertexArrayState.binding){
        return;
    }
    if(id === null){
        this._invalidateVertexArrayNative();
        return;
    }
    const vertexArray = this._vertexArrays[id];
    if(!vertexArray){
        throw new VertexArrayError(strVertexArrayErrorInvalidId(id));
    }
    this._gl.bindVertexArray(vertexArray.handle);
    this._vertexArrayState.binding = id;

    this._vertexArrayHasIndexBuffer = !!vertexArray.indexBuffer;
    this._vertexArrayIndexBufferDataType =
        this._vertexArrayHasIndexBuffer ?
        this._buffers[this._gl.ELEMENT_ARRAY_BUFFER][vertexArray.indexBuffer].dataType :
        null;
    this._vertexArrayHasDivisor = vertexArray.hasDivisor;
    //sync internal vertex array representation
    this._bufferActive[this._gl.ELEMENT_ARRAY_BUFFER] = vertexArray.indexBuffer || null;
};

ContextGL.prototype._invalidateVertexArrayNative = function(){
    if(this._vertexArrayState.binding === null){
        return;
    }
    this._gl.bindVertexArray(null);
    this._vertexArrayState.binding = null;
    this._vertexArrayHasIndexBuffer = false;
    this._vertexArrayIndexBufferDataType = null;
    this._vertexArrayHasDivisor = false;
};

/**
 * Saves the current vertex array binding.
 */
ContextGL.prototype.pushVertexArrayBinding = function(newState){
    this._vertexArrayStack.push(this._vertexArrayState.copy());
    if(newState === undefined){
        return;
    }
    this.setVertexArray(newState.binding);
};

/**
 * Restores the previous vertex array binding.
 */
ContextGL.prototype.popVertexArrayBinding = function(){
    if(this._vertexArrayStack.length === 0){
        throw new Error(STR_ERROR_INVALID_STACK_POP);
    }
    this.setVertexArrayBindingState(this._vertexArrayStack.pop());
};

/**
 * Sets the current vertex array binding state.
 * @param state
 */
ContextGL.prototype.setVertexArrayBindingState = function(state){
    if(state.binding === undefined){
        return;
    }
    this.setVertexArray(state.binding);
};

/**
 * Returns a copy of the current vertex array binding state.
 * @returns {VertexArrayBindingState}
 */
ContextGL.prototype.getVertexArrayBindingState = function(){
    return this._vertexArrayState.copy();
};

/**
 * @example
 * const vertexArray = ctx.createVertexArray([
 *     {location: ctx.ATTRIB_POSITION, buffer: buffer0, size: 3, stride: 0, offset:0},
 *     {location: ctx.ATTRIB_NORMAL, buffer: buffer0, size: 3, stride: 0, offset: 4*3*4},
 *     {location: ctx.ATTRIB_COLOR, buffer: buffer1, size: 4}
 * ], indexBuffer);
 *
 * const vertexArray = ctx.createVertexArray([
 *     {location: ctx.ATTRIB_POSITION, buffer: buffer0, size: ctx.SIZE_VEC3},
 *     {location: ctx.ATTRIB_COLOR, buffer: buffer 1, size: ctx.SIZE_VEC4}
 * ]);
 *
 * @param attributes
 * @param indexBuffer
 */
ContextGL.prototype.createVertexArray = function(attributes,indexBuffer){
    // set depending on webgl capabilities on init
};

/**
 * Deletes a vertex array object.
 * @param id
 */
ContextGL.prototype.deleteVertexArray = function(id){
    // set depending on webgl capabilities on init
};

/**
 * Sets the current active vertex array.
 * @param id
 */
ContextGL.prototype.setVertexArray = function(id){
    // set depending on webgl capabilities on init
};

/**
 * Invalidates the current active vertex array.
 */
ContextGL.prototype.invalidateVertexArray = function(){
    // set depending on webgl capabilities on init
};

/**
 * Returns the current active vertex array, returns INVALID_ID if no program is active.
 * @returns {number|*}
 */
ContextGL.prototype.getVertexArray = function(){
    return this._vertexArrayState.binding;
};

/**
 * Returns true if vertex array is present.
 * @param id
 * @returns {boolean}
 */
ContextGL.prototype.hasVertexArray = function(id){
    return !!this._vertexArrays[id];
};

/**
 * Returns the vertex array state.
 * @returns {*}
 */
ContextGL.prototype.getVertexArrayInfo = function(id){
    let vertexArray;
    //active vertex array
    if(id === undefined){
        const bindingActive = this._vertexArrayState.binding;
        if(bindingActive === INVALID_ID){
            throw new VertexArrayError(STR_VERTEX_ARRAY_ERROR_NOTHING_BOUND);
        }
        vertexArray = this._vertexArrays[bindingActive];
    //specific vertex array
    } else {
        vertexArray = this._vertexArrays[id];
        if(!vertexArray){
            throw new VertexArrayError(strVertexArrayErrorInvalidId(id));
        }
    }
    return vertexArray;
};

/**
 * Returns true if the current vertex array has an index buffer bound.
 * @returns {boolean}
 */
ContextGL.prototype.hasVertexArrayIndexBuffer = function(){
    if(this._vertexArrayState.binding === INVALID_ID){
        throw new VertexArrayError(STR_VERTEX_ARRAY_ERROR_NOTHING_BOUND);
    }
    return !!this._vertexArrays[this._vertexArrayState.binding].indexBuffer;
};

/**
 * Returns the currently bound index buffer bound to the vertex array.
 * @returns {null|*}
 */
ContextGL.prototype.getVertexArrayIndexBuffer = function(){
    if(this._vertexArrayState.binding === INVALID_ID){
        throw new VertexArrayError(STR_VERTEX_ARRAY_ERROR_NOTHING_BOUND);
    }
    return this._vertexArrays[this._vertexArrayState.binding].indexBuffer;
};

/**
 * Returns true if the active vertex array has a divisor set.
 * @returns {boolean|*}
 */
ContextGL.prototype.vertexArrayHasDivisor = function(){
    if(this._vertexArrayState.binding === INVALID_ID){
        throw new VertexArrayError(STR_VERTEX_ARRAY_ERROR_NOTHING_BOUND);
    }
    return this._vertexArrays[this._vertexArrayState.binding].hasDivisor;
};

/*--------------------------------------------------------------------------------------------------------------------*/
// TEXTURE INTERNAL
/*--------------------------------------------------------------------------------------------------------------------*/

export class TextureError extends Error{
    constructor(msg){
        super(msg);
        this.name = 'TextureError';
    }
}

function strTextureErrorInvalidId(id){
    return `Invalid texture id ${id}.`;
}

function strTextureNotActive(id,textureUnit){
    return `Texture with id ${id} not active a texture unit ${textureUnit}`;
}

function strTextureInvalidSize(width,height){
    return `Invalid texture size: ${width}, ${height}.`;
}

function isSupportedTextureData(data){
    if(!data){
        return false;
    }
    return data instanceof Image || data instanceof ImageData ||
           data instanceof HTMLVideoElement || data instanceof HTMLCanvasElement;
}

const STR_TEXTURE_ERROR_NOTHING_BOUND = 'No texture active.';

const DefaultConfigTexture2d = Object.freeze({
    //The level of detail. Level 0 is the base image level and level n
    //is the nth mipmap reduction level
    level : 0,
    //data width/height
    width: null,
    height: null,
    //ignored
    border: false,
    borderWidth: 0,
    //shared wrap t/s
    wrap :  WebGLStaticConstants.REPEAT,
    //wrap parameter for s
    wrapS : null,
    //wrap parameter for t
    wrapT : null,
    //A GLint specifying the color components in the texture
    format: WebGLStaticConstants.RGBA,
    internalFormat: null,
    //type of the texel data
    dataType : WebGLStaticConstants.UNSIGNED_BYTE,
    //shared min mag filter
    minMagFilter : null,
    //filter applied when tex smaller then orig
    minFilter : WebGLStaticConstants.NEAREST,
    //filter applied when tex larger then orig
    magFilter : WebGLStaticConstants.LINEAR,
    //if true mipmap is generated
    flipY : true,
    mipmap : false
});

const DefaultConfigTexture2dData = Object.freeze({
    width: null,
    height: null,
    wrap : DefaultConfigTexture2d.wrap,
    wrapS : null,
    wrapT : null,
    format : DefaultConfigTexture2d.format,
    internalFormat : null,
    dataType : DefaultConfigTexture2d.dataType,
    minMagFilter : DefaultConfigTexture2d.minMagFilter,
    minFilter : null,
    magFilter : null,
    flipY : DefaultConfigTexture2d.flipY,
    mipmap : DefaultConfigTexture2d.mipmap
});

//target texture create internal
ContextGL.prototype._createTexture = function(target){
    const id = this._uid++;
    this._textures[id] = {
        handle : this._gl.createTexture(),
        target : target,
        unit: -1,
        width : null,
        height: null,
        level: 0,
        border: false,
        borderWidth: 0,
        internalFormat: null,
        format: null,
        internalFormatName : '',
        formatName : '',
        dataType: null,
        dataTypeName: '',
        wrapS: null,
        wrapT: null,
        wrapSName : '',
        wrapTName : '',
        minFilter: null,
        magFilter: null,
        minFilterName : '',
        magFilterName : '',
        mipmap : false
    };
    return id;
};

///texture delete internal
ContextGL.prototype._deleteTexture = function(id){
    this._gl.deleteTexture(this._textures[id].handle);
    delete this._textures[id];
};

ContextGL.prototype._setTextureBindingState = function(state){
    const textureActive = state.textureActive;
    for(let i = 0; i < this.MAX_TEXTURE_IMAGE_UNITS; ++i){
        const id = textureActive[i];
        if(!id){
            continue;
        }
        this.setTexture2d(state.textureActive[i],i);
    }
    this._textureState.textureUnitActive = state.textureUnitActive;
};

/*--------------------------------------------------------------------------------------------------------------------*/
// TEXTURE PUBLIC
/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * Saves the current texture binding.
 */
ContextGL.prototype.pushTextureBinding = function(newState){
    this._textureStack.push(this._textureState.copy());
    if(newState === undefined){
        return;
    }
    this._setTextureBindingState(newState);
};

/**
 * Restores the previous texture binding.
 */
ContextGL.prototype.popTextureBinding = function(){
    if(this._textureStack.length === 0){
        throw new Error(STR_ERROR_INVALID_STACK_POP);
    }
    this._setTextureBindingState(this._textureStack.pop());
};

/**
 * Returns a copy of the current texture binding state.
 * @returns {TextureState}
 */
ContextGL.prototype.getTextureBindingState = function(){
    return this._textureState.copy();
};

/**
 * Creates a 2d texture.
 * @param data_or_config
 * @param config
 */
ContextGL.prototype.createTexture2d = function(data_or_config,config){
    let data = null;
    if(config === undefined){
        //only data passed
        if(isSupportedTextureData(data_or_config)){
            data = data_or_config;
        //assuming only config passed
        } else {
            config = data_or_config;
        }
    //data and config passed
    } else {
        data = data_or_config;
    }
    config = validateOption(config,DefaultConfigTexture2d);

    const id = this._createTexture(this._gl.TEXTURE_2D);
    this._textures[id].level = config.level;

    const dataConfig = {};
    for(const key in DefaultConfigTexture2dData){
        dataConfig[key] = config[key];
    }

    this.pushTextureBinding();
        this.setTexture2d(id);
        this.setTexture2dData(data,dataConfig);
        ////TODO: compressed texture
        ////TODO: mipmap
        console.assert(this.getGLError());
    this.popTextureBinding();

    return id;
};

/**
 * Sets the active texture 2d.
 * @param id
 * @param textureUnit
 */
ContextGL.prototype.setTexture2d = function(id,textureUnit){
    textureUnit = textureUnit || 0;
    if(id === this._textureState.textureActive[textureUnit]){
        return;
    }
    const texture = this._textures[id];
    if(!texture){
        throw new TextureError(strTextureErrorInvalidId(id));
    }
    //update active unit
    if(textureUnit !== this._textureState.textureUnitActive){
        this._gl.activeTexture(this._gl.TEXTURE0 + textureUnit);
        this._textureState.textureUnitActive = textureUnit;
    }
    //bind
    this._gl.bindTexture(this._gl.TEXTURE_2D, texture.handle);
    this._textureState.textureActive[textureUnit] = id;
    texture.unit = textureUnit;
};

/**
 * Initializes the current texture2d data setup.
 * @param data
 * @param config
 */
ContextGL.prototype.setTexture2dData = function(data,config){
    const id = this._textureState.textureActive[this._textureState.textureUnitActive];
    if(!id){
        throw new TextureError(strTextureNotActive(id,this._textureState.textureUnitActive));
    }
    const texture = this._textures[id];
    if(!texture){
        throw new TextureError(strTextureErrorInvalidId(id))
    }
    config = validateOption(config,DefaultConfigTexture2dData);

    //wrap
    const wrap = config.wrap;
    const wrapT = config.wrapT || wrap;
    const wrapS = config.wrapS || wrap;
    if(texture.wrapS !== wrapS){
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, wrapS);
        texture.wrapS = wrapS;
        texture.wrapSName = glEnumToString(wrapS);
    }
    if(texture.wrapT !== wrapT){
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, wrapT);
        texture.wrapT = wrapT;
        texture.wrapTName = glEnumToString(wrapT);
    }

    //filter
    const filter = config.filter;
    const filterMag = config.magFilter || filter;
    let filterMin = config.minFilter;
    //validate filter set for mipmap
    if(config.mipmap){
        if(filterMin && filterMin !== this._gl.NEAREST_MIPMAP_LINEAR &&
                        filterMin !== this._gl.NEAREST_MIPMAP_NEAREST &&
                        filterMin !== this._gl.LINEAR_MIPMAP_LINEAR){
            throw new TextureError(`Invalid mipmap minFilter '${glEnumToString(filterMin)}'`);
        } else {
            filterMin = filterMin || this._gl.NEAREST_MIPMAP_LINEAR;
        }
    } else {
        filterMin = filterMin || filter;
    }
    texture.mipmap = config.mipmap;

    if(texture.minFilter !== filterMin){
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, filterMin);
        texture.minFilter = filterMin;
        texture.minFilterName = glEnumToString(filterMin);
    }
    if(texture.magFilter !== filterMag){
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, filterMag);
        texture.magFilter = filterMag;
        texture.magFilterName = glEnumToString(filterMag);
    }

    //format
    const format = config.format;
    const formatInternal = config.internalFormat || format;
    if(this._glVersion === WEBGL_1_VERSION && format !== formatInternal){
        //TODO: throw
        console.warn('format !== internalFormat');
    }
    if(texture.format !== format){
        texture.format = format;
        texture.formatName = glEnumToString(format);
    }
    if(texture.internalFormat !== formatInternal){
        texture.internalFormat = formatInternal;
        texture.internalFormatName = glEnumToString(format);
    }
    
    //flip
    const flipY = config.flipY;
    if(data){
        this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, flipY);
    }
    texture.flipY = flipY;

    //dataType
    const dataType = config.dataType;
    if(dataType !== texture.dataType){
        texture.dataType = dataType;
        texture.dataTypeName = glEnumToString(dataType);
    }

    //data size
    let width  = config.width || 0;
    let height = config.height || 0;

    //data from Image, ImageData, Video, Canvas
    if(isSupportedTextureData(data)){
        width  = !width  ? (data.width || data.videoWidth || 0) : width;
        height = !height ? (data.height || data.videoHeight || 0) : height;

        if(!width || !height){
            throw new TextureError(strTextureInvalidSize(width,height));
        }
        this._gl.texImage2D(
            this._gl.TEXTURE_2D,
            texture.level, texture.internalFormat, texture.format,
            texture.dataType, data
        );

    //create texture with size, empty or with data
    } else {
        if(!width || !height){
            throw new TextureError(strTextureInvalidSize(width,height));
        }
        this._gl.texImage2D(
            this._gl.TEXTURE_2D,
            texture.level, texture.internalFormat,
            width, height,
            0, texture.format, texture.dataType, data || null
        );
    }

    texture.width = width;
    texture.height = height;

    if(texture.mipmap){
        this._gl.generateMipmap(this._gl.TEXTURE_2D);
    }
};

/**
 * Sets the active textures min and mag filter.
 * @param min_or_minMagFilter
 * @param magFilter
 */
ContextGL.prototype.setTexture2dFilter = function(min_or_minMagFilter, magFilter){
    const id = this._textureState.textureActive[this._textureState.textureUnitActive];
    if(!id){
        throw new TextureError(strTextureNotActive(id,this._textureState.textureUnitActive));
    }
    const texture = this._textures[id];
    if(!texture){
        throw new TextureError(strTextureErrorInvalidId(id));
    }
    magFilter = magFilter === undefined ? min_or_minMagFilter : magFilter;

    if(texture.minFilter !== min_or_minMagFilter){
        this._gl.texParameteri(texture.target, this._gl.TEXTURE_MIN_FILTER, min_or_minMagFilter);
        texture.minFilter = min_or_minMagFilter;
    }
    if(texture.magFilter !== magFilter){
        this._gl.texParameteri(texture.target, this._gl.TEXTURE_MAG_FILTER, magFilter);
        texture.magFilter = magFilter;
    }
};

/**
 * Updates texture2d data, must be initialized previously.
 * @param data
 */
ContextGL.prototype.updateTexture2dData = function(data){
    const id = this._textureState.textureActive[this._textureState.textureUnitActive];
    if(!id){
        throw new TextureError(strTextureNotActive(id,this._textureState.textureUnitActive));
    }
    const texture = this._textures[id];
    if(!texture){
        throw new TextureError(strTextureErrorInvalidId(id))
    }
    if(data instanceof Image || data instanceof ImageData ||
       data instanceof HTMLVideoElement || data instanceof HTMLCanvasElement){
        this._gl.texImage2D(
            this._gl.TEXTURE_2D,
            texture.level, texture.internalFormat, texture.format,
            texture.dataType, data
        );
    } else {
        this._gl.texImage2D(
            this._gl.TEXTURE_2D,
            texture.level, texture.internalFormat,
            texture.width, texture.height,
            0, texture.format, texture.dataType, data || null
        );
    }
};

/**
 * Deletes a texture.
 * @param id
 */
ContextGL.prototype.deleteTexture2d = function(id){
    const texture = this._textures[id];
    if(!texture){
        throw new TextureError(strTextureErrorInvalidId(id));
    }

    for(const unit in this._textureState.textureActive){
        const unit_ = +unit;
        if(this._textureState.textureActive[unit_] === id){
            this._textureState.textureActive[unit_] = null;
            this._gl.activeTexture(this._gl.TEXTURE0 + unit_);
            this._gl.bindTexture(this._gl.TEXTURE_2D, texture.handle);
        }
    }

    this._deleteTexture(id);
    this._gl.activeTexture(this._gl.TEXTURE0 + this._textureState.textureUnitActive);
};

/**
 * Returns a textures current state.
 * @param id
 * @returns {*}
 */
ContextGL.prototype.getTexture2dInfo = function(id){
    let texture;
    //active texture
    if(id === undefined){
        texture = this._textures[this._textureState.textureActive[this._textureState.textureUnitActive]];
        if(!texture){
            throw new TextureError(STR_TEXTURE_ERROR_NOTHING_BOUND);
        }
    //specific texture
    } else {
        texture = this._textures[id];
        if(!texture){
            throw new TextureError(strTextureErrorInvalidId(id));
        }
    }
    return texture;
};

/**
 * Returns the textures size.
 * @param id_or_out
 * @param out
 * @returns {*}
 */
ContextGL.prototype.getTexture2dSize = function(id_or_out,out){
    if(id_or_out === undefined || Array.isArray(id_or_out)){
        const texture = this.getTexture2dInfo();
        return Vec2.set2(id_or_out || Vec2.create(),texture.width,texture.height);
    }
    const texture = this.getTexture2dInfo(id_or_out);
    return Vec2.set2(out || Vec2.create(),texture.width,texture.height);
};

/**
 * Returns the textures bounds.
 * @param id_or_out
 * @param out
 * @returns {*}
 */
ContextGL.prototype.getTexture2dBounds = function(id_or_out,out){
    if(id_or_out === undefined || Array.isArray(id_or_out)){
        const texture = this.getTexture2dInfo();
        return Rect.set4(id_or_out || Rect.create(),0,0,texture.width,texture.height);
    }
    const texture = this.getTexture2dInfo(id_or_out);
    return Rect.set4(out || Rect.create(),0,0,texture.width,texture.height);
};

/**
 * Returns true if the texture exists.
 * @param id
 * @returns {boolean}
 */
ContextGL.prototype.hasTexture2d = function(id){
    return !!this._textures[id];
};

/**
 * Returns the current active texture at a specific texture unit.
 * @param textureUnit
 * @returns {*|null}
 */
ContextGL.prototype.getTexture2d = function(textureUnit){
    textureUnit = textureUnit === undefined ? this._textureState.textureUnitActive : textureUnit;
    return this._textureState.textureActive[textureUnit] || null;
};

/**
 * Returns the current active texture unit.
 * @returns {*}
 */
ContextGL.prototype.getTextureUnitActive = function(){
    return this._textureState.textureUnitActive;
};

/*--------------------------------------------------------------------------------------------------------------------*/
// RENDERBUFFER
/*--------------------------------------------------------------------------------------------------------------------*/

ContextGL.prototype._createRenderbufferRAW = function(){
    const id = this._uid++;
    this._renderbuffers[id] = this._gl.createRenderbuffer();
    return id;
};

ContextGL.prototype._deleteRenderbufferRAW = function(id){
    this._gl.deleteRenderbuffer(this._renderbuffers[id]);
    delete this._renderbuffers[id];
};

/*--------------------------------------------------------------------------------------------------------------------*/
// FRAMEBUFFER INTERNAL
/*--------------------------------------------------------------------------------------------------------------------*/

export class FramebufferError extends Error{
    constructor(msg){
        super(msg);
        this.name = 'FramebufferError';
    }
}

function strFramebufferInvalidId(id){
    return `Invalid framebuffer id ${id}.`;
}

function strFrambufferInvalidAttachmentPoint(attachmentPoint){
    return `Invalid attachment point ${attachmentPoint}.`
}

const STR_FRAME_BUFFER_ERROR_NOTHING_BOUND = 'No framebuffer active.';

const DefaultConfigFramebufferColorAttachment = Object.freeze({
    minMagFilter: WebGLStaticConstants.NEAREST,
    wrap: WebGLStaticConstants.CLAMP_TO_EDGE
});

const DefaultConfigFramebufferDepthAttachment = Object.freeze({
    minMagFilter: DefaultConfigFramebufferColorAttachment.minMagFilter,
    wrap : DefaultConfigFramebufferColorAttachment.wrap,
    format : WebGLStaticConstants.DEPTH_STENCIL,
    dataType: WebGLStaticConstants.UNSIGNED_INT
});

const DefaultConfigFramebufferDepthStencilAttachment = Object.freeze({
    minMagFilter: DefaultConfigFramebufferColorAttachment.minMagFilter,
    wrap: DefaultConfigFramebufferColorAttachment.wrap,
    format: WebGLStaticConstants.DEPTH_COMPONENT
    //dataType from capabilities
});

const DefaultConfigFramebuffer = Object.freeze({
    //optional width - default: drawingBufferWidth
    width: null,
    //optional height - default: drawingBufferHeight
    height: null,
    //creates a single default color attachment
    colorAttachments: true,
    //if default or no specific color texture source used
    colorAttachmentDataType: null,
    //number of auto color attachments
    numColorAttachments: 1,
    //creates a default depth attachment
    depthAttachment: true,
    //data type for depth only attachment, UNSIGNED_SHORT || UNSIGNED_INT
    depthAttachmentDataType: WebGLStaticConstants.UNSIGNED_INT,
    //creates a default depth stencil attachment
    depthStencilAttachment: false,
    //if true all attachments will be deleted if the framebuffer gets disposed
    deleteAttachments : true,
    //if true, renderbuffers will be used as depth and stencil attachmnents
    forceFallbackDepthStencilAttachment: false
});

//set on draw buffers extension check or webgl2
ContextGL.prototype._setFramebufferColorAttachment = null;

//not webgl2 or drawbuffers extension not supported
ContextGL.prototype._setFramebufferColorAttachmentDrawBuffersNotSupported = function(texture, attachmentPoint, mipmapLevel){
    attachmentPoint = attachmentPoint || 0;
    if(attachmentPoint > 0){
        throw new FramebufferError('Draw buffers extension not supported. Only 1 attachment point available.');
    }
    this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0,
        texture.target, texture.handle,
        mipmapLevel || 0
    );
};

//webgl2 or drawbuffers extension supported
ContextGL.prototype._setFramebufferColorAttachmentDrawBuffersSupported = function(texture, attachmentPoint, mipmapLevel){
    attachmentPoint = attachmentPoint || 0;
    if((attachmentPoint + 1) > this.MAX_COLOR_ATTACHMENTS){
        throw new FramebufferError(`Invalid attachment point ${attachmentPoint}. Max attachment points supported: ${this.MAX_COLOR_ATTACHMENTS}.`);
    }
    this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0 + attachmentPoint,
        texture.target, texture.handle,
        mipmapLevel || 0
    );
};

ContextGL.prototype._checkFramebufferStatus = function(framebuffer){
    if (!this._gl.isFramebuffer(framebuffer)) {
        throw new FramebufferError("Invalid framebuffer.");
    }
    const status = this._gl.checkFramebufferStatus(this._gl.FRAMEBUFFER);
    if(status !== this._gl.FRAMEBUFFER_COMPLETE){
        throw new FramebufferError(`Incomplete framebuffer: ${glEnumToString(status)}`);
    }
};

ContextGL.prototype._getFramebufferAttachment = function(framebuffer,attachmentPoint){
    attachmentPoint = attachmentPoint || 0;
    const glAttachmentPoint = this._gl.COLOR_ATTACHMENT0 + attachmentPoint;
    const attachmentIndex = framebuffer.attachmentPoints.indexOf(glAttachmentPoint);
    const attachment = framebuffer.colorAttachments[attachmentIndex];
    if(!attachment){
        throw new FramebufferError(strFrambufferInvalidAttachmentPoint(attachmentPoint));
    }
    return attachment;
};

/*--------------------------------------------------------------------------------------------------------------------*/
// FRAMEBUFFER PUBLIC
/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * Invalidate the current framebuffer, equal to ctx.setFramebuffer(null).
 */
ContextGL.prototype.invalidateFramebuffer = function(){
    if(this._framebufferActive === null){
        return;
    }
    this._gl.bindFramebuffer(this._gl.FRAMEBUFFER,null);
    this._framebufferActive = null;
};

/**
 * Saves the current framebuffer array binding.
 */
ContextGL.prototype.pushFramebufferBinding = function(newState){
    this._framebufferStack.push(this._framebufferActive);
    if(newState === undefined){
        return;
    }
    this.setFramebuffer(newState);
};

/**
 * Restores the previous framebuffer binding.
 */
ContextGL.prototype.popFramebufferBinding = function(){
    if(this._framebufferStack.length === 0){
        throw new Error(STR_ERROR_INVALID_STACK_POP);
    }
    this.setFramebuffer(this._framebufferStack.pop());
};

/**
 * Creates a framebuffer.
 * @example
 * //Creates a framebuffer the size of the drawing buffer with one default color and a depth attachment.
 * const framebuffer = cctx.createFrameBuffer();
 *
 * //creates a framebuffer the size of the drawing buffer with 3 color attachments and depth attachment.
 * const framebuffer = ctx.createFramebuffer({
 *     colorAttachment: true,
 *     numColorAttachment: 3.
 *     depthAttachment: true
 * });
 *
 * //creates a framebuffer with specific size and one default color attachment and depth attachment.
 * const framebuffer = ctx.createFramebuffer({
 *     width: 800,
 *     height:600
 * });
 *
 * //Creates a framebuffer from source color attachment textures, size depends on textures passed.
 * const framebuffer = ctx.createFramebuffer([
 *     {attachmentPoint: 0, texture: texture0},
 *     {attachmentPoint: 1, texture: texture1}
 * ]);
 *
 * @param attachments_or_config
 */
ContextGL.prototype.createFramebuffer = function(attachments_or_config){
    const id = this._uid++;
    const framebuffer = this._framebuffers[id] = {
        handle: this._gl.createFramebuffer(),
        //color attachment textures or texture
        colorAttachments : [],
        attachmentPoints : [],
        //stencilDepth texture or renderbuffer
        depthStencilAttachment: null,
        //depth attachment texture or renderbuffer
        depthAttachment: null,
        //delete attachments on dispose
        deleteAttachments : true
    };

    attachments_or_config = attachments_or_config || Object.assign({},DefaultConfigFramebuffer);

    this.pushFramebufferBinding();
        this.setFramebuffer(id);

        //CREATE FROM CONFIG
        let width;
        let height;

        if(!Array.isArray(attachments_or_config)){
            const config = validateOption(attachments_or_config,DefaultConfigFramebuffer);

            config.depthAttachmentFormat = config.depthAttachmentFormat || this.UNSIGNED_INT_24_8;

            width = config.width === null ? this._gl.drawingBufferWidth : config.width;
            height = config.height === null ? this._gl.drawingBufferHeight : config.height;

            //Generate auto attachments
            if(config.colorAttachments ||
               config.depthAttachment ||
               config.depthStencilAttachment){
                //validate width
                if(width <= 0 || height <= 0){
                    throw new FramebufferError(`Invalid size ${width},${height}.`);
                }

                //Create auto color attachments
                if(config.colorAttachments && config.numColorAttachments > 0){
                    const numAttachments = config.numColorAttachments === undefined ? 1 : config.numColorAttachments;
                    const config_ = {
                        width : width,
                        height : height,
                        minMagFilter : this._gl.NEAREST,
                        wrap : this._gl.CLAMP_TO_EDGE
                        //format: null, //to be set
                        //dataType : null //to be set
                    };
                    for(let i = 0; i < numAttachments; ++i){
                        const textureId = this.createTexture2d(config_);
                        const texture = this._textures[textureId];
                        //throws if above MAX_COLOR_ATTACHMENTS
                        this._setFramebufferColorAttachment(texture, i, 0);
                        framebuffer.colorAttachments.push(textureId);
                        framebuffer.attachmentPoints.push(this._gl.COLOR_ATTACHMENT0 + i);
                    }
                    this._gl.drawBuffers(framebuffer.attachmentPoints);
                    this._checkFramebufferStatus(framebuffer.handle);
                }

                //Create auto depth attachments
                if(config.depthAttachment || config.depthStencilAttachment){
                    let depthStencil_or_depthAttachment;

                    //create auto depth,stencil attachments via texture
                    if(this._glVersion === WEBGL_2_VERSION || this._glCapabilites.DEPTH_TEXTURE){
                        const config_ = {
                            width : width,
                            height : height,
                            minMagFilter : this._gl.NEAREST,
                            wrap : this._gl.CLAMP_TO_EDGE,
                            format : null,
                            dataType : null
                        };

                        let attachmentPoint;
                        //depth stencil attachment
                        if(config.depthStencilAttachment){
                            config_.format = this._gl.DEPTH_STENCIL;
                            //depth bits >= 24, stencil bits >= 8
                            config_.dataType = this.UNSIGNED_INT_24_8;
                            attachmentPoint = this._gl.DEPTH_STENCIL_ATTACHMENT;
                        //only only depth attachment
                        }else{
                            config_.format = this._gl.DEPTH_COMPONENT;
                            //depth bits >= 16
                            config_.dataType = config.depthAttachmentDataType || this._gl.UNSIGNED_INT;
                            attachmentPoint = this._gl.DEPTH_ATTACHMENT;
                        }
                        //create and attach texture to framebuffer
                        const textureId = this.createTexture2d(config_);
                        const texture = this._textures[textureId];
                        this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, attachmentPoint, this._gl.TEXTURE_2D,
                            texture.handle, 0);

                        if(framebuffer.colorAttachments.length > 0){
                            this._checkFramebufferStatus(framebuffer.handle);
                        }
                        depthStencil_or_depthAttachment = textureId;

                    //Create auto depth,stencil attachments via renderbuffers
                    }else{
                        //render buffer binding currently not managed,
                        const renderbufferPrev = this._gl.getParameter(this._gl.RENDERBUFFER);
                        const renderbufferId = this._createRenderbufferRAW();
                        const renderbuffer = this._renderbuffers[renderbufferId];

                        let internalFormat;
                        let attachmentPoint;

                        //depth stencil attachment
                        if(config.depthStencilAttachment){
                            internalFormat = this._gl.DEPTH_STENCIL;
                            attachmentPoint = this._gl.DEPTH_STENCIL_ATTACHMENT;
                        //only depth attachment
                        }else{
                            internalFormat = this._gl.DEPTH_COMPONENT16;
                            attachmentPoint = this._gl.DEPTH_ATTACHMENT;
                        }

                        this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, renderbuffer);
                        this._gl.renderbufferStorage(this._gl.RENDERBUFFER, internalFormat, width, height);
                        this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, renderbufferPrev);

                        this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, attachmentPoint, this._gl.RENDERBUFFER, renderbuffer)

                        this._checkFramebufferStatus(framebuffer.handle);
                        depthStencil_or_depthAttachment = renderbufferId;
                    }

                    if(config.depthStencilAttachment){
                        framebuffer.depthStencilAttachment = depthStencil_or_depthAttachment;
                    } else {
                        framebuffer.depthAttachment = depthStencil_or_depthAttachment;
                    }
                }
            }
            framebuffer.width = width;
            framebuffer.height = height;
            framebuffer.deleteAttachments = config.deleteAttachments;

        //CREATE FROM SPECIFIC ATTACHMENTS
        } else {
            const attachments = attachments_or_config;

            width = Number.MAX_VALUE;
            height = Number.MAX_VALUE;
            for(let i = 0;i < attachments.length; ++i){
                const attachment = attachments[i];

                //validate attachment config
                for(let key in attachment){
                    if(key !== 'attachmentPoint' && key !== 'texture'){
                        throw new FramebufferError(`Invalid attachment config key '${key}'.`);
                    }
                }

                //texture missing
                if(attachment.texture === undefined){
                    throw new FramebufferError(`No attachment source defined at attachment index ${i}.`);
                }
                const textureId = attachment.texture;
                const texture = this._textures[textureId];

                //texture not existing
                if(!texture){
                    throw new FramebufferError(`Invalid texture passed`);
                }
                const attachmentPoint = attachment.attachmentPoint || 0;
                const glAttachmentPoint = this._gl.COLOR_ATTACHMENT0 + attachmentPoint;

                //attachmentPoint already taken, only validated with createFramebuffer
                if(framebuffer.attachmentPoints.indexOf(glAttachmentPoint) !== -1){
                    throw new FramebufferError(`Duplicate attachment point ${attachmentPoint} at attachment index ${i}.`)
                }
                //add attachment
                this._setFramebufferColorAttachment(texture,attachmentPoint);
                framebuffer.colorAttachments.push(textureId);
                framebuffer.attachmentPoints.push(glAttachmentPoint);

                //update fbo size
                width  = Math.min(texture.width,width);
                height = Math.min(texture.height,height);
            }
            this._gl.drawBuffers(framebuffer.attachmentPoints);
            this._checkFramebufferStatus(framebuffer.handle);
            framebuffer.width = width;
            framebuffer.height = height;
        }
    this.popFramebufferBinding();
    return id;
};

/**
 * Sets the current framebuffer.
 * @param id
 */
ContextGL.prototype.setFramebuffer = function(id){
    if(id === this._framebufferActive){
        return;
    } else if(id === null || id === undefined){
        this.invalidateFramebuffer();
        return;
    }
    const framebuffer = this._framebuffers[id];
    if(!framebuffer){
        throw new FramebufferError(strFramebufferInvalidId(id));
    }
    this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, framebuffer.handle);
    this._framebufferActive = id;
};

/**
 * Returns the current active framebuffer
 * @returns {null|*}
 */
ContextGL.prototype.getFramebuffer = function(){
    return this._framebufferActive;
};

/**
 * Sets a framebuffer color attachment.
 * @param texture
 * @param attachmentPoint
 */
//TODO: What happens to existing attachments?
ContextGL.prototype.setFramebufferColorAttachment = function(texture, attachmentPoint){
    if(this._framebufferActive === null){
        throw new FramebufferError(STR_FRAME_BUFFER_ERROR_NOTHING_BOUND);
    }
    const glAttachmentPoint = this._gl.COLOR_ATTACHMENT0 + (attachmentPoint || 0);
    const framebuffer = this._framebuffers[this._framebufferActive];
    const texture_ = this.getTexture2dInfo(texture);
    const attachmentIndex = framebuffer.attachmentPoints.indexOf(glAttachmentPoint);
    this._setFramebufferColorAttachment(texture_,attachmentPoint);
    if(attachmentIndex === -1){
        framebuffer.colorAttachments.push(texture);
        framebuffer.attachmentPoints.push(glAttachmentPoint);
        if(this._glVersion === WEBGL_2_VERSION || this._glCapabilites.DRAW_BUFFERS){
            this._gl.drawBuffers(framebuffer.attachmentPoints);
        }
        return;
    }
    framebuffer.colorAttachments[attachmentIndex] = texture;
};

/**
 * Returns a framebuffers color attachment.
 * @param framebuffer_or_attachment
 * @param attachmentPoint
 * @returns {*}
 */
ContextGL.prototype.getFramebufferColorAttachment = function(framebuffer_or_attachment,attachmentPoint){
    let framebuffer;
    if(attachmentPoint === undefined){

        //return active framebuffer color attachment 0
        if(framebuffer_or_attachment === this._framebufferActive){
            return this._getFramebufferAttachment(this._framebuffers[this._framebufferActive]);
        }

        framebuffer = this._framebuffers[framebuffer_or_attachment];

        //return selected framebuffer color attachment 0
        if(framebuffer){
            return this._getFramebufferAttachment(framebuffer);

        //return active framebuffer color attachment selected
        } else {
            framebuffer = this._framebuffers[this._framebufferActive];
            if(!framebuffer){
                throw new FramebufferError(STR_FRAME_BUFFER_ERROR_NOTHING_BOUND);
            }
            return this._getFramebufferAttachment(framebuffer,framebuffer_or_attachment);
        }
    }

    //return selected frambebuffer with selected attachment
    framebuffer = this._framebuffers[framebuffer_or_attachment];
    if(!framebuffer){
        throw new FramebufferError(strFramebufferInvalidId(framebuffer_or_attachment));
    }
    return this._getFramebufferAttachment(framebuffer,attachmentPoint);
};

/**
 * Sets a framebuffers depth attachment.
 * @param texture
 */
//TODO: what happens to the already existing depth attachment?
//TODO: split unsported / supported func
ContextGL.prototype.setFramebufferDepthAttachment = function(texture){
    if(!this._glCapabilites.DEPTH_TEXTURE){
        throw new FramebufferError(`Depth texture attachment not supported.`);
    }
    if(!this._framebufferActive){
        throw new FramebufferError(STR_FRAME_BUFFER_ERROR_NOTHING_BOUND);
    }
    const framebuffer = this._framebuffers[this._framebufferActive];
    const texture_ = this.getTexture2dInfo(texture);
    //validate data type
    if(texture_.dataType !== this._gl.UNSIGNED_SHORT &&
       texture_.dataType !== this._gl.UNSIGNED_INT){
        throw new FramebufferError(`Unsupported depth texture data type '${glEnumToString(texture_.dataType)}'. Supported data types are ${glEnumToString(this._gl.UNSIGNED_SHORT)}, ${glEnumToString(this._gl.UNSIGNED_INT)}.`);
    }
    //validate format
    if(texture_.format !== this._gl.DEPTH_COMPONENT &&
       texture_.internalFormat !== this._gl.DEPTH_COMPONENT){
        throw new FramebufferError(`Unsupported format '${glEnumToString(texture_.format)}','${glEnumToString(texture_.internalFormat)}'. Supported data format is ${glEnumToString(this._gl.DEPTH_COMPONENT)}`);
    }
    //attach
    this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT, this._gl.TEXTURE_2D,texture_.handle, 0);
    framebuffer.depthAttachment = texture;

    if(framebuffer.colorAttachments.length === 0){
        return;
    }
    this._checkFramebufferStatus(framebuffer.handle);
};

/**
 * Returns a framebuffers depth attachment.
 * @param framebuffer
 * @returns {boolean}
 */
ContextGL.prototype.getFramebufferDepthAttachment = function(framebuffer){
    return this.getFramebufferInfo(framebuffer).stencilDepth_or_depthAttachment;
};

/**
 * Sets a framebuffers depth stencil attachment.
 * @param texture
 */
//TODO: what happens to the already existing depth attachment?
//TODO: split unsupported / supported func
ContextGL.prototype.setFramebufferDepthStencilAttachment = function(texture){
    if(!this._glCapabilites.DEPTH_TEXTURE){
        throw new FramebufferError(`Depth stencil texture attachment not supported.`);
    }
    if(!this._framebufferActive){
        throw new FramebufferError(STR_FRAME_BUFFER_ERROR_NOTHING_BOUND);
    }
    const framebuffer = this._framebuffers[this._framebufferActive];
    const texture_ = this.getTexture2dInfo(texture);
    this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.DEPTH_STENCIL_ATTACHMENT, this._gl.TEXTURE_2D,texture_.handle, 0);
    framebuffer.depthAttachment = texture;

    if(framebuffer.colorAttachments.length === 0){
        return;
    }
    this._checkFramebufferStatus(framebuffer.handle);
};

/**
 * Returns a frambuffers depth stencil attachment.
 * @param framebuffer
 * @returns {boolean}
 */
ContextGL.prototype.getFramebufferDepthStencilAttachment = function(framebuffer){
    return this.getFramebufferInfo(framebuffer).depthStencilAttachment;
};

/**
 * Returns the size of the current active or a specific framebuffer, the smallest size gets returned.
 * @param id_or_out
 * @param out
 */
ContextGL.prototype.getFramebufferSize = function(id_or_out,out){
    if(id_or_out === undefined || Array.isArray(id_or_out)){
        const framebuffer = this.getFramebufferInfo(id_or_out);
        return Vec2.set2(id_or_out || Vec2.create(), framebuffer.width, framebuffer.height);
    }
    const framebuffer = this.getFramebufferInfo(id_or_out);
    return Vec2.set2(out || Vec2.create(), framebuffer.width, framebuffer.height);
};

/**
 * Returns the bound of the current active or a specific framebuffer, the smallest bounds get returned.
 * @param id_or_out
 * @param out
 * @returns {*}
 */
ContextGL.prototype.getFramebufferBounds = function(id_or_out,out){
    if(id_or_out === undefined || Array.isArray(id_or_out)){
        const framebuffer = this.getFramebufferInfo(id_or_out);
        return Rect.set4(id_or_out || Rect.create(),0,0,framebuffer.width,framebuffer.height);
    }
    const framebuffer = this.getFramebufferInfo(id_or_out);
    return Rect.set4(out || Rect.create(),0,0,framebuffer.width,framebuffer.height);
};

/**
 * Deletes a framebuffer.
 * @param id
 */
ContextGL.prototype.deleteFramebuffer = function(id){
    const framebuffer = this._framebuffers[id];
    if(!framebuffer){
        throw new FramebufferError(strFramebufferInvalidId(id));
    }

    //TODO: Add active texture invalidation
    if(framebuffer.deleteAttachments){
        for(let i = 0; i < framebuffer.colorAttachments.length; ++i){
            this._deleteTexture(framebuffer.colorAttachments[i]);
        }
        const depthStencil_or_depthAttachment = framebuffer.depthStencilAttachment || framebuffer.depthAttachment;
        if(depthStencil_or_depthAttachment){
            if(this._glVersion === WEBGL_2_VERSION || this._glCapabilites.DEPTH_TEXTURE){
                this._deleteTexture(depthStencil_or_depthAttachment)
            } else {
                this._deleteRenderbufferRAW(depthStencil_or_depthAttachment);
            }
        }
    }

    this._gl.deleteFramebuffer(this._framebuffers[id].handle);
    delete this._framebuffers[id];

    if(this._framebufferActive === id){
        this.invalidateFramebuffer();
    }
};

/**
 * Returns true it the framebuffer exists.
 * @param id
 * @returns {boolean}
 */
ContextGL.prototype.hasFramebuffer = function(id){
    return !!this._framebuffers[id];
};

/**
 * Returns the current frambuffer state.
 * @param id
 * @returns {*}
 */
ContextGL.prototype.getFramebufferInfo = function(id){
    let framebuffer;
    //active framebuffer
    if(id === undefined){
        framebuffer = this._framebuffers[this._framebufferActive];
        if(!framebuffer){
            throw new FramebufferError(STR_FRAME_BUFFER_ERROR_NOTHING_BOUND);
        }
    //specific framebuffer
    } else {
        framebuffer = this._framebuffers[id];
        if(!framebuffer){
            throw new FramebufferError(strFramebufferInvalidId(id));
        }
    }
    return framebuffer;
};

/*--------------------------------------------------------------------------------------------------------------------*/
// BLIT FRAME BUFFER
/*--------------------------------------------------------------------------------------------------------------------*/

// internal

ContextGL.prototype._getBlitFramebufferInfo = function(framebuffer, mask_or_attachmentPoint, out){
    if(framebuffer === undefined){
        throw new Error('No framebuffer specified.');
    }
    const framebuffer_ = this._framebuffers[framebuffer];
    if(!framebuffer_){
        throw new FramebufferError(strFramebufferInvalidId(framebuffer));
    }
    mask_or_attachmentPoint = mask_or_attachmentPoint || 0;

    let attachment;
    switch(mask_or_attachmentPoint){
        // depth attachment
        case this._gl.DEPTH_ATTACHMENT:
            if(!framebuffer_.depthAttachment){
                throw new FramebufferError('Framebuffer has no depth attachment.');
            }
            attachment = framebuffer_.depthAttachment;
            break;
        // depth stencil attachment
        case this._gl.DEPTH_STENCIL_ATTACHMENT:
            if(!framebuffer_.depthStencilAttachment){
                throw new FramebufferError('Framebuffer has no depth stencil attachment.');
            }
            attachment = framebuffer_.depthStencilAttachment;
            break;
        //color attachment
        default:
            const attachmentIndex = framebuffer_.attachmentPoints.indexOf(this._gl.COLOR_ATTACHMENT0 + mask_or_attachmentPoint);
            if(attachmentIndex === -1){
                throw new FramebufferError(strFrambufferInvalidAttachmentPoint(mask_or_attachmentPoint));
            }
            attachment = framebuffer_.colorAttachments[attachmentIndex];
            break;
    }

    out[0] = framebuffer_;
    out[1] = attachment;
    return out;
};

ContextGL.prototype._blitFramebufferAttachmentToScreen = function(
    attachment,
    srcOffsetx,srcOffsety,srcScalex,srcScaley,dstx,dsty,dstWidth,dstHeight
){
    const state =
        this.VERTEX_ARRAY_BINDING_BIT |
        this.ARRAY_BUFFER_BINDING_BIT |
        this.ELEMENT_ARRAY_BUFFER_BINDING_BIT |
        this.TEXTURE_BINDING_BIT |
        this.PROGRAM_BINDING_BIT |
        this.DEPTH_BIT |
        this.VIEWPORT_BIT;

    this.pushState(state);
        this.setProgram(this._programBlit);
        this.setProgramUniform('uOffsetScale',srcOffsetx,srcOffsety,srcScalex,srcScaley);
        this.setDepthTest(false);
        this.setViewport4(dstx,dsty,dstWidth,dstHeight);
        this.setTexture2d(attachment);
        this.setVertexArray(this._vertexArrayBlitRect);
        this.drawArrays(this._gl.TRIANGLE_FAN,0,4);
    this.popState(state);
};

/**
 * Blits a complete framebuffer attachment to screen.
 * @param framebuffer
 * @param bounds
 * @param mask_or_attachmentPoint
 */
ContextGL.prototype.blitFullFramebufferToScreen = function(framebuffer,bounds,mask_or_attachmentPoint){
    this.blitFullFramebufferToScreen2(framebuffer,bounds[0],bounds[1],bounds[2],bounds[3],mask_or_attachmentPoint);
};

/**
 * Blits a complete framebuffer attachment to screen.
 * @param framebuffer
 * @param x
 * @param y
 * @param width
 * @param height
 * @param mask_or_attachmentPoint
 */
ContextGL.prototype.blitFullFramebufferToScreen2 = function(framebuffer,x,y,width,height,mask_or_attachmentPoint){
    const info = this._getBlitFramebufferInfo(framebuffer,mask_or_attachmentPoint,TEMP_VEC2_0);
    const attachment = info[1];

    this._blitFramebufferAttachmentToScreen(attachment,0,0,1,1,x,y,width,height);
};

/**
 * Blits a frambuffer attachment region to screen.
 * @param framebuffer
 * @param srcBounds
 * @param dstBounds_or_mask_or_attachmentPoint
 * @param mask_or_attachmentPoint
 */
ContextGL.prototype.blitFramebufferToScreen = function(framebuffer,srcBounds,dstBounds_or_mask_or_attachmentPoint,mask_or_attachmentPoint){
    let dstBounds;
    if(mask_or_attachmentPoint === undefined){
        if(Array.isArray(dstBounds_or_mask_or_attachmentPoint)){
            dstBounds = dstBounds_or_mask_or_attachmentPoint;
        } else{
            dstBounds = srcBounds;
            mask_or_attachmentPoint = 0;
        }
    }
    this.blitFramebufferToScreen2(
        framebuffer,
        srcBounds[0], srcBounds[1], srcBounds[0] + srcBounds[2], srcBounds[1] + srcBounds[3],
        dstBounds[0], dstBounds[1], dstBounds[0] + dstBounds[2], dstBounds[1] + dstBounds[3],
        mask_or_attachmentPoint
    );
};

/**
 * Blits a frambuffer attachment region to screen.
 * @param framebuffer
 * @param srcx0
 * @param srcy0
 * @param srcx1
 * @param srcy1
 * @param dstx0
 * @param dsty0
 * @param dstx1
 * @param dsty1
 * @param mask_or_attachmentPoint
 */
ContextGL.prototype.blitFramebufferToScreen2 = function(framebuffer,srcx0,srcy0,srcx1,srcy1,dstx0,dsty0,dstx1,dsty1,mask_or_attachmentPoint){
    const info = this._getBlitFramebufferInfo(framebuffer,mask_or_attachmentPoint,TEMP_VEC2_0);
    const framebuffer_ = info[0];
    const attachment = info[1];

    const width = framebuffer_.width;
    const height = framebuffer_.height;

    const srcWidth = srcx1 - srcx0;
    const srcHeight = srcy1 - srcy0;
    const dstWidth = dstx1 - dstx0;
    const dstHeight = dsty1 - dsty0;

    const srcOffsetx = srcx0 / width;
    const srcOffsety = srcy0 / height;
    const srcScalex  = srcWidth / width;
    const srcScaley  = srcHeight / height;

    this._blitFramebufferAttachmentToScreen(
        attachment,
        srcOffsetx,srcOffsety,srcScalex,srcScaley,
        dstx0,dsty0,dstWidth,dstHeight
    )
};

/*--------------------------------------------------------------------------------------------------------------------*/
// DRAW BUFFERS
/*--------------------------------------------------------------------------------------------------------------------*/

ContextGL.prototype._drawBuffersSupported = function(buffers){
    this._gl.drawBuffers(buffers);
};

ContextGL.prototype._drawBuffersNotSupported = function(buffers){
    throw new Error('WebGL drawBuffers not supported.');
};

ContextGL.prototype.drawBuffers = function(buffers){};

/*--------------------------------------------------------------------------------------------------------------------*/
// MATRIX STACK
/*--------------------------------------------------------------------------------------------------------------------*/

// INTERNAL

ContextGL.prototype._setAutoUploadMatrix = function(type,enable){
    if(this._matrixTypesByUniformInProgram[type] !== undefined){
        throw new ProgramError(strProgramErrorNotPresent(type));
    }
    if(enable){
        if(this._matrixTypesByUniformInProgramToUpdate[type] !== undefined){
            return;
        }
        this._matrixTypesByUniformInProgramToUpdate[type] = this._matrixTypesByUniformInProgram[type];
        return;
    }
    if(this._matrixTypesByUniformInProgramToUpdate[type] === undefined){
        return;
    }
    delete this._matrixTypesByUniformInProgramToUpdate[type];
};

ContextGL.prototype._getMatrixStack = function(mode,out){
    let stack = this._matrixStack[mode];
    out.length = stack.length;
    for(let i = 0; i < out.length; ++i){
        out[i] = stack[i].slice(0);
    }
    return out;
};

/**
 * Returns a copy of the current projection matrix stack.
 * @param [out]
 */
ContextGL.prototype.getProjectionMatrixStack = function(out){
    return this._getMatrixStack(MATRIX_PROJECTION_BIT,out || []);
};

/**
 * Returns a copy of the current view matrix stack.
 * @param [out]
 */
ContextGL.prototype.getViewMatrixStack = function(out){
    return this._getMatrixStack(MATRIX_VIEW_BIT, out || []);
};

/**
 * Returns a copy of the current model matrix stack.
 * @param [out]
 */
ContextGL.prototype.getModelMatrixStack = function(out){
    return this._getMatrixStack(MATRIX_MODEL_BIT,out || []);
};

/**
 * Sets the projection matrix to ortho and resets view and model matrix.
 * @param size
 * @param topleft
 */
ContextGL.prototype.setWindowMatrices = function(size,topleft){
    this.setWindowMatrices2(size[0],size[1],topleft);
};

/**
 * Sets the projection matrix to ortho and resets view and model matrix.
 * @param width
 * @param height
 * @param topleft
 */
ContextGL.prototype.setWindowMatrices2 = function(width,height,topleft){
    topleft = topleft === undefined ? true : topleft;
    this.loadIdentities();
    if(topleft){
        Mat44.ortho(this._matrix[MATRIX_PROJECTION],0,width,height,0,-1,1);
    } else {
        Mat44.ortho(this._matrix[MATRIX_PROJECTION],0,width,0,height,-1,1);
    }
};

/**
 * Sets the projection matrix to be used.
 * @param {Array} matrix
 */
ContextGL.prototype.setProjectionMatrix = function(matrix){
    Mat44.set(this._matrix[MATRIX_PROJECTION],matrix);
    this._matrixSend[MATRIX_PROJECTION] = false;
};

/**
 * Sets the view matrix to be used.
 * @param {Array} matrix
 */
ContextGL.prototype.setViewMatrix = function(matrix){
    Mat44.set(this._matrix[MATRIX_VIEW],matrix);
    this._matrixSend[MATRIX_VIEW] = false;
};

/**
 * Set the model matrix to be used.
 * @param {Array} matrix
 */
ContextGL.prototype.setModelMatrix = function(matrix){
    Mat44.set(this._matrix[MATRIX_MODEL],matrix);
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Returns the current projection matrix.
 * @param {Array} [out]
 * @returns {Array|Float32Array}
 */
ContextGL.prototype.getProjectionMatrix = function(out){
    return Mat44.set(out || Mat44.create(),this._matrix[MATRIX_PROJECTION]);
};

/**
 * Returns the current view matrix.
 * @param {Array} [out]
 * @returns {Array}
 */
ContextGL.prototype.getViewMatrix = function(out){
    return Mat44.set(out || Mat44.create(),this._matrix[MATRIX_VIEW]);
};

/**
 * Returns the current model matrix.
 * @param {Array} [out]
 * @returns {Array}
 */
ContextGL.prototype.getModelMatrix = function(out){
    return Mat44.set(out || Mat44.create(),this._matrix[MATRIX_MODEL]);
};

/**
 * Pushes the current projection matrix on the projection matrix stack.
 */
ContextGL.prototype.pushProjectionMatrix = function(){
    this._matrixStack[MATRIX_PROJECTION_BIT].push(Mat44.copy(this._matrix[MATRIX_PROJECTION]));
};

/**
 * Replaces the current projection matrix with the matrix previously pushed on the stack and removes the top.
 */
ContextGL.prototype.popProjectionMatrix = function(){
    this._matrix[MATRIX_PROJECTION] = this._matrixStack[MATRIX_PROJECTION_BIT].pop();
    this._matrixSend[MATRIX_PROJECTION] = false;
};

/**
 * Pushes the current view matrix on the view matrix stack.
 */
ContextGL.prototype.pushViewMatrix = function(){
    this._matrixStack[MATRIX_VIEW_BIT].push(Mat44.copy(this._matrix[MATRIX_VIEW]));
};

/**
 * Replaces the current view matrix with the matrix previously pushed on the stack and removes the top.
 */
ContextGL.prototype.popViewMatrix = function(){
    this._matrix[MATRIX_VIEW] = this._matrixStack[MATRIX_VIEW_BIT].pop();
    this._matrixSend[MATRIX_VIEW] = false;
};

/**
 * Pushes the current model matrix on the model matrix stack.
 */
ContextGL.prototype.pushModelMatrix = function(){
    this._matrixStack[MATRIX_MODEL_BIT].push(Mat44.copy(this._matrix[MATRIX_MODEL]));
};

/**
 * Replaces the current model matrix with the matrix previously pushed on the stack and removes the top.
 */
ContextGL.prototype.popModelMatrix = function(){
    this._matrix[MATRIX_MODEL] = this._matrixStack[MATRIX_MODEL_BIT].pop();
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Pushes all matrices on their stack.
 */
ContextGL.prototype.pushMatrices = function(){
    this.pushProjectionMatrix();
    this.pushViewMatrix();
    this.pushModelMatrix();
};

/**
 * Replaces all matrices with the matrices previously pushed on the stack and removes the top.
 */
ContextGL.prototype.popMatrices = function(){
    this.popModelMatrix();
    this.popViewMatrix();
    this.popProjectionMatrix();
};

/**
 * Resets the current model matrix to its identity.
 */
ContextGL.prototype.loadIdentity = function(){
    Mat44.identity(this._matrix[MATRIX_MODEL]);
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Resets all matrices to their identities.
 */
ContextGL.prototype.loadIdentities = function(){
    Mat44.identity(this._matrix[MATRIX_PROJECTION]);
    this._matrixSend[MATRIX_PROJECTION] = false;
    Mat44.identity(this._matrix[MATRIX_VIEW]);
    this._matrixSend[MATRIX_VIEW] = false;
    this.loadIdentity();
};

/**
 * Scales the current model matrix.
 * @param {Array} v
 */
ContextGL.prototype.scale = function(v){
    Mat44.scale(this._matrix[MATRIX_MODEL],v);
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Scales the current model matrix.
 * @param x
 * @param y
 * @param z
 */
ContextGL.prototype.scale3 = function(x,y,z){
    Mat44.scale3(this._matrix[MATRIX_MODEL],x,y,z);
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Scales the current model matrix.
 * @param xyz
 */
ContextGL.prototype.scale1 = function(xyz){
    Mat44.scale3(this._matrix[MATRIX_MODEL],xyz,xyz,xyz);
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Translates the current model matrix.
 * @param {Array} v
 */
ContextGL.prototype.translate = function(v){
    Mat44.translate(this._matrix[MATRIX_MODEL],v);
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Translates the current model matrix.
 * @param x
 * @param y
 */
ContextGL.prototype.translate2 = function(x,y){
    Mat44.translate3(this._matrix[MATRIX_MODEL],x,y,0);
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Translates the current model matrix.
 * @param x
 * @param y
 * @param z
 */
ContextGL.prototype.translate3 = function(x,y,z){
    Mat44.translate3(this._matrix[MATRIX_MODEL],x,y,z);
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Rotates the current model matrix with angle and axis.
 * @param {Number} angle
 * @param {Array} v
 */
ContextGL.prototype.rotate = function(angle,v){
    Mat44.rotate(this._matrix[MATRIX_MODEL],angle,v);
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Rotates the current model matrix with rotation per axis.
 * @param {Array} v
 */
ContextGL.prototype.rotateXYZ = function(v){
    Mat44.rotateXYZ(this._matrix[MATRIX_MODEL],v);
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Rotates the current model matrix with rotation per axis.
 * @param x
 * @param y
 * @param z
 */
ContextGL.prototype.rotateXYZ3 = function(x,y,z){
    Mat44.rotateXYZ3(this._matrix[MATRIX_MODEL],x,y,z);
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Rotates the current model matrix with a quaternion.
 * @param {Array} q
 */
ContextGL.prototype.rotateQuat = function(q){
    Mat44.mult(this._matrix[MATRIX_MODEL],Mat44.setRotationFromQuat(this._matrix44Temp,q));
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Multiplies the current model matrix with another matrix.
 * @param {Array} m
 */
ContextGL.prototype.multMatrix = function(m){
    Mat44.mult(this._matrix[MATRIX_MODEL],m);
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Enables / disables auto uploading the projection matrix to the active program.
 * @param enable
 */
ContextGL.prototype.setAutoUploadProjectionMatrix = function(enable){
    this._setAutoUploadMatrix(MATRIX_PROJECTION,enable);
};

/**
 * Enables / disables auto uploading the view matrix to the active program.
 * @param enable
 */
ContextGL.prototype.setAutoUploadViewMatrix = function(enable){
    this._setAutoUploadMatrix(MATRIX_VIEW,enable);
};

/**
 * Enables / disables auto uploading the model matrix to the active program.
 * @param enable
 */
ContextGL.prototype.setAutoUploadModelMatrix = function(enable){
    this._setAutoUploadMatrix(MATRIX_MODEL,enable);
};

/*--------------------------------------------------------------------------------------------------------------------*/
// DRAW
/*--------------------------------------------------------------------------------------------------------------------*/

ContextGL.prototype._updateMatrixUniforms = function(){
    //update normal matrix from view and model matrix
    if(this._matrixTypesByUniformInProgramToUpdate[ProgramMatrixUniform.NORMAL_MATRIX] !== undefined &&
       (!this._matrixSend[MATRIX_VIEW] || !this._matrixSend[MATRIX_MODEL])){

        const matrix44Temp = Mat44.set(this._matrix44Temp,this._matrix[MATRIX_VIEW]);
        Mat44.mult(matrix44Temp, this._matrix[MATRIX_MODEL]);

        Mat44.invert(matrix44Temp);
        Mat44.transpose(matrix44Temp);
        Mat33.fromMat4(this._matrix[MATRIX_NORMAL],matrix44Temp);
        //flag to send
        this._matrixSend[MATRIX_NORMAL] = false;
    }

    //update inverse view matrix from view matrix
    if (this._matrixTypesByUniformInProgramToUpdate[ProgramMatrixUniform.INVERSE_VIEW_MATRIX] !== undefined &&
        (!this._matrixSend[MATRIX_VIEW])) {
        Mat44.invert(Mat44.set(this._matrix[MATRIX_INVERSE_VIEW], this._matrix[MATRIX_VIEW]));
        //flag to send
        this._matrixSend[MATRIX_INVERSE_VIEW] = false;
    }

    //upload all matrices
    for(let uniformName in this._matrixTypesByUniformInProgramToUpdate){
        let matrixType = this._matrixTypesByUniformInProgramToUpdate[uniformName];
        if(!this._matrixSend[matrixType]){
            //convert Mat44 to Float32Array depending on type 4x4 or 3x3 matrix
            let matrix44TempF32 = this._matrixTempByTypeMap[matrixType];
                matrix44TempF32.set(this._matrix[matrixType]);

            //update program uniform
            this._setProgramUniform(uniformName,matrix44TempF32);
            //flag as send
            this._matrixSend[matrixType] = true;
        }
    }
};

/**
 * Renders primitives from array data.
 * @param {Number} mode
 * @param {Number} first
 * @param {Number} count
 */
ContextGL.prototype.drawArrays = function(mode,first,count){
    this._updateMatrixUniforms();
    this._gl.drawArrays(mode,first,count);
};

/**
 * Draws multiple instances of a range of elements.
 * @param mode
 * @param first
 * @param count
 * @param primcount
 */
ContextGL.prototype.drawArraysInstanced = function(mode,first,count,primcount){
    this._updateMatrixUniforms();
    this._gl.drawArraysInstanced(mode,first,count,primcount)
};

/**
 * Renders primitives from array data
 * @param mode
 * @param count
 * @param offset
 */
ContextGL.prototype.drawElements = function(mode, count, offset){
    this._updateMatrixUniforms();
    this._gl.drawElements(mode, count, this._vertexArrayIndexBufferDataType, offset);
};

/**
 * Draw multiple instances of a set of elements
 * @param {Number} mode
 * @param {Number} count
 * @param {Number} offset
 * @param {Number} primcount
 */
ContextGL.prototype.drawElementsInstanced = function(mode,count,offset,primcount){
    this._updateMatrixUniforms();
    this._gl.drawElementsInstanced(mode, count, this._vertexArrayIndexBufferDataType, offset, primcount)
};

/*--------------------------------------------------------------------------------------------------------------------*/
// CLEAR
/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * Clears buffers to preset values.
 * @param {Number} mask - Bitwise OR of masks that indicate the buffers to be cleared
 */
ContextGL.prototype.clear = function(mask){
    this._gl.clear(this._clearBitMap[mask]);
};

/*--------------------------------------------------------------------------------------------------------------------*/
// STATE STACK
/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * Returns a copy of the overall initial default state.
 */
ContextGL.prototype.getDefaultState = function(){};

/**
 * Saves all or a selection of states.
 * @param mask
 */
ContextGL.prototype.pushState = function(mask){
    mask = mask === undefined ? ALL_BIT : mask;
    // viewport
    if((mask & VIEWPORT_BIT) == VIEWPORT_BIT){
        this.pushViewport();
    }
    //culling
    if((mask & CULLING_BIT) == CULLING_BIT){
        this.pushCulling();
    }
    //scissor
    if((mask & SCISSOR_BIT) == SCISSOR_BIT){
        this.pushScissor();
    }
    //stencil
    if((mask & STENCIL_BIT) == STENCIL_BIT){
        this.pushStencil();
    }
    //depth
    if((mask & DEPTH_BIT) == DEPTH_BIT){
        this.pushDepth();
    }
    //color
    if((mask & COLOR_BIT) == COLOR_BIT){
        this.pushColor();
    }
    //line width
    if((mask & LINE_WIDTH_BIT) == LINE_WIDTH_BIT){
        this.pushLineWidth();
    }
    //blend
    if((mask & BLEND_BIT) == BLEND_BIT){
        this.pushBlend();
    }
    //program
    if((mask & PROGRAM_BINDING_BIT) == PROGRAM_BINDING_BIT){
        this.pushProgramBinding();
    }
    //vertex buffer binding
    if((mask & ARRAY_BUFFER_BINDING_BIT) == ARRAY_BUFFER_BINDING_BIT){
        this._bufferStack[this._gl.ARRAY_BUFFER].push(this._bufferActive[this._gl.ARRAY_BUFFER]);
    }
    //index buffer binding
    if((mask & ELEMENT_ARRAY_BUFFER_BINDING_BIT) == ELEMENT_ARRAY_BUFFER_BINDING_BIT){
        this._bufferStack[this._gl.ELEMENT_ARRAY_BUFFER].push(this._bufferActive[this._gl.ELEMENT_ARRAY_BUFFER]);
    }
    //vertex array binding
    if((mask & VERTEX_ARRAY_BINDING_BIT) == VERTEX_ARRAY_BINDING_BIT){
        this.pushVertexArrayBinding();
    }
    //texture
    if((mask & TEXTURE_BINDING_BIT) == TEXTURE_BINDING_BIT){
        this.pushTextureBinding();
    }
    //framebuffer
    if((mask & FRAMEBUFFER_BINDING_BIT) == FRAMEBUFFER_BINDING_BIT){
        this.pushFramebufferBinding();
    }
    //matrix projection
    if((mask & MATRIX_PROJECTION_BIT) == MATRIX_PROJECTION_BIT){
        this.pushProjectionMatrix();
    }
    //matrix view
    if((mask & MATRIX_VIEW_BIT) == MATRIX_VIEW_BIT){
        this.pushViewMatrix();
    }
    //matrix model
    if((mask & MATRIX_MODEL_BIT) == MATRIX_MODEL_BIT){
        this.pushModelMatrix();
    }
};

/**
 * Restores all or a selection of states.
 * @param mask
 */
ContextGL.prototype.popState = function(mask){
    mask = mask === undefined ? ALL_BIT : mask;
    // viewport
    if((mask & VIEWPORT_BIT) == VIEWPORT_BIT){
        this.popViewport();
    }
    //culling
    if((mask & CULLING_BIT) == CULLING_BIT){
        this.popCulling();
    }
    //scissor
    if((mask & SCISSOR_BIT) == SCISSOR_BIT){
        this.popScissor();
    }
    //stencil
    if((mask & STENCIL_BIT) == STENCIL_BIT){
        this.popStencil();
    }
    //depth
    if((mask & DEPTH_BIT) == DEPTH_BIT){
        this.popDepth();
    }
    //color
    if((mask & COLOR_BIT) == COLOR_BIT){
        this.popColor();
    }
    //line width
    if((mask & LINE_WIDTH_BIT) == LINE_WIDTH_BIT){
        this.popLineWidth();
    }
    //blend
    if((mask & BLEND_BIT) == BLEND_BIT){
        this.popBlend();
    }
    //program
    if((mask & PROGRAM_BINDING_BIT) == PROGRAM_BINDING_BIT){
        this.popProgramBinding();
    }
    //vertex buffer binding
    if((mask & ARRAY_BUFFER_BINDING_BIT) == ARRAY_BUFFER_BINDING_BIT){
        this.setVertexBuffer(this._bufferStack[this._gl.ARRAY_BUFFER].pop());
    }
    //index buffer binding
    if((mask & ELEMENT_ARRAY_BUFFER_BINDING_BIT) == ELEMENT_ARRAY_BUFFER_BINDING_BIT){
        this.setIndexBuffer(this._bufferStack[this._gl.ELEMENT_ARRAY_BUFFER].pop());
    }
    //vertex array binding
    if((mask & VERTEX_ARRAY_BINDING_BIT) == VERTEX_ARRAY_BINDING_BIT){
        this.popVertexArrayBinding();
    }
    //texture
    if((mask & TEXTURE_BINDING_BIT) == TEXTURE_BINDING_BIT){
        this.popTextureBinding();
    }
    //framebuffer
    if((mask & FRAMEBUFFER_BINDING_BIT) == FRAMEBUFFER_BINDING_BIT){
        this.popFramebufferBinding();
    }
    //matrix projection
    if((mask & MATRIX_PROJECTION_BIT) == MATRIX_PROJECTION_BIT){
        this.popProjectionMatrix();
    }
    //matrix view
    if((mask & MATRIX_VIEW_BIT) == MATRIX_VIEW_BIT){
        this.popViewMatrix();
    }
    //matrix model
    if((mask & MATRIX_MODEL_BIT) == MATRIX_MODEL_BIT){
        this.popModelMatrix();
    }
};

/**
 * Returns a copy of all or a selection of states.
 * @param mask
 * @returns {{*}}
 */
ContextGL.prototype.getState = function(mask){
    mask = mask === undefined ? ALL_BIT : mask;

    let state = {};

    // viewport
    if((mask & VIEWPORT_BIT) == VIEWPORT_BIT){
        state.viewport = this.getViewportState();
    }
    //culling
    if((mask & CULLING_BIT) == CULLING_BIT){
        state.culling = this.getCullingState();
    }
    //scissor
    if((mask & SCISSOR_BIT) == SCISSOR_BIT){
        state.scissor = this.getScissorState();
    }
    //stencil
    if((mask & STENCIL_BIT) == STENCIL_BIT){
        state.stencil = this.getStencilState();
    }
    //depth
    if((mask & DEPTH_BIT) == DEPTH_BIT){
        state.depth = this.getDepthState();
    }
    //color
    if((mask & COLOR_BIT) == COLOR_BIT){
        state.color = this.getColorState();
    }
    //line width
    if((mask & LINE_WIDTH_BIT) == LINE_WIDTH_BIT){
        state.lineWidth = this.getLineWidthState();
    }
    //blend
    if((mask & BLEND_BIT) == BLEND_BIT){
        state.blend = this.getBlendState();
    }
    //program
    if((mask & PROGRAM_BINDING_BIT) == PROGRAM_BINDING_BIT){
        state.programBinding = this._programActive;
    }
    //vertex buffer binding
    if((mask & ARRAY_BUFFER_BINDING_BIT) == ARRAY_BUFFER_BINDING_BIT){
        state.vertexBufferBinding = this._bufferActive[this._gl.ARRAY_BUFFER];
    }
    //index buffer binding
    if((mask & ELEMENT_ARRAY_BUFFER_BINDING_BIT) == ELEMENT_ARRAY_BUFFER_BINDING_BIT){
        state.indexBufferBinding = this._bufferActive[this._gl.ELEMENT_ARRAY_BUFFER];
    }
    //vertex array binding
    if((mask & VERTEX_ARRAY_BINDING_BIT) == VERTEX_ARRAY_BINDING_BIT){
        state.vertexArrayBinding = this.getVertexArrayBindingState();
    }
    //texture
    if((mask & TEXTURE_BINDING_BIT) == TEXTURE_BINDING_BIT){
        state.textureBinding = this.getTextureBindingState();
    }
    //framebuffer
    if((mask & FRAMEBUFFER_BINDING_BIT) == FRAMEBUFFER_BINDING_BIT){
        state.framebufferBinding = this._framebufferActive;
    }
    //matrix projection
    if((mask & MATRIX_PROJECTION_BIT) == MATRIX_PROJECTION_BIT){
        state.matrixProjection = this.getProjectionMatrix();
    }
    //matrix view
    if((mask & MATRIX_VIEW_BIT) == MATRIX_VIEW_BIT){
        state.matrixView = this.getViewMatrix();
    }
    //matrix model
    if((mask & MATRIX_MODEL_BIT) == MATRIX_MODEL_BIT){
        state.matrixModel = this.getModelMatrix();
    }

    return state;
};

/**
 * Returns a human readable descirption of all or a selection of states.
 * @param mask
 */
ContextGL.prototype.getStateDescription = function(mask){
    let state = this.getState(mask);
    for(let p in state){
        if(p === 'programBinding' ||
           p === 'vertexBufferBinding' ||
           p === 'indexBufferBinding' ||
           p === 'vertexArrayBinding' ||
           p === 'textureBinding' ||
           p === 'framebufferBinding'){
            continue;
        }
        if(p === 'matrixProjection' ||
           p === 'matrixView' ||
           p === 'matrixModel'){
            const item = state[p];
            state[p] = (item && typeof item === 'object') ? '[' + item.toString() + ']' : item;
            continue;
        }
        state[p] = state[p].getDescription();
    }
    return state;
};

/**
 * Sets all states or a selection of states.
 * @param state
 */
ContextGL.prototype.setState = function(state){
    if(state.viewport !== undefined){
        this.setViewport(state.viewport);
    }
    if(state.culling !== undefined){
        this.setCullingState(state.culling)
    }
    if(state.scissor !== undefined){
        this.setScissorState(state.scissor)
    }
    if(state.stencil !== undefined){
        this.setStencilState(state.stencil);
    }
    if(state.depth !== undefined){
        this.setDepthState(state.depth);
    }
    if(state.color !== undefined){
        this.setColorState(state.color);
    }
    if(state.lineWidth !== undefined){
        this.setLineWidthState(state.lineWidth);
    }
    if(state.blend !== undefined){
        this.setBlendState(state.blend);
    }
    if(state.programBinding !== undefined){
        this.setProgram(state.programBinding);
    }
    if(state.vertexArrayBinding !== undefined){
        this.setVertexArrayBindingState(state.vertexArrayBinding);
    }
    if(state.vertexBufferBinding !== undefined){
        this.setVertexBuffer(state.vertexBufferBinding);
    }
    if(state.indexBufferBinding !== undefined){
        this.setIndexBuffer(state.indexBufferBinding);
    }
    if(state.textureBinding !== undefined){
        this._setTextureBindingState(state.textureBinding);
    }
    if(state.framebufferBinding !== undefined){
        this.setFramebuffer(state.framebufferBinding);
    }
    if(state.matrixProjection !== undefined){
        this.setProjectionMatrix(state.matrixProjection);
    }
    if(state.matrixView !== undefined){
        this.setViewMatrix(state.matrixView);
    }
    if(state.matrixModel){
        this.setModelMatrix(state.matrixModel);
    }
};

/*--------------------------------------------------------------------------------------------------------------------*/
// READ PIXELS
/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * Reads a block of pixels from a specified rectangle of the current color framebuffer into an ArrayBufferView object.
 * @param bounds
 * @param format
 * @param type
 * @param pixels
 */
ContextGL.prototype.readPixels = function(bounds,format,type,pixels){
    return this.readPixels2(bounds[0],bounds[1],bounds[2],bounds[3],format,type,pixels);
};

/**
 * Reads a block of pixels from a specified rectangle of the current color framebuffer into an ArrayBufferView object.
 * @param x
 * @param y
 * @param width
 * @param height
 * @param format
 * @param type
 * @param pixels
 * @returns {*}
 */
ContextGL.prototype.readPixels2 = function(x,y,width,height,format,type,pixels){
    this._gl.readPixels(x,y,width,height,format,type,pixels);
    return pixels;
};

/*--------------------------------------------------------------------------------------------------------------------*/
// OPTIONAL SHARED CONTEXT
/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * Sets shared context from instance.
 */
ContextGL.prototype.makeShared = function(){
    ContextGL.__sharedContext = this;
};

/**
 * Returns a shared context.
 * @returns {ContextGL|*|null}
 */
ContextGL.sharedContext = function(){
    return ContextGL.__sharedContext;
};

ContextGL.__sharedContext = null;

/*--------------------------------------------------------------------------------------------------------------------*/
// EXPORT
/*--------------------------------------------------------------------------------------------------------------------*/

export default ContextGL;