import createContextCanvas from '../util/create-context-canvas';
import ContextGL from '../../ContextGL.js'
import tape from 'tape';

export default function main(){
    tape('capabilities-webgl-2',(t)=>{
        const canvas = createContextCanvas();
        const ctx = new ContextGL(canvas);
    });
}