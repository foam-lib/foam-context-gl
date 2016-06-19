import {CreateApp} from "foam-app/App";
import {
    assertEqualStateVertexArrayBinding
} from '../StateAssert';

import {
    deepEqual,
    equal
} from 'assert';

function setup(){
    const ctx = this._ctx;

    console.log(ctx.getGLCapabilities());

    const vertexBuffer0 = ctx.createVertexBuffer(new Float32Array([0,0,1,0,1,1,0,1]));
    const indexBuffer0  = ctx.createIndexBuffer(new Uint8Array([2,1,0,2,3,0]));
    const indexBuffer1  = ctx.createIndexBuffer(new Uint8Array([0,3,2,0,1,2]));

    const vertexArrayAttribs = [
        {location: ctx.ATTRIB_LOCATION_POSITION, buffer: vertexBuffer0, size: 2}
    ];

    assertEqualStateVertexArrayBinding();

    const vertexArray0 = ctx.createVertexArray(vertexArrayAttribs,indexBuffer0);
    const vertexArray1 = ctx.createVertexArray(vertexArrayAttribs,indexBuffer1);

    ctx.setVertexArray(vertexArray0);
    assertEqualStateVertexArrayBinding();

    ctx.setVertexArray(vertexArray1);
    assertEqualStateVertexArrayBinding();

    ctx.pushVertexArrayBinding();
        equal(ctx.getVertexArray(),vertexArray1);
        ctx.setVertexArray(vertexArray0);
        equal(ctx.getVertexArray(),vertexArray0);
    ctx.popVertexArrayBinding();
    assertEqualStateVertexArrayBinding();
    equal(ctx.getVertexArray(),vertexArray1);

    const state = ctx.getVertexArrayBindingState();
    ctx.setVertexArray(vertexArray0);
    ctx.setVertexArrayBindingState(state);
    assertEqualStateVertexArrayBinding();

    ctx.setVertexArray(null);
    assertEqualStateVertexArrayBinding();
}

window.addEventListener('load', function(){
    CreateApp({setup:setup});
});
