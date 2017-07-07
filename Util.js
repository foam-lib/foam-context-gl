//Safari does not expose static WebGLRenderingContext constants
//TODO: remove and get internally needed static constants from instance,
//this should not be managed manually
import * as WebGLStaticConstants from  './Constants';

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

const WEBGL_CONTEXT_IDS = [
    ['webgl','webkit-3d','experimental-webgl'],
    ['webgl2']
];

/**
 * Returns a WebGLRenderingContext from an HTMLCanvasElement.
 * @param canvas
 * @param version
 * @param options
 * @return {null|WebGLRenderingContext|WebGL2RenderingContext}
 */
export function getWebGLRenderingContext(canvas,version,options){
    const ids = WEBGL_CONTEXT_IDS[version-1];
    for(let i = 0; i < ids.length; ++i){
        const gl = canvas.getContext(ids[i],options);
        if(gl){
            return gl;
        }
    }
    return null;
}

/**
 * Dictionary of WebGLRenderingContext constant value keys by constant values.
 * @type {{}}
 */
export const GLEnumStringMap = {};
for(let key in WebGLStaticConstants){
    GLEnumStringMap[WebGLStaticConstants[key]] = key;
}


/**
 * Returns a string representation of a gl constant / enum.
 * @param enum_
 * @returns {*}
 */
export function glEnumToString(enum_){
    return GLEnumStringMap[enum_] || enum_;
}