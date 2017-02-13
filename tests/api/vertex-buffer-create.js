import createContextCanvas from '../util/create-context-canvas';
import ContextGL, {BufferError} from '../../ContextGL.js'
import tape from 'tape';

export default function main(){
    tape('vertex-buffer-create',(t)=>{
        const canvas = createContextCanvas();
        const ctx = new ContextGL(canvas);

        let buffer = ctx.createVertexBuffer();
        ctx.deleteVertexBuffer(buffer);

        t.throws(()=>{
            ctx.setVertexBuffer(buffer);
        },BufferError)

    });
}