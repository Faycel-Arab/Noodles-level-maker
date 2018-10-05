const TILES = {

    "regular":{
        "ortho-grey":{
            length: 5,
            map   : [2,4,4,4,4]
        },
        "ortho-orange":{
            length: 5,
            map   : [2,4,4,4,4]
        },
        "hex-dark":{
            length: 11,
            map   : [3,6,6,6,6,6,6,2,6,3,6]
        },
        "hex-orange":{
            length: 11,
            map   : [3,6,6,6,6,6,6,2,6,3,6]
        }
    },
    
    "starting":{
        "ortho-grey":{
            length: 5,
            map   : [2,4,0,0,4]
        },
        "ortho-orange":{
            length: 5,
            map   : [2,4,0,0,4]
        },
        "hex-dark":{
            length: 2,
            map   : [0,6]
        },
        "hex-orange":{
            length: 2,
            map   : [0,6]
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
        const img        = new Image();
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
 * @param {string} atlas  : level atlas name
 * @return {string} atlas short name
 */
function getAtlasShort( atlas ){
    return atlas.substring( 0, atlas.indexOf("-"));
}

/**
 * generate a new tile object with a valid randomized "r"
 * @param {object}  tile                                       : {'r': rotation, 't': tile index}
 * @param {integer} rotations                                  : number or rotations
 * @return {object} new tile object with an additional property: 
 * required moves to reach original rotation
 */
function randomRotation( tile, rotations){
    
    // generate an array of possible rotations
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

function loadImagesFromFileList( files ){

    let index = -1, images = [];


    return new Promise( resolve => {
        
        function load( ){
        
            if( index < files.length - 1 ){
                                
                index = index + 1;
                loop()
            }
    
            else 
                resolve( images )
        }
    
        function loop(){
            
            // try file reader
            try{
                
                if( !FileReader )
                    throw "Your browser doesn't support file reading";
                
                // read files 
                let fr        = new FileReader();
                    fr.onload = () => {
                        
                        asyncImageLoader( fr.result ) 
                        .then( img => {
    
                            // save to images
                            images.push ({
                                name : files[index].name,
                                image: img
                            })
                            
                            load()
                            
                        })
                    }
                    fr.readAsDataURL( files[index] );
            }
            catch(e){
                console.error(e);
            }
        }
        load()    
    })
    
}

/**
 * highlight a specified portion of the canvas
 * @param {*} ctx       : target canvas context (2d)
 * @param {*} dimensions: rectangle dimensions
 * @param {*} x
 * @param {*} y
 */
function highlightTile( ctx, dimensions, x, y, type = "ortho"){

    let topIndex  = 0;
    let leftIndex = 0;

    if( type === "hex" && x%2 === 0 )
        topIndex = dimensions/2

    if( type === "hex" && x > 0)
        leftIndex = ( dimensions/4 * x);

    // set x,y position for highlighting
    const xPos = dimensions * x - leftIndex;
    const yPos = dimensions * y + topIndex;

    // fill tile
    ctx.fillStyle = "rgba(0,233,47,0.3)";
    ctx.fillRect( xPos, yPos, dimensions, dimensions );
}

/**
 * returns  event target element
 */
function eventTarget(e){
    let targ;
	if   (!e) var e             = window.event;
	if   (e.target) targ        = e.target;
	else if (e.srcElement) targ = e.srcElement;
	if (targ.nodeType == 3) // defeat Safari bug
		targ = targ.parentNode;
	return targ;
}

/**
 * get mouse relative position to element
 * this is a naive hack 
 * and it assumes the world is a beautiful place
 * @param {object} e
 * @return {object}
 */
function mouseRelativePos(e){

    // get event target
    let elm = eventTarget(e)

    // get mouse pos relative to document
    const mPos ={
        x: e.pageX,
        y: e.pageY
    }
    
    // get element position on page
    const dPos = ( function(){
        var curleft, curtop = curleft = 0;
        if (elm.offsetParent) {
            do {
                curleft += elm.offsetLeft;
                curtop  += elm.offsetTop;
            } while (elm = elm.offsetParent);
        }
        return {
            left: curleft,
            top : curtop
        };
    })();
    
    return {
        x: mPos.x - dPos.left,
        y: mPos.y - dPos.top
    }
}

function formatTime(ms){
    
    let   seconds = ms /1000
    const hours   = parseInt( seconds / 3600 )
          seconds = parseInt(seconds % 3600)
    const minutes = parseInt(seconds / 60)
    const rem     = ms - ( ( (hours*3600)+(minutes*60)+seconds ) * 1000)

    const hh = hours.toString().length < 2 ? "0"+hours : hours
    const mm = minutes.toString().length < 2 ? "0"+minutes : minutes
    const ss = seconds.toString().length < 2 ? "0"+seconds : seconds
    const re = rem.toString().length < 3 ? "0".repeat(3- rem.toString().length)+rem : rem

    return hh+":"+mm+":"+ss+":"+re
}

function whichArrow( keyCode ){

    let arrow;

    switch( keyCode ){

        case 37: 
            arrow = "LEFT";
            break;

        case 38: 
            arrow = "UP";
            break;
        
        case 39: 
            arrow = "RIGHT";
            break;
            
        case 40: 
            arrow = "DOWN";
            break;

        default: 
            arrow = undefined;
            break;
    }

    return arrow;
}


module.exports = {
    asyncImageLoader      : asyncImageLoader,
    Tiles_Map             : Tiles_Map,
    drawToCanvas          : drawToCanvas,
    getAtlasShort         : getAtlasShort,
    randomRotation        : randomRotation,
    highlightTile         : highlightTile,
    mouseRelativePos      : mouseRelativePos,
    loadImagesFromFileList: loadImagesFromFileList,
    formatTime            : formatTime,
    whichArrow            : whichArrow  
}


