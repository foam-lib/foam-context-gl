import * as Vec3 from 'foam-math/Vec3';
import * as Quat from 'foam-math/Quat';
import * as Mat44 from 'foam-math/Mat44';

import * as Rect from 'foam-geom/Rect';

import ContextGL from './ContextGL';

const Y_AXIS = [0,1,0];

const mat44Temp = Mat44.create();

function PerspCamera(){
    this._ctx = ContextGL.sharedContext();

    this._viewport = this._ctx.getWindowBounds();
    this._aspectRatio = this._ctx.getWindowAspectRatio();
    this._fov = 65.0;
    this._near = 0.0001;
    this._far  = 10.0;
    this._matrixProjectionDirty = true;


    this._up  = Vec3.copy(Y_AXIS);

}

PerspCamera.prototype.setViewport = function(bounds){
    this._viewport = Rect.set(this._viewport,bounds);

};

PerspCamera.prototype._updateProjection = function(){
    if(!this._matrixProjectionDirty){
        return;
    }
    this._matrixProjectionDirty = true;
};

PerspCamera.prototype.update = function(){
    this._updateProjection();
};

PerspCamera.prototype.getPerspectiveMatrix = function(){

};

PerspCamera.prototype.getViewMatrix = function(){

};


export default PerspCamera;