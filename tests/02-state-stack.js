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

import {
    deepEqual,
    equal
} from 'assert';

function setup(){
    const ctx = this._ctx;

    console.log('version',ctx.getGLVersion());
    console.log('capabilities',ctx.getGLCapabilities());

    let state;
    //viewport

    ctx.setViewport([0,0,10,10]);
    state = ctx.getViewportState();
    ctx.pushViewport();
    {
        ctx.setViewport([0,0,5,5]);
    }
    ctx.popViewport();
    assertEqualStateViewport(state);

    //culling

    ctx.setCullFace(true);
    ctx.setCullFaceMode(ctx.FRONT);
    state = ctx.getCullingState();
    ctx.pushCulling();
    {
        ctx.setCullFace(false);
        ctx.setCullFaceMode(ctx.BACK);
    }
    ctx.popCulling();
    assertEqualStateCulling(state);

    //scissor

    ctx.setScissorTest(true);
    ctx.setScissor([1,1,5,5]);
    state = ctx.getScissorState();
    ctx.pushScissor();
    {
        ctx.setScissorTest(false);
        ctx.setScissor([0,0,1,1]);
    }
    ctx.popScissor();
    assertEqualStateScissor(state);

    //stencil

    ctx.setStencilTest(true);
    ctx.setStencilFuncSeparate(ctx.FRONT,ctx.NEVER,1,0xFFFFFFFF);
    ctx.setStencilFuncSeparate(ctx.BACK,ctx.NOTEQUAL,2,0xF0F0F0F0);
    ctx.setStencilOpSeparate(ctx.FRONT,ctx.ZERO,ctx.REPLACE,ctx.ZERO);
    ctx.setStencilOpSeparate(ctx.BACK,ctx.INVERT,ctx.ZERO,ctx.INCR);
    state = ctx.getStencilState();
    ctx.pushStencil();
    {
        ctx.setStencilTest(false);
        ctx.setStencilFunc(ctx.ALWAYS,0,0x0F0F0F0F);
        ctx.setStencilOp(ctx.INVERT,ctx.REPLACE,ctx.DECR);
    }
    ctx.popStencil();
    assertEqualStateStencil(state);

    //depth

    ctx.setDepthTest(true);
    ctx.setDepthMask(true);
    ctx.setDepthFunc(ctx.NEVER);
    ctx.setClearDepth(0.25);
    ctx.setDepthRange(0,0.125);
    ctx.setPolygonOffset(0,1);
    state = ctx.getDepthState();
    ctx.pushDepth();
    {
        ctx.setDepthTest(false);
        ctx.setDepthMask(false);
        ctx.setDepthFunc(ctx.ALWAYS);
        ctx.setClearDepth(0.5);
        ctx.setDepthRange(0,1.0);
        ctx.setPolygonOffset(0.125,0.5);
    }
    ctx.popDepth();
    assertEqualStateDepth(state);

    //color

    ctx.setClearColor([1,1,1,0.5]);
    ctx.setColorMask(true,false,true,true);
    state = ctx.getColorState();
    ctx.pushColor();
    {
        ctx.setClearColor([0,0,0,1]);
        ctx.setColorMask(false,true,false,false);
    }
    ctx.popColor();
    assertEqualStateColor(state);

    //line width

    ctx.setLineWidth(0.25);
    state = ctx.getLineWidthState();
    ctx.pushLineWidth();
    {
        ctx.setLineWidth(0.75)
    }
    ctx.popLineWidth();
    assertEqualStateLineWidth(state);

    //blend

    ctx.setBlend(true);
    ctx.setBlendColor([1,0,0,1]);
    ctx.setBlendEquationSeparate(ctx.FUNC_ADD,ctx.FUNC_REVERSE_SUBTRACT);
    ctx.setBlendFuncSeparate(ctx.ZERO,ctx.ONE,ctx.ONE_MINUS_CONSTANT_ALPHA,ctx.ONE);
    state = ctx.getBlendState();
    ctx.pushBlend();
    {
        ctx.setBlend(false);
        ctx.setBlendColor([0,1,1,0]);
        ctx.setBlendEquationSeparate(ctx.FUNC_REVERSE_SUBTRACT,ctx.FUNC_ADD);
        ctx.setBlendFuncSeparate(ctx.ONE,ctx.ZERO,ctx.ONE,ctx.ONE_MINUS_CONSTANT_ALPHA);
    }
    ctx.popBlend();
    assertEqualStateBlend(state);
}

window.addEventListener('load', function(){
    CreateApp({setup:setup});
});
