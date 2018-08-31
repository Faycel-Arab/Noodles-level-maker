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
        canvas.width  = img.width;
        canvas.height = img.height; 
        ctx.drawImage( img, 0, 0 );
        resolve();
    })
}

/**
 * return atlas short name, ex: ortho-grey = ortho
 * @param {string} atlas: level atlas name
 * @return {string} atlas short name
 */
function getAtlasShort( atlas ){
    return atlas.substring( 0, atlas.indexOf("-"));
}

/**
 * generate a new tile object with a valid randomized "r"
 * @param {object}  tile     : {'r': rotation, 't': tile index}
 * @param {integer} rotations: number or rotations
 * @return {object} new tile object with an additional property: 
 * required moves to reach original rotation
 */
function randomRotation( tile, rotations){
    
    // generate an arrayof possible rotations
    let po = Array( rotations ).fill(0).map( ( v, i ) => i );

    // generate a a randomized rotation
    let rr = Math.floor( Math.random( po.length ));

    // calc number of moves required to reach original rotation
    // tiles rotate clockwise
    let rm;

    if ( rr > tile['r'] )
        rm = tile['r'] + po.length - rr;

    else if ( rr < tile['r'] )
        rm = tile['r'] - rr;

    else
        rm = 0;

    return {
        tile: {'t': tile['t'], 'r': rr},
        rm  : rm 
    } 
}

module.exports = {
    asyncImageLoader  : asyncImageLoader,
    Tiles_Map         : Tiles_Map,
    drawToCanvas      : drawToCanvas,
    getAtlasShort     : getAtlasShort,
    randomRotation    : randomRotation 
}


