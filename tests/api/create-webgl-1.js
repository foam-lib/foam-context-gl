import createContextCanvas from '../util/create-context-canvas';
import ContextGL from '../../ContextGL.js'
import tape from 'tape';

export default function main(){
    tape('create-webgl-1',(t)=>{
        const canvas = createContextCanvas();
        const ctx = new ContextGL(canvas,{version:1});
        t.equal(ctx.getGLVersion(),1);
    });
}