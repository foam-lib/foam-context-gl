import {packInterleaved} from 'foam-context-gl/AttributePack';
import {equal} from 'assert';

const positions = [0,0,0,1,1,1];
const normals = [2,2,2,3,3,3];
const colors = [4,4,4,4,5,5,5,5];
const texCoords = [6,6,7,7];

const attributes = [
    {data : positions,size : 3},
    {data : normals,size : 3},
    {data : colors,size : 4},
    {data : texCoords,size : 2}
];

const packed = packInterleaved(attributes);

console.log(packed);

const stride = (3 + 3 + 4 + 2) * 4;

equal(packed.attributes[0].stride,stride);
equal(packed.attributes[0].offset,0);
equal(packed.attributes[0].size,3);

equal(packed.attributes[1].stride,stride);
equal(packed.attributes[1].offset,3 * 4);
equal(packed.attributes[1].size,3);

equal(packed.attributes[2].stride,stride);
equal(packed.attributes[2].offset,(3 + 3) * 4);
equal(packed.attributes[2].size,4);

equal(packed.attributes[3].stride,stride);
equal(packed.attributes[3].offset,(3 + 3 + 4) * 4);
equal(packed.attributes[3].size,2);