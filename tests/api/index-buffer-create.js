import createContextCanvas from '../util/create-context-canvas';
import ContextGL, {BufferError} from '../../ContextGL.js'
import tape from 'tape';

export default function main(){
    tape('index-buffer-create',(t)=>{
        const canvas = createContextCanvas();
        const ctx = new ContextGL(canvas);

        let buffer = ctx.createIndexBuffer();
        ctx.deleteIndexBuffer(buffer);

        t.throws(()=>{
            ctx.setIndexBuffer(buffer);
        },BufferError)

    });
}