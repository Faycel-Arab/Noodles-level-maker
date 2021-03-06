import React from 'react';
import Canvas from '../components/canvas';
import {
        asyncImageLoader,
        drawToCanvas,
        getAtlasShort,
        Tiles_Map,
        randomRotation,
        formatTime 
        } from '../../functions';
import {saveAs} from 'file-saver/FileSaver';


class LevelProcessor extends React.Component{

    constructor(props){
        super(props);

        this.state = {

            // generated levels
            levels: [],

            // params
            similarityFactor: 85,

            // for UI
            level_canvas_id     : "level",
            tile_canvas_id      : 'tile',
            comparison_canvas_id: "comparison",
            progress            : 0,
            
            // generating levels done?
            done: false,

            // time elapsed since the fetch started
            elapsedTime: 0,
        }
    }

    /**
     * execute a callback recursively 
     * @param {integer} maxRecursion: number of recursions,
     * which actually this number - c
     * @param {integer} c        : current count
     * @param {function} callback: callback to execute. it receives current count as param
     * @return {promise} 
     */
    recursiveCall( maxRecursions, c = 0, callback ){

        return new Promise( ( resolve, reject ) => {

            let count = c;

            function step(c){
                return new Promise( ( resolve, reject ) => {
                    if( count < maxRecursions )
                        callback( count )
                        .then( () => {
                                count = count +1;
                                resolve( count + 1 );
                        });
                    else
                        reject( false );
                })
            }

            function loop(c){
                step(c)
                .then( c => loop(c), ( flag ) => stop( flag ) )
            }

            function stop( flag ){
                resolve( flag )
            }

            function start(){
                loop(c)
            }

            // start
            start();
        })

    }

    /**
     * draw provided image to provided canvas
     * @param {object} canvas
     * @param {object} ctx: canvas context
     * @param {object} img: HTMLImageElement
     */
    setTile( canvas, ctx, img ){
        return new Promise( ( resolve, reject ) => {

            drawToCanvas( canvas, ctx, img.image)
            .then( () => setTimeout( () => resolve(), 0) )
        })
    }

    /**
     * compare two images pixels and return their similarity percentage
     * @param {object} data1: first image data as array
     * @param {object} data2: second image data as array
     * @return {integer} similarity percentage 
     */
    compare( data1, data2 ){

        // make sure we have the same data length 
        // return 0 as similarity result
        if( data1.length !== data2.length )
            return 0;

        // count different pixels
        let diff_pxs = 0;  // different pixels

        // number of pixels
        const px_num = data1.length;

        // loop through each pixel
        for( let i=0; i<px_num; i++ )
            if( data1[i] !== data2[i] )
                diff_pxs++;

        // return a similarity percentage
        return 100 - ( diff_pxs / px_num * 100 ) ;
    }

    /**
     * select and return image data from level image(canvas)
     * @param {object} canvas
     * @param {object} ctx
     * @param {string} atlas_short: atlas short name
     * @param {integer} index     : tile index
     * @return {object} imageData
     */
    selectLevelTile( canvas, ctx, atlas_short, index ){

        // aliases 
        const cols = this.props.cols;
        const rows = this.props.rows;

        let width, height;

        // get tile x,y position
        const x = index % cols
        const y = Math.floor( index / cols );

        const tol = 1;

        // selection portion
        // 4 edge points of tile rectangle
        let portion = {};
        let spacing;

        switch( atlas_short ){

            case "ortho": 
                // get tile width and height 
                width  = canvas.width / cols;
                height = canvas.height / rows;

                // calc portion
                portion.a = width * x;
                portion.b = width;
                portion.c = height * y;
                portion.d = height;
                break;

            case "hex": 
                // get tile width and height 
                //width  = canvas.width / (cols - ( Math.floor( cols / 2 ) / 2 ));
                switch ( cols ){

                    case 5: 
                        width   = canvas.width / cols + ( canvas.width / cols ) / 4;
                        spacing = 2;
                        break;

                    case 6: 
                        width   = canvas.width / cols + ( canvas.width / cols ) / 4;
                        spacing = 2;
                        break;

                    case 7: 
                        width   = canvas.width / ( ( cols / 2 ) + ( Math.floor( (cols + 1) / 4 ) + (1/4) ) );
                        spacing = 4.5;
                        break;

                    case 8: 
                        width   = canvas.width / ( ( cols / 2 ) + ( Math.floor( (cols + 1) / 4 ) + (1/4) ) );
                        spacing = 1;
                        break;
                }
                height = ( canvas.height / (rows*2+1) ) * 2;

                // odd indexed tiles are pushed to bottom by a determined value 'topIndex' 
                let topIndex = x % 2 === 0 ? height / 2 : 0;

                portion.a = width * x - ( width/4 * x ) + (spacing * x);
                portion.b = width;
                portion.c = height * y + topIndex;
                portion.d = height;

                break;
        }
        
        return ctx.getImageData( portion.a, portion.c, portion.b, portion.d );
    }

    /**
     * detect tiles in main canvas
     * @param {object} cvs: canvases
     * {canvas, ctx, tile canvas, tile ctx, comparison canvas, comparison ctx}
     * @param {object} images: array of HTMLImageElement
     *  (tiles images to use for comparison)
     * @param {string} atlas
     */
    startComparison( cvs, regular_images, starting_images, atlas_short, atlas ){

        // aliases (shortcuts)
        const cols = this.props.cols;
        const rows = this.props.rows;
        const sf   = this.state.similarityFactor;

        // tiles array 
        const tiles = { tiles: [], start: undefined};
        //const shuffledTiles = { tiles: [], start: undefined, rm: 0};
        const shuffledTiles = [];

        // cache var to avoid re-declaration
        let compData;

        return new Promise( (resolve, reject ) => {

            // first detect regular tiles 
            this.recursiveCall( cols*rows, 0, index => {

                return new Promise( ( resolve, reject ) => {

                    // select tile data from main canvas
                    compData = this.selectLevelTile( cvs.canvas, cvs.ctx, atlas_short, index );

                    // set dimensions
                    cvs.c_canvas.width  = compData.width;
                    cvs.c_canvas.height = compData.height;

                    // draw to comparison canvas
                    cvs.c_ctx.putImageData( compData, 0, 0 );

                    // perform tile detection 
                    this.detectTile( cvs.t_canvas, cvs.t_ctx, regular_images, compData )
                    .then( data => {

                        // randomly rotate tile
                        // number of rotations available for current tile
                        let rotations           = Tiles_Map( "regular", atlas ).map[index];
                        let randomlyRotatedTile = randomRotation( data, rotations);
                        
                        shuffledTiles.push( randomlyRotatedTile );
                        
                        /*shuffledTiles.tiles.push( randomlyRotatedTile.tile);
                        shuffledTiles.rm += randomlyRotatedTile.rm;*/

                        // push tile data 
                        tiles.tiles.push(data)

                        resolve()
                    });
                })

            }).then( () => { // detect starting tile

                let startTileIndex;
                let startTile;

                let startRM;

                let max_sim = 0;

                this.recursiveCall( cols*rows, 0, index => {

                    return new Promise( ( resolve, reject ) => {

                        // select tile data from main canvas
                        compData = this.selectLevelTile( cvs.canvas, cvs.ctx, atlas_short, index );

                        // set dimensions
                        cvs.c_canvas.width  = compData.width;
                        cvs.c_canvas.height = compData.height;

                        // draw to comparison canvas
                        cvs.c_ctx.putImageData( compData, 0, 0 );

                        // perform tile detection and return max similarity
                        this.detectTile( cvs.t_canvas, cvs.t_ctx, starting_images, compData, true )
                        .then( data => {

                            if( data.result > max_sim ){

                                startTileIndex = index;
                                startTile      = data.tile;
                                max_sim        = data.result;
                                
                                /*shuffledTiles.tiles[index] = randomlyRotatedTile.tile;
                                startRM = randomlyRotatedTile.rm;*/

                            }
                            resolve()
                        });
                    })

                })
                .then( () => {

                    /*shuffledTiles.rm = startRM;
                    shuffledTiles.start = startTileIndex;*/

                    tiles.tiles[ startTileIndex ] = startTile;
                                tiles.start       = startTileIndex;

                    // randomly rotate tile
                    // number of rotations available for current tile
                    let rotations           = Tiles_Map( "starting", atlas ).map[startTile['t']];
                    let randomlyRotatedTile = randomRotation( startTile, rotations);

                    shuffledTiles[startTileIndex].tile = randomlyRotatedTile.tile;
                    shuffledTiles[startTileIndex].rm   = randomlyRotatedTile.rm;

                    resolve( { tiles: tiles, shuffledTiles: shuffledTiles} );
                })

            })
        })
    }

    /**
     * detect tile type and rotation 
     * @param  {object}  canvas  : tile canvas
     * @param  {object}  ctx     : tile canvas context
     * @param  {object}  images  : array of images HTMLImageElement (used for comparison)
     * @param  {object}  compData: comparison image data
     * @param  {Boolean} res     : return max sim or not default to false
     * @return {object}  tile type and rotation object{'t','r'}
     */
    detectTile( canvas, ctx, images, compData, res = false ){

        // tile data
        let tile = { "t": undefined, "r": undefined };

        // cache similarity var to avoid re-declaring
        let similarity;

        // store max similarity
        let max_sim = 0;

        return new Promise( (resolve, reject ) => {

            this.recursiveCall(images.length, 0, index => {

                return new Promise( ( resolve, reject ) => {

                    // set tile image to tile canvas
                    this.setTile( canvas, ctx, images[index] )
                    .then( () => {
                        
                        // set comparison points from tile canvas
                        // select exactly as much pixels as comparison image 
                        const x  = canvas.width/2  - compData.width/2;
                        const y  = canvas.height/2 - compData.height/2;
                        const x2 = compData.width;
                        const y2 = compData.height;

                        // get tile data
                        const tileData = ctx.getImageData( x, y, x2, y2 );

                        // compare 
                        similarity = this.compare( tileData.data, compData.data );

                        // set max sim and tile data if results are higher
                        if( similarity > max_sim ){
                            max_sim = similarity;
                            tile    = {"t":images[index].folder_index, "r":images[index].tile_index};
                        }

                        resolve()
                    })
                })

            })
            .then( () => { // resolve tile data
                if ( res )
                    resolve( { tile: tile, result: max_sim })
                else
                    resolve( tile ) 
            }) 
        })
    }

    componentDidMount(){

        // select canvases and their respective contexts
        let canvas = document.querySelector("#"+this.state.level_canvas_id);
        let ctx    = canvas.getContext('2d');

        let t_canvas = document.querySelector("#"+this.state.tile_canvas_id);
        let t_ctx    = t_canvas.getContext('2d');

        let c_canvas = document.querySelector("#"+this.state.comparison_canvas_id);
        let c_ctx    = c_canvas.getContext('2d');

        // levels
        // array of objects 
        // name & content
        const levels_tiles          = [];
        const levels_shuffled_tiles = [];

        // Aliases
        const Atlas       = this.props.atlas;
        const Atlas_short = getAtlasShort(Atlas);

        // caching to avoid re-declaring
        let level;
        let shuffledLevel;

        // execute the following and catch any error
        try{

            const date = new Date().getTime()

            let loop = setInterval( () => {
                
                const now = new Date().getTime()
                
                const et = now - date
                
                if( this.state.done)
                    clearInterval(loop)

                this.setState({
                    elapsedTime: et
                })
            }, 100)

            if( !FileReader ){
                throw "Your browser doesn't support file reading";
                this.props.handleError("An error has occurred please check console for more informations.");
            }

            this.recursiveCall( this.props.levelImages.length, 0, index => {

                return new Promise( ( resolve, reject ) => {
                    // init a file reader 
                    let fr        = new FileReader();
                        fr.onload = () => {

                        asyncImageLoader( fr.result ) 
                        .then( img => {
                        
                            // set canvas dimensions
                            canvas.width  = img.width;
                            canvas.height = img.height;

                            // draw to canvas ctx
                            ctx.drawImage( img, 0, 0);

                            let cvs = {
                                canvas: canvas,
                                ctx   : ctx,

                                t_canvas: t_canvas,
                                t_ctx   : t_ctx,

                                c_canvas: c_canvas,
                                c_ctx   : c_ctx,
                            }

                            // start comparing
                            this.startComparison( cvs, this.props.regularTiles, this.props.startingTiles, Atlas_short, Atlas )
                            // receive tiles
                            .then( ( res ) => {

                                // create a level object
                                level={
                                    "tile-type": Atlas_short,
                                    "atlas"    : Atlas,
                                    "width"    : this.props.cols,
                                    "height"   : this.props.rows,
                                    "tiles"    : res.tiles.tiles,
                                    "start"    : res.tiles.start,
                                }

                                // create a shuffled level object
                                // create tiles array
                                let ta = Array(res.shuffledTiles.length).fill(0).map( (v, i) => {
                                    return {
                                        "t": res.shuffledTiles[i].tile['t'], "r": res.shuffledTiles[i].tile['r']
                                    }
                                });
                                // calc number of required moves
                                let rm            = res.shuffledTiles.reduce( ( a, cv ) => a + cv.rm, 0 );
                                let rm_arr        = Array(4).fill(0).map( ( v, i ) => v + 5*i );
                                    shuffledLevel = {
                                    "tile-type": Atlas_short,
                                    "atlas"    : Atlas,
                                    "width"    : this.props.cols,
                                    "height"   : this.props.rows,
                                    "tiles"    : ta,
                                    "start"    : res.tiles.start,
                                    "moves"    : rm_arr
                                }


                                levels_tiles.push( level );
                                levels_shuffled_tiles.push( shuffledLevel );
                                this.setState({ progress : index + 1})
                                resolve(true);
                            })
                            
                        })
                    }
                    // read file
                    fr.readAsDataURL( this.props.levelImages[index] );
                })
            })
            .then( () => {

                this.setState({
                    levels: levels_tiles
                })

                // caching
                let blob;
                let blob2;
                let name;

                let lvls = [];

                // generate and download level files
                levels_tiles.forEach( ( file, index ) => {
                    //saveAs( blob, name+'.solved.json');

                    lvls.push( file ); 

                })

                this.props.setLevels( lvls )
                this.setState({
                    done: true
                })

            }) 

        }
        catch(e){
            console.error(e);
        }

    }

    render(){
        return(
            <div className="processing">

                <div className="level-processor" key={0} >
                    <div className="left">
                        <div className="level-canvas">
                            <Canvas 
                                classes    = "level-pic"
                                identifier = {this.state.level_canvas_id}
                            />
                        </div>
                    </div>
                                    
                    <div className="right">
                        <div className="tiles-canvas">
                            <Canvas
                                classes    = "tile-pic"
                                identifier = {this.state.tile_canvas_id}
                            />
                        </div>

                        <div className="comparison-canvas">
                            <Canvas
                                classes    = "tile-pic"
                                identifier = {this.state.comparison_canvas_id}
                            />
                        </div>
                    </div>
                </div>

                <div className="progress-bloc" key={1} >

                    <div>
                        <h2>Progress</h2>

                        <p>{this.state.progress + " of "+this.props.levelImages.length}</p>
                    </div>
                    
                    <div className="elapsed-time">
                        {formatTime(this.state.elapsedTime)}
                    </div>

                </div>
            </div>
            
        )
    }
}
module.exports = LevelProcessor;