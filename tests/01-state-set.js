import {CreateApp} from "foam-app/App";
import {
    assertEqualStateCulling,
    assertEqualStateViewport,
    assertEqualStateScissor,
    assertEqualStateStencil,
    assertEqualStateDepth,
    assertEqualStateColor,
    assertEqualStateLineWidth,
    assertEqualStateBlend
} from '../StateAssert';

function setup(){
    const ctx = this._ctx;

    console.log('version',ctx.getGLVersion());
    console.log('capabilities',ctx.getGLCapabilities());
    console.log(ctx.getState());

    //viewport

    ctx.setViewport([1,2,3,4]);
    assertEqualStateViewport();

    ctx.setViewportState({
        viewport : [0,1,2,3]
    });
    assertEqualStateViewport();

    //culling

    ctx.setCullFace(true);
    ctx.setCullFaceMode(ctx.FRONT_AND_BACK);
    assertEqualStateCulling();

    ctx.setCullingState({
        cullFace : false,
        cullFaceMode : ctx.BACK
    });
    assertEqualStateCulling();

    //scissor

    ctx.setScissorTest(true);
    ctx.setScissor([0,1,2,3]);
    assertEqualStateScissor();

    ctx.setScissorState({
        scissorTest : false,
        scissorBox : [0,0,4,4]
    });
    assertEqualStateScissor();

    //stencil

    ctx.setStencilTest(true);
    ctx.setStencilFuncSeparate(ctx.FRONT,ctx.NEVER,1,0xFFFFFFFF);
    ctx.setStencilFuncSeparate(ctx.BACK,ctx.NOTEQUAL,2,0xF0F0F0F0);
    assertEqualStateStencil();

    ctx.setStencilFunc(ctx.ALWAYS,0,0x0F0F0F0F);
    assertEqualStateStencil();

    ctx.setStencilOpSeparate(ctx.FRONT,ctx.ZERO,ctx.REPLACE,ctx.ZERO);
    ctx.setStencilOpSeparate(ctx.BACK,ctx.INVERT,ctx.ZERO,ctx.INCR);
    assertEqualStateStencil();

    ctx.setStencilOp(ctx.INVERT,ctx.REPLACE,ctx.DECR);
    assertEqualStateStencil();

    //depth

    ctx.setDepthTest(true);
    ctx.setDepthMask(true);
    ctx.setDepthFunc(ctx.NEVER);
    ctx.setClearDepth(0.25);
    ctx.setDepthRange(0,0.25);
    ctx.setPolygonOffset(0.25,1);
    assertEqualStateDepth();

    ctx.setDepthState({
        depthTest : false,
        depthMask : false,
        depthFunc : ctx.ALWAYS,
        depthClearValue : 0.45,
        depthRange : [0,0.5],
        polygonOffset : [0,0.75]
    });
    assertEqualStateDepth();

    //color

    ctx.setClearColor([1,1,1,1]);
    ctx.setColorMask(true,true,false,true);
    assertEqualStateColor();

    ctx.setColorState({
        clearColor : [0,1,0,1],
        colorMask : [true,false,false,true]
    });
    assertEqualStateColor();

    //line width

    ctx.setLineWidth(0.25);
    assertEqualStateLineWidth();

    ctx.setLineWidthState({
        lineWidth : 1
    });
    assertEqualStateLineWidth();

    //blend

    ctx.setBlend(true);
    ctx.setBlendColor([1,1,0,1]);
    ctx.setBlendEquationSeparate(ctx.FUNC_ADD,ctx.FUNC_REVERSE_SUBTRACT);
    assertEqualStateBlend();

    ctx.setBlendEquation(ctx.FUNC_SUBTRACT);
    assertEqualStateBlend();

    ctx.setBlendFuncSeparate(ctx.ZERO,ctx.ONE,ctx.ONE_MINUS_CONSTANT_ALPHA,ctx.ONE);
    assertEqualStateBlend();

    ctx.setBlendFunc(ctx.SRC_ALPHA_SATURATE,ctx.DST_ALPHA);
    assertEqualStateBlend();
}

window.addEventListener('load', function(){
    CreateApp({setup:setup});
});
