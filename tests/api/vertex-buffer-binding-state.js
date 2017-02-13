import createContextCanvas from '../util/create-context-canvas';
import ContextGL from '../../ContextGL.js'
import tape from 'tape';

export default function main(){
    tape('vertex-buffer-binding-state',(t)=>{
        const canvas = createContextCanvas();
        const ctx = new ContextGL(canvas);

        const buffer0 = ctx.createVertexBuffer();
        const buffer1 = ctx.createVertexBuffer();
        const buffer2 = ctx.createVertexBuffer();

        ctx.setVertexBuffer(buffer0);
        t.equals(ctx.getVertexBuffer(),buffer0);

        ctx.setVertexBuffer(buffer1);
        t.equals(ctx.getVertexBuffer(),buffer1);

        ctx.setVertexBuffer(buffer2);
        t.equals(ctx.getVertexBuffer(),buffer2);

        ctx.pushVertexBufferBinding();
            ctx.setVertexBuffer(buffer1);
            t.equals(ctx.getVertexBuffer(),buffer1);
        ctx.popVertexBufferBinding();
        t.equals(ctx.getVertexBuffer(),buffer2);

        ctx.setVertexBuffer(buffer1);
        ctx.pushVertexBufferBinding();
            ctx.setVertexBuffer(buffer2);
            t.equals(ctx.getVertexBuffer(),buffer2);
        ctx.popVertexBufferBinding();
        t.equals(ctx.getVertexBuffer(),buffer1);

        ctx.setVertexBuffer(buffer2);
        ctx.pushVertexBufferBinding();
            ctx.setVertexBuffer(buffer0);
            t.equals(ctx.getVertexBuffer(),buffer0);
        ctx.popVertexBufferBinding();
        t.equals(ctx.getVertexBuffer(),buffer2);
    });
}