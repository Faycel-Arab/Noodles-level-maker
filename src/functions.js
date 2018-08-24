const TILES = {

    "regular":{
        "ortho-grey":{
            length: 4,
            map   : [2,4,4,4]
        }
    },
    
    "starting":{
        "ortho-grey":{
            length: 3,
            map   : [2,4,4]
        }
    }
}

// return comparison tiles map
const Tiles_Map = function( position, atlas ){
    return TILES[position][atlas];
}

/**
 * load an image asynchronously
 * @param {string} src: image source folder 
 * @return {Promise}
 */
function asyncImageLoader( src ){
    return new Promise( ( resolve, reject ) => {
        const img = new Image();
        img.onload = () => {
            resolve(img);
        }
        img.onerror = ( msg ) => {
            console.error( "cannot load resources from: "+src, msg);
            reject(msg)
        }
        img.src = src;
    })
}

// draw an image to canvas
function drawToCanvas( canvas, ctx, img ){
    return new Promise( ( resolve, reject ) => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage( img, 0, 0 );
        resolve();
    })
}

module.exports = {
    asyncImageLoader: asyncImageLoader,
    Tiles_Map       : Tiles_Map,
    drawToCanvas    : drawToCanvas
}

