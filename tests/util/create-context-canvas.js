//browser
export default function createContextCanvas(width = 512,height = 512){
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}
//node