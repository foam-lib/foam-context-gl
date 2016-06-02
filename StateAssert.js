import {equal,deepEqual} from 'assert';
import ContextGL,{glObjToArray} from './ContextGL';

export function assertEqualStateViewport(state){
    const ctx = ContextGL.sharedContext();
    const gl = ctx.getGL();

    const statea = ctx.getState(ctx.VIEWPORT_BIT);
    const stateb = state || ctx.getViewportState();
    deepEqual(statea.viewport,stateb);
    deepEqual(stateb.viewport,gl.getParameter(gl.VIEWPORT));
}

export function assertEqualStateCulling(state){
    const ctx = ContextGL.sharedContext();
    const gl = ctx.getGL();

    const statea = ctx.getState(ctx.CULLING_BIT);
    const stateb = state || ctx.getCullingState();
    deepEqual(statea.culling,stateb);
    equal(stateb.cullFace,gl.getParameter(gl.CULL_FACE));
    equal(stateb.cullFaceMode,gl.getParameter(gl.CULL_FACE_MODE));
}

export function assertEqualStateScissor(state){
    const ctx = ContextGL.sharedContext();
    const gl = ctx.getGL();

    const statea = ctx.getState(ctx.SCISSOR_BIT);
    const stateb = state || ctx.getScissorState();
    deepEqual(statea.scissor,stateb);
    equal(stateb.scissorTest,gl.getParameter(gl.SCISSOR_TEST));
    deepEqual(stateb.scissorBox,gl.getParameter(gl.SCISSOR_BOX));
}

export function assertEqualStateStencil(state){
    const ctx = ContextGL.sharedContext();
    const gl = ctx.getGL();

    const statea = ctx.getState(ctx.STENCIL_BIT);
    const stateb = state || ctx.getStencilState();
    deepEqual(statea.stencil,stateb);
    equal(stateb.stencilTest,gl.getParameter(gl.STENCIL_TEST));
    equal(stateb.stencilFuncSeparate[0],gl.getParameter(gl.STENCIL_FUNC));
    equal(stateb.stencilFuncSeparate[1],gl.getParameter(gl.STENCIL_REF));
    equal(stateb.stencilFuncSeparate[2],gl.getParameter(gl.STENCIL_VALUE_MASK));
    equal(stateb.stencilFuncSeparate[3],gl.getParameter(gl.STENCIL_BACK_FUNC));
    equal(stateb.stencilFuncSeparate[4],gl.getParameter(gl.STENCIL_BACK_REF));
    equal(stateb.stencilFuncSeparate[5],gl.getParameter(gl.STENCIL_BACK_VALUE_MASK));
    equal(stateb.stencilOpSeparate[0],gl.getParameter(gl.STENCIL_FAIL));
    equal(stateb.stencilOpSeparate[1],gl.getParameter(gl.STENCIL_PASS_DEPTH_FAIL));
    equal(stateb.stencilOpSeparate[2],gl.getParameter(gl.STENCIL_PASS_DEPTH_PASS));
    equal(stateb.stencilOpSeparate[3],gl.getParameter(gl.STENCIL_BACK_FAIL));
    equal(stateb.stencilOpSeparate[4],gl.getParameter(gl.STENCIL_BACK_PASS_DEPTH_FAIL));
    equal(stateb.stencilOpSeparate[5],gl.getParameter(gl.STENCIL_BACK_PASS_DEPTH_PASS));
}

export function assertEqualStateDepth(state){
    const ctx = ContextGL.sharedContext();
    const gl = ctx.getGL();

    const statea = ctx.getState(ctx.DEPTH_BIT);
    const stateb = state || ctx.getDepthState();
    deepEqual(statea.depth,stateb);
    equal(stateb.depthTest,gl.getParameter(gl.DEPTH_TEST));
    equal(stateb.depthMask,gl.getParameter(gl.DEPTH_WRITEMASK));
    equal(stateb.depthFunc,gl.getParameter(gl.DEPTH_FUNC));
    equal(stateb.depthClearValue.toFixed(2),gl.getParameter(gl.DEPTH_CLEAR_VALUE).toFixed(2));
    deepEqual(stateb.depthRange,glObjToArray(gl.getParameter(gl.DEPTH_RANGE)));
    equal(stateb.polygonOffset[0],gl.getParameter(gl.POLYGON_OFFSET_FACTOR));
    equal(stateb.polygonOffset[1],gl.getParameter(gl.POLYGON_OFFSET_UNITS));
}

export function assertEqualStateColor(state){
    const ctx = ContextGL.sharedContext();
    const gl = ctx.getGL();

    const statea = ctx.getState(ctx.COLOR_BIT);
    const stateb = state || ctx.getColorState();
    deepEqual(statea.color,stateb);
    deepEqual(stateb.clearColor,glObjToArray(gl.getParameter(gl.COLOR_CLEAR_VALUE)));
    deepEqual(stateb.colorMask,glObjToArray(gl.getParameter(gl.COLOR_WRITEMASK)));
}

export function assertEqualStateLineWidth(state){
    const ctx = ContextGL.sharedContext();
    const gl = ctx.getGL();

    const statea = ctx.getState(ctx.LINE_WIDTH_BIT);
    const stateb = state || ctx.getLineWidthState();
    deepEqual(statea.lineWidth,stateb);
    equal(stateb.lineWidth,gl.getParameter(gl.LINE_WIDTH));
}

export function assertEqualStateBlend(state){
    const ctx = ContextGL.sharedContext();
    const gl = ctx.getGL();

    const statea = ctx.getState(ctx.BLEND_BIT);
    const stateb = state || ctx.getBlendState();
    deepEqual(statea.blend,stateb);
    equal(stateb.blend,gl.getParameter(gl.BLEND));
    deepEqual(stateb.blendColor,glObjToArray(gl.getParameter(gl.BLEND_COLOR)));
    equal(stateb.blendEquationSeparate[0],gl.getParameter(gl.BLEND_EQUATION_RGB));
    equal(stateb.blendEquationSeparate[1],gl.getParameter(gl.BLEND_EQUATION_ALPHA));
    equal(stateb.blendFuncSeparate[0],gl.getParameter(gl.BLEND_SRC_RGB));
    equal(stateb.blendFuncSeparate[1],gl.getParameter(gl.BLEND_DST_RGB));
    equal(stateb.blendFuncSeparate[2],gl.getParameter(gl.BLEND_SRC_ALPHA));
    equal(stateb.blendFuncSeparate[3],gl.getParameter(gl.BLEND_DST_ALPHA));
}
