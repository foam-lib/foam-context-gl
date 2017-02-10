import {CreateApp} from "foam-app/App";

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

    const vertexArray0 = ctx.createVertexArray(vertexArrayAttribs,indexBuffer0);
    const vertexArray1 = ctx.createVertexArray(vertexArrayAttribs,indexBuffer1);

    ctx.setVertexArray(vertexArray0);
    equal(ctx.getIndexBufferInfo(indexBuffer0).handle,ctx._gl.getParameter(ctx._gl.ELEMENT_ARRAY_BUFFER_BINDING));

    ctx.setVertexArray(vertexArray1);
    equal(ctx.getIndexBufferInfo(indexBuffer1).handle,ctx._gl.getParameter(ctx._gl.ELEMENT_ARRAY_BUFFER_BINDING));
}

window.addEventListener('load', function(){
    CreateApp({setup:setup});
});
