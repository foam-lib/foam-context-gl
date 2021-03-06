import {glEnumToString} from './ContextGL';

const EnumStringMap = {};
for(let key in WebGLRenderingContext){
    EnumStringMap[WebGLRenderingContext[key]] = key;
}

function arrStr(arr){
    return '[' + arr + ']';
}

function arrEnumStr(arrEnum){
    let out = [];
    for(let i = 0; i < arrEnum.length; ++i){
        out.push(glEnumToString(arrEnum[i]));
    }
    return arrStr(out);
}

/**
 * GL viewport state representation.
 * @param viewport
 * @constructor
 */
export function ViewportState(viewport){
    this.viewport = viewport.slice(0);
}

/**
 * Returns a copy of the state.
 * @returns {ViewportState}
 */
ViewportState.prototype.copy = function(){
    return new ViewportState(this.viewport)
};

/**
 * Returns a string description of every state.
 * @returns {{viewport}}
 */
ViewportState.prototype.getDescription = function(){
    return {
        viewport : arrStr(this.viewport)
    };
};

/**
 * GL culling state representation.
 * @param cullFace
 * @param cullFaceMode
 * @constructor
 */
export function CullingState(cullFace,cullFaceMode){
    this.cullFace = cullFace;
    this.cullFaceMode = cullFaceMode;
}

/**
 * Returns a copy of the state.
 * @returns {CullingState}
 */
CullingState.prototype.copy = function(){
    return new CullingState(this.cullFace,this.cullFaceMode);
};

/**
 * Returns a string description of every state.
 * @returns {{cullFace: *, cullFaceMode: *}}
 */
CullingState.prototype.getDescription = function(){
    return {
        cullFace : this.cullFace,
        cullFaceMode : EnumStringMap[this.cullFaceMode]
    };
};

/**
 * GL scissor state representation.
 * @param scissorTest
 * @param scissorBox
 * @constructor
 */
export function ScissorState(scissorTest,scissorBox){
    this.scissorTest = scissorTest;
    this.scissorBox = scissorBox.slice(0);
}

/**
 * Returns a copy of the state.
 * @returns {ScissorState}
 */
ScissorState.prototype.copy = function(){
    return new ScissorState(this.scissorTest,this.scissorBox)
};

/**
 * Returns a string description of every state.
 * @returns {{scissorTest: *, scissorBox}}
 */
ScissorState.prototype.getDescription = function(){
    return {
        scissorTest : this.scissorTest,
        scissorBox : arrStr(this.scissorBox)
    };
};

/**
 * GL stencil state representation.
 * @param stencilTest
 * @param stencilFuncSeparate
 * @param stencilOpSeparate
 * @constructor
 */
export function StencilState(stencilTest, stencilFuncSeparate, stencilOpSeparate){
    this.stencilTest = stencilTest;
    this.stencilFuncSeparate = stencilFuncSeparate.slice(0);
    this.stencilOpSeparate = stencilOpSeparate.slice(0);
}

/**
 * Returns a copy of the state.
 * @returns {StencilState}
 */
StencilState.prototype.copy = function(){
    return new StencilState(
        this.stencilTest,
        this.stencilFuncSeparate,
        this.stencilOpSeparate
    );
};

/**
 * Returns a string description of the state.
 * @returns {{stencilTest: *, stencilFuncSeparate, stencilOpSeparate}}
 */
StencilState.prototype.getDescription = function(){
    const stencilFuncSeparate = this.stencilFuncSeparate.slice(0);
    stencilFuncSeparate[2] = '0x' + stencilFuncSeparate[2].toString(16).toUpperCase();
    stencilFuncSeparate[5] = '0x' + stencilFuncSeparate[5].toString(16).toUpperCase();
    return {
        stencilTest : this.stencilTest,
        stencilFuncSeparate : arrEnumStr(stencilFuncSeparate),
        stencilOpSeparate : arrEnumStr(this.stencilOpSeparate)
    };
};

/**
 * GL depth state representation.
 * @param depthTest
 * @param depthMask
 * @param depthFunc
 * @param depthClearValue
 * @param depthRange
 * @param polygonOffset
 * @constructor
 */
export function DepthState(depthTest, depthMask, depthFunc, depthClearValue, depthRange, polygonOffset){
    this.depthTest = depthTest;
    this.depthMask = depthMask;
    this.depthFunc = depthFunc;
    this.depthClearValue = depthClearValue;
    this.depthRange = depthRange.slice(0);
    this.polygonOffset = polygonOffset.slice(0);
}

/**
 * Returns a copy of the state.
 * @returns {DepthState}
 */
DepthState.prototype.copy = function(){
    return new DepthState(
        this.depthTest,
        this.depthMask,
        this.depthFunc,
        this.depthClearValue,
        this.depthRange,
        this.polygonOffset
    );
};

/**
 * Returns a string representation of the state.
 * @returns {{depthTest: *, depthMask: *, depthFunc, depthClearValue: *, depthRange, polygonOffset}}
 */
DepthState.prototype.getDescription = function(){
    return {
        depthTest : this.depthTest,
        depthMask : this.depthMask,
        depthFunc : glEnumToString(this.depthFunc),
        depthClearValue : this.depthClearValue,
        depthRange : arrStr(this.depthRange),
        polygonOffset : arrStr(this.polygonOffset)
    }
};

/**
 * GL color state representation.
 * @param clearColor
 * @param colorMask
 * @constructor
 */
export function ColorState(clearColor, colorMask){
    this.clearColor = clearColor.slice(0);
    this.colorMask = colorMask.slice(0);
}

/**
 * Returns a copy of the state.
 * @returns {ColorState}
 */
ColorState.prototype.copy = function(){
    return new ColorState(this.clearColor, this.colorMask);
};

/**
 * Returns a string representation of the state.
 * @returns {{clearColor, colorMask}}
 */
ColorState.prototype.getDescription = function(){
    return {
        clearColor : arrStr(this.clearColor),
        colorMask : arrStr(this.colorMask)
    };
};

/**
 * GL linewidth representation.
 * @param lineWidth
 * @constructor
 */
export function LineWidthState(lineWidth){
    this.lineWidth = lineWidth;
}

/**
 * Returns a copy of the state.
 * @returns {LineWidthState}
 */
LineWidthState.prototype.copy = function(){
    return new LineWidthState(this.lineWidth);
};

/**
 * Returns a string description of the state.
 * @returns {{lineWidth: *}}
 */
LineWidthState.prototype.getDescription = function(){
    return {
        lineWidth : this.lineWidth
    };
};

/**
 * GL blend state representation.
 * @param blend
 * @param blendColor
 * @param blendEquationSeparate
 * @param blendFuncSeparate
 * @constructor
 */
export function BlendState(blend, blendColor, blendEquationSeparate, blendFuncSeparate){
    this.blend = blend;
    this.blendColor = blendColor.slice(0);
    this.blendEquationSeparate = blendEquationSeparate.slice(0);
    this.blendFuncSeparate = blendFuncSeparate.slice(0);
}

/**
 * Returns a copy of the state.
 * @returns {BlendState}
 */
BlendState.prototype.copy = function(){
    return new BlendState(
        this.blend,
        this.blendColor,
        this.blendEquationSeparate,
        this.blendFuncSeparate
    );
};

/**
 * Returns a string description of the state.
 * @returns {{blend: *, blendColor, blendEquationSeparate, blendFuncSeparate}}
 */
BlendState.prototype.getDescription = function(){
    return {
        blend : this.blend,
        blendColor : arrStr(this.blendColor),
        blendEquationSeparate : arrEnumStr(this.blendEquationSeparate),
        blendFuncSeparate : arrEnumStr(this.blendFuncSeparate)
    };
};

/**
 * Texture binding representation
 * @param textureActive
 * @param textureUnitActive
 * @constructor
 */
export function TextureState(textureActive,textureUnitActive){
    this.textureActive = textureActive.slice(0);
    this.textureUnitActive = textureUnitActive;
}

/**
 * Returns a copy of the state.
 * @returns {TextureState}
 */
TextureState.prototype.copy = function(){
    return new TextureState(this.textureActive,this.textureUnitActive);
};

/**
 * Returns a string description of the state.
 * @returns {{textureActive, textureUnitActive: *}}
 */
TextureState.prototype.getDescription = function(){
    return {
        textureActive : arrStr(this.textureActive),
        textureUnitActive : this.textureUnitActive
    };
};

/**
 * Vertex array binding representation.
 * @param binding
 * @constructor
 */
export function VertexArrayBindingState(binding){
    this.binding = binding;
}

/**
 * Returns a copy of the state.
 * @returns {VertexArrayBindingState}
 */
VertexArrayBindingState.prototype.copy = function(){
    return new VertexArrayBindingState(this.binding);
};

/**
 * Returns a string description of the state.
 * @returns {{binding: *}}
 */
VertexArrayBindingState.prototype.getDescription = function(){
    return {
        binding : this.binding
    };
};

/**
 * Quickdraw state representation
 * @param color
 * @param lineWidth
 * @param pointSize
 * @param numSegmentsCircle
 * @param numSegmentsEllipse
 * @param numSegmentsCylinderH
 * @param numSegmentsCylinderV
 * @param numSubdivisionsSphere
 * @constructor
 */
export function DrawState(
    color,
    lineWidth,
    pointSize,
    numSegmentsCircle,
    numSegmentsEllipse,
    numSegmentsCylinderH,
    numSegmentsCylinderV,
    numSubdivisionsSphere){
    this.color = color.slice(0);
    this.lineWidth = lineWidth;
    this.pointSize = pointSize;
    this.numSegmentsCircle = numSegmentsCircle;
    this.numSegmentsEllipse = numSegmentsEllipse;
    this.numSegmentsCylinderH = numSegmentsCylinderH;
    this.numSegmentsCylinderV = numSegmentsCylinderV;
    this.numSubdivisionsSphere = numSubdivisionsSphere
}

/**
 * Returns a copy of the state.
 * @returns {DrawState}
 */
DrawState.prototype.copy = function(){
    return new DrawState(
        this.color,
        this.lineWidth,
        this.pointSize,
        this.numSegmentsCircle,
        this.numSegmentsEllipse,
        this.numSegmentsCylinderH,
        this.numSegmentsCylinderV,
        this.numSubdivisionsSphere
    );
};

/**
 * Returns a string description of the state.
 * @returns {{color, lineWidth: *, pointSize: *}}
 */
DrawState.prototype.getDescription = function(){
    return {
        color : arrStr(this.color),
        lineWidth : this.lineWidth,
        pointSize : this.pointSize,
        numSegmentsCircle : this.numSegmentsCircle,
        numSegmentsEllipse : this.numSegmentsEllipse,
        numSegmentsCylinderH : this.numSegmentsCylinderH,
        numSegmentsCylinderV : this.numSegmentsCylinderV,
        numSubdivisionsSphere : this.numSubdivisionsSphere
    };
};