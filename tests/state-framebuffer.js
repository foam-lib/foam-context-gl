import {CreateApp} from 'foam-app/App';

function setup(){
    console.log(this._ctx.getGLCapabilities());
    console.log(this._ctx.MAX_COLOR_ATTACHMENTS);

    const texture0 = this._ctx.createTexture2d({
        width: 320,
        height: 240
    });
    const texture1 = this._ctx.createTexture2d({
        width: 320,
        height: 240
    });
    const textureDepth = this._ctx.createTexture2d({
        width: 320,
        height: 240,
        dataType: this._ctx.UNSIGNED_INT,
        format: this._ctx.DEPTH_COMPONENT
    });
    const textureDepthStencil = this._ctx.createTexture2d({
        width: 320,
        height: 240,
        dataType: this._ctx.UNSIGNED_INT_24_8,
        format: this._ctx.DEPTH_STENCIL
    });

    console.log('-----');
    console.log(this._ctx.getTexture2dInfo(texture0));
    console.log(this._ctx.getTexture2dInfo(texture1));
    console.log(this._ctx.getTexture2dInfo(textureDepth));
    console.log(this._ctx.getTexture2dInfo(textureDepthStencil));

    const fbo0 = this._ctx.createFramebuffer();
    const fbo1 = this._ctx.createFramebuffer({
        width: 320,
        height: 240,
        numColorAttachments: this._ctx.MAX_COLOR_ATTACHMENTS
    });
    const fbo2 = this._ctx.createFramebuffer([
       {attachmentPoint: 0, texture: texture0},
       {attachmentPoint: 1, texture: texture1}
    ]);
    const fbo3 = this._ctx.createFramebuffer({
        width: 320,
        height: 240,
        numColorAttachments: 0,
        depthAttachment: false
    });

    this._ctx.pushFramebufferBinding();
        this._ctx.setFramebuffer(fbo2);
        this._ctx.setFramebufferDepthAttachment(textureDepth);
        console.assert(this._ctx.getFramebufferDepthAttachment === textureDepth);
    this._ctx.popFramebufferBinding();
    console.assert(this._ctx.getFramebuffer() === null);

    this._ctx.pushFramebufferBinding();
        this._ctx.setFramebuffer(fbo3);
        this._ctx.setFramebufferDepthStencilAttachment(textureDepthStencil);
    this._ctx.popFramebufferBinding();
    console.assert(this._ctx.getFramebuffer() === null);

    console.log('-----');
    console.log(this._ctx.getFramebufferInfo(fbo0));
    console.log(this._ctx.getFramebufferInfo(fbo1));
    console.log(this._ctx.getFramebufferInfo(fbo2));
    console.log(this._ctx.getFramebufferInfo(fbo3));

    this._ctx.setFramebuffer(fbo0);
    this._ctx.pushFramebufferBinding();
        this._ctx.setFramebuffer(fbo1);
        console.log('-----');
        for(let i = 0; i < this._ctx.MAX_COLOR_ATTACHMENTS; ++i){
            const attachment = this._ctx.getFramebufferColorAttachment(i);
            console.log(attachment,this._ctx.getTexture2dInfo(attachment));
        }
        console.log('-----');
        console.log(this._ctx.getFramebufferColorAttachment(fbo0,0));
        console.log(this._ctx.getFramebufferColorAttachment(fbo2,0));
        console.log(this._ctx.getFramebufferColorAttachment(fbo2,1));
    this._ctx.popFramebufferBinding();
    console.assert(this._ctx.getFramebuffer() == fbo0);


}

window.addEventListener('load',()=>{
    CreateApp({setup:setup});
});