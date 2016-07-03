function strErrorMissingAttributeInfo(info){
    return `Missing attribute info ${info}.`;
}

function getLengthAndValidate(attributes){
    let length = 0;
    let numElementsPrev = -1;
    for(let i = 0; i < attributes.length; ++i){
        const attribute = attributes[i];
        if(!attribute.data){
            throw new Error(strErrorMissingAttributeInfo('data'));
        }
        if(!attribute.size){
            throw new Error(strErrorMissingAttributeInfo('size'));
        }

        const dataLength = attribute.data.length;
        if(dataLength === 0){
            throw new Error(`Invalid attribute data length 0 at index ${i}.`);
        }

        const dataSize = attribute.size;
        const numElements = dataLength / dataSize;
        if(numElements % 1 !== 0){
            throw new Error(`Non integer element count at index ${i} with data size ${dataSize} and length ${dataLength}.`);
        }
        if(numElementsPrev !== -1 && numElements !== numElementsPrev){
            throw new Error(`Differing number of elements at index ${i}. Current ${numElements}, prev ${numElementsPrev}.`);
        }

        length += dataLength;
        numElementsPrev = numElements;
    }
    return length;
}

/**
 * Packs attribute data as blocks in a batch for data representation in
 * vertex buffer objects.
 *
 * @example
 * const attributesBatch = packBatch([
 *     {data: [0,0,0, 1,1,1], size: 3},
 *     {data: [2,2,2, 3,3,3], size: 3},
 *     {data: [4,4,4,4, 5,5,5,5], size: 4},
 *     {data: [6,6, 7,7], size: 2}
 * ]);
 * //{
 * //    data : Float32Array[0,0,0, 1,1,1, 2,2,2, 3,3,3, 4,4,4,4, 5,5,5,5, 6,6, 7,7],
 * //    attributes : [
 * //        {size: 3, offset: 0 * 4},
 * //        {size: 3, offset: (2 * 3) * 4},
 * //        {size: 4, offset: (2 * 3 + 2 * 3) * 4},
 * //        {size: 2, offset: (2 * 3 + 2 * 3 + 2 * 4) * 4}
 * //    ]
 * //}
 *
 * @param attributes
 * @returns {{data: Float32Array, attributes: Array}}
 */
export function packBatch(attributes){
    const length = getLengthAndValidate(attributes);

    const data = new Float32Array(length);
    const info = new Array(attributes.length);

    let offset = 0;
    for(let i = 0; i < attributes.length; ++i){
        const attribute = attributes[i];
        const data_ = attribute.data;

        info[i] = {
            size : attribute.size,
            offset : offset * 4
        };

        data.set(data_,offset);
        offset += data_.length;
    }

    return {
        data : data,
        attributes : info
    }
}

/**
 * Packs attribute data as interleaved attributes in a batch for
 * data representation in vertex buffer objects.
 *
 * @example
 * const attributesInterleaved = packInterleaved([
 *     {data: [0,0,0, 1,1,1], size: 3},
 *     {data: [2,2,2, 3,3,3], size: 3},
 *     {data: [4,4,4,4, 5,5,5,5], size: 4},
 *     {data: [6,6, 7,7], size: 2}
 * ]);
 * //{
 * //    data : Float32Array[0,0,0, 2,2,2, 4,4,4,4, 6,6, 1,1,1, 3,3,3, 5,5,5,5, 7,7],
 * //    attributes : [
 * //        {size: 3, stride: (3 + 3 + 4 + 2) * 4, offset: 0 * 4},
 * //        {size: 3, stride: (3 + 3 + 4 + 2) * 4, offset: 3 * 4},
 * //        {size: 4, stride: (3 + 3 + 4 + 2) * 4, offset: (3 + 3) * 4},
 * //        {size: 2, stride: (3 + 3 + 4 + 2) * 4, offset: (3 + 3 + 4) * 4}
 * //    ]
 * //}
 * @param attributes
 */
export function packInterleaved(attributes){
    const length = getLengthAndValidate(attributes);

    const data = new Float32Array(length);
    const info = new Array(attributes.length);

    //initial attribute info
    let offset = 0;
    for(let i = 0; i < attributes.length; ++i){
        const attribute = attributes[i];
        const size = attribute.size;

        info[i] = {
            size : size,
            offset : offset,
            stride : 0
        };

        offset += size;
    }

    const stride = offset;
    const numElements = data.length / stride;

    for(let i = 0; i < numElements; ++i){
        const index = i * stride;

        for(let j = 0; j < attributes.length; ++j){
            const info_ = info[j];
            const data_ = attributes[j].data;
            const size  = info_.size;

            const offsetData  = index + info_.offset;
            const offsetData_ = i * size;
            for(let k = 0; k < size; ++k){
                data[offsetData + k] = data_[offsetData_ + k]
            }
        }
    }

    //move to bytes
    for(let i = 0; i < attributes.length; ++i){
        const info_ = info[i];
        info_.stride = stride * 4;
        info_.offset *= 4;
    }

    return {
        data : data,
        attributes : info
    };
}

