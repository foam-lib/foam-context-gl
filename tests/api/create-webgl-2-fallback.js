import createContextCanvas from '../util/create-context-canvas';
import ContextGL from '../../ContextGL.js'
import tape from 'tape';

export default function main(){
    tape('create-webgl-2-fallback',(t)=>{
        const canvas = createContextCanvas();
        const ctx = new ContextGL(canvas,{fallback:true});
        t.equal(ctx.getGLVersion(),1);
    });
}