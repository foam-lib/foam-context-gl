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

    console.log('version', ctx.getGLVersion());
    console.log('capabilities', ctx.getGLCapabilities());
    console.log(ctx.getState());

    assertEqualStateViewport();
    assertEqualStateCulling();
    assertEqualStateScissor();
    assertEqualStateStencil();
    assertEqualStateDepth();
    assertEqualStateColor();
    assertEqualStateLineWidth();
    assertEqualStateBlend();
}

window.addEventListener('load', function(){
    CreateApp({setup : setup});
});