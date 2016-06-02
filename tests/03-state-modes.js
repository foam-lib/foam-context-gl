import {CreateApp} from "foam-app/App";
import {equal} from 'assert';

function setup(){
    const ctx = this._ctx;
    const gl  = ctx.getGL();

    console.log('version',ctx.getGLVersion());
    console.log('capabilities',ctx.getGLCapabilities());

    const constants = [
        'FRONT',
        'BACK',
        'FRONT_AND_BACK',
        'ALWAYS',
        'NEVER',
        'LESS',
        'LEQUAL',
        'GREATER',
        'GEQUAL',
        'EQUAL',
        'NOTEQUAL',
        'ALWAYS',
        'KEEP',
        'REPLACE',
        'INCR',
        'INCR_WRAP',
        'DECR',
        'DECR_WRAP',
        'INVERT',
        'REPLACE',
        'FUNC_ADD',
        'FUNC_SUBTRACT',
        'FUNC_REVERSE_SUBTRACT',
        'ZERO',
        'ONE',
        'SRC_COLOR',
        'ONE_MINUS_SRC_COLOR',
        'DST_COLOR',
        'ONE_MINUS_DST_COLOR',
        'SRC_ALPHA',
        'ONE_MINUS_SRC_ALPHA',
        'DST_ALPHA',
        'ONE_MINUS_DST_ALPHA',
        'SRC_ALPHA_SATURATE',
        'CONSTANT_COLOR',
        'ONE_MINUS_CONSTANT_COLOR',
        'CONSTANT_ALPHA',
        'ONE_MINUS_CONSTANT_ALPHA',
        'STATIC_DRAW',
        'DYNAMIC_DRAW',
        'STREAM_DRAW',
        'ARRAY_BUFFER',
        'ELEMENT_ARRAY_BUFFER',
        'FLOAT',
        'UNSIGNED_SHORT',
        'UNSIGNED_INT',
        'UNSIGNED_BYTE',
        'POINTS',
        'LINES',
        'LINE_STRIP',
        'LINE_LOOP',
        'TRIANGLES',
        'TRIANGLE_STRIP',
        'TRIANGLE_FAN'
    ];

    for(let name of constants){
        equal(ctx[name],gl[name]);
    }
}

window.addEventListener('load', function(){
    CreateApp({setup:setup});
});
