import createContextCanvas from '../util/create-context-canvas';
import ContextGL from '../../ContextGL.js'
import tape from 'tape';

export default function main(){
    tape('program-create-webgl-1',(t)=>{
        const canvas = createContextCanvas();
        const ctx = new ContextGL(canvas,{version:1});
        const program = ctx.createProgram(`
        attribute vec4 aPosition;
        void main(){
            gl_Position = -1.0 + aPosition * 2.0;
        }`,`
        void main(){
            gl_FragColor = vec4(1.0,1.0,1.0,1.0);
        }`);
    });
}