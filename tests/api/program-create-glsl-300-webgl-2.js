import createContextCanvas from '../util/create-context-canvas';
import ContextGL from '../../ContextGL.js'
import tape from 'tape';

export default function main(){
    tape('program-create-webgl-2',(t)=>{
        const canvas = createContextCanvas();
        const ctx = new ContextGL(canvas);
        const program = ctx.createProgram(
        `#version 300 es
        in vec4 aPosition;
        void main(){
            gl_Position = -1.0 + aPosition * 2.0;
        }`,
        `#version 300 es
        precision mediump float;
        out vec4 fragColor;
        void main(){
            fragColor = vec4(1.0,1.0,1.0,1.0);
        }`);
    });
}