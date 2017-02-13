import createContextCanvas from '../util/create-context-canvas';
import ContextGL from '../../ContextGL.js'
import tape from 'tape';

export default function main(){
    tape('index-buffer-binding-state',(t)=>{
        const canvas = createContextCanvas();
        const ctx = new ContextGL(canvas);

        const buffer0 = ctx.createIndexBuffer();
        const buffer1 = ctx.createIndexBuffer();
        const buffer2 = ctx.createIndexBuffer();

        ctx.setIndexBuffer(buffer0);
        t.equals(ctx.getIndexBuffer(),buffer0);

        ctx.setIndexBuffer(buffer1);
        t.equals(ctx.getIndexBuffer(),buffer1);

        ctx.setIndexBuffer(buffer2);
        t.equals(ctx.getIndexBuffer(),buffer2);

        ctx.pushIndexBufferBinding();
            ctx.setIndexBuffer(buffer1);
            t.equals(ctx.getIndexBuffer(),buffer1);
        ctx.popIndexBufferBinding();
        t.equals(ctx.getIndexBuffer(),buffer2);

        ctx.setIndexBuffer(buffer1);
        ctx.pushIndexBufferBinding();
            ctx.setIndexBuffer(buffer2);
            t.equals(ctx.getIndexBuffer(),buffer2);
        ctx.popIndexBufferBinding();
        t.equals(ctx.getIndexBuffer(),buffer1);

        ctx.setIndexBuffer(buffer2);
        ctx.pushIndexBufferBinding();
            ctx.setIndexBuffer(buffer0);
            t.equals(ctx.getIndexBuffer(),buffer0);
        ctx.popIndexBufferBinding();
        t.equals(ctx.getIndexBuffer(),buffer2);
    });
}