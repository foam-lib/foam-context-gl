import {packBatch} from 'foam-context-gl/AttributePack';
import {equal} from 'assert';

const positions = [0,0,0,1,1,1];
const colors = [2,2,2,2,3,3,3,3];
const normals = [4,4,4,5,5,5];
const texCoords = [6,6,7,7];

const attributes = [
    {data : positions,size : 3},
    {data : colors,size : 4},
    {data : normals,size : 3},
    {data : texCoords,size : 2}
];

const packed = packBatch(attributes);

console.log(packed);

equal(packed.attributes[0].offset,0);
equal(packed.attributes[0].size,attributes[0].size);
equal(packed.attributes[1].offset,(2 * 3) * 4);
equal(packed.attributes[1].size,attributes[1].size);
equal(packed.attributes[2].offset,(2 * 3 + 2 * 4) * 4);
equal(packed.attributes[2].size,attributes[2].size);
equal(packed.attributes[3].offset,(2 * 3 + 2 * 4 + 2 * 3) * 4);
equal(packed.attributes[3].size,attributes[3].size);