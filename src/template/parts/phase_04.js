import React from 'react';
import Canvas from '../components/canvas';
import {asyncImageLoader, drawToCanvas, getAtlasShort} from '../../functions';


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
        }
    }

    /**
     * execute a callback recursivly 
     * @param {integer} maxRecursion: number of recursions,
     * which actually this number - c
     * @param {integer} c: current count
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
                        .then( ( flag ) => {
                            if( flag ){
                                count = count +1;
                                resolve( count + 1 );
                            }
                            else
                                reject( true );
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
            .then( () => setTimeout( () => resolve(), 1) )
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
        let diff_pxs = 0; // different pixels

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
     * @param {string} atlas
     * @param {integer} index: tile index
     * @return {object} imageData
     */
    selectLevelTile( canvas, ctx, atlas, index ){

        // aliases 
        const cols = this.props.cols;
        const rows = this.props.rows;
        
        // get tile width and height 
        const width = canvas.width / cols;
        const height = canvas.height / rows;

        // get tile x,y position
        const x = index % cols
        const y = Math.floor( index / cols );

        // selection protion
        // 4 edge points of tile rectangle
        let portion = {};

        switch( getAtlasShort( atlas ) ){

            case "ortho": 
                portion.a = width * x + width/5;
                portion.b = width - (width/5)*2;
                portion.c = height * y + height/5;
                portion.d = height - (height/5)*2;
                break;
        }

        // fill tile
        /*ctx.fillStyle = "rgba(0,233,47,0.3)";
        ctx.fillRect( portion.a, portion.c, portion.b, portion.d );*/
        
        return ctx.getImageData( portion.a, portion.c, portion.b, portion.d );
    }

    /**
     * start comparing level images to tiles
     * @param {object} cvs: canvases 
     * {canvas, ctx, tile canvas, tile ctx, comparison canvas, comparison ctx}
     * @param {object} images: array of HTMLImageElement
     *  (tiles images to use for comparison)
     * @param {Boolean} stopOnFirstMatch: wether to stop on first match or not 
     * use case : to detect a single tile only
     */
    startComparison( cvs, images, stopOnFirstMatch = false ){

        // aliases (shortcuts)
        const cols  = this.props.cols;
        const rows  = this.props.rows;
        const atlas = this.props.atlas;
        const sf    = this.state.similarityFactor; 

        // tiles array 
        const tiles = [];

        // store max similarity
        // store tiles indexes with the highest similarity
        let max_sim = 0;
        let ti;

        return new Promise( (resolve, reject ) => {

            this.recursiveCall( cols*rows, 0, i => {

                return new Promise( (resolve, reject ) => {

                    // reset
                    max_sim = 0;
                    ti = null;

                    // select level tile ( image data )
                    let data = this.selectLevelTile( cvs.canvas, cvs.ctx, atlas, i );

                    // set dimensions
                    cvs.c_canvas.width  = data.width;
                    cvs.c_canvas.height = data.height;

                    // draw to comparison canvas
                    cvs.c_ctx.putImageData( data, 0, 0 );

                    // loop throught each tile and compare
                    this.recursiveCall( images.length, 0, index => {

                        return new Promise( ( resolve, reject ) => {
                            
                            // set tile image to tile canvas
                            this.setTile( cvs.t_canvas, cvs.t_ctx, images[index] )
                            .then( () => {

                                // do the comparison between comparison and tile canvas
                                // get image data from tile & comparison canvas

                                // select tile image data from the center 
                                // select exacly as much pixels as comparison image data
                                const x  = cvs.t_canvas.width/2  - data.width/2;
                                const y  = cvs.t_canvas.height/2 - data.height/2;
                                const x2 = data.width;
                                const y2 = data.height;
                                const tileData = cvs.t_ctx.getImageData( x, y, x2, y2 );
                                
                                // select comparison image data
                                const compData = cvs.c_ctx.getImageData( 0, 0, cvs.c_canvas.width, cvs.c_canvas.height );

                                // compare
                                let similarity = this.compare( tileData.data, compData.data );
                                
                                if( similarity > max_sim ){
                                    max_sim = similarity;
                                    ti = {"t":images[index].folder_index, "r":images[index].tile_index};
                                }

                                console.log( i+" : "+images[index].folder_index+" - "+images[index].tile_index, "Result: "+ similarity);

                                resolve(true)
                            })
                        })
                    })
                    .then( (flag ) => {
                        tiles.push(ti);
                        resolve(true)
                    });
                })
            })
            .then( () => resolve( tiles ) );
        })
    }

    componentDidMount(){

        // select canvases and their respective contexts
        let canvas   = document.querySelector("#"+this.state.level_canvas_id); 
        let ctx      = canvas.getContext('2d');

        let t_canvas = document.querySelector("#"+this.state.tile_canvas_id); 
        let t_ctx    = t_canvas.getContext('2d');

        let c_canvas = document.querySelector("#"+this.state.comparison_canvas_id); 
        let c_ctx    = c_canvas.getContext('2d');

        // levels tiles
        const levels_tiles = [];

        // execute the following and catch any error
        try{

            if( !FileReader ){
                throw "Your browser doesn't support file reading";
                this.props.handleError("An error has occured please check console for more informations.");
            }

            this.recursiveCall( this.props.levelImages.length, 0, index => {

                return new Promise( ( resolve, reject ) => {
                    // init a file reader 
                    let fr = new FileReader();
                    fr.onload = () => {

                        asyncImageLoader( fr.result ) 
                        .then( img => {
                        
                            // set canvas dimenssions
                            canvas.width = img.width;
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
                            this.startComparison( cvs, this.props.regularTiles )
                            // recieve tiles
                            .then( ( tiles ) => {
                                levels_tiles.push( tiles );
                                resolve(true);
                            })
                            
                        })
                    }
                    // read file
                    fr.readAsDataURL( this.props.levelImages[index] );
                })
            })
            .then( () => {
                console.log(levels_tiles);
            }) 

        }
        catch(e){
            console.error(e);
        }

    }
    
    render(){
        return(
            <div className="level-processor">
                <div className="left">
                    <div className="level-canvas">
                        <Canvas 
                            classes="level-pic"
                            identifier={this.state.level_canvas_id}
                        />
                    </div>
                </div>
                                
                <div className="right">
                    <div className="tiles-canvas">
                        <Canvas
                            classes="tile-pic"
                            identifier={this.state.tile_canvas_id}
                        />
                    </div>

                    <div className="comparison-canvas">
                        <Canvas
                            classes="tile-pic"
                            identifier={this.state.comparison_canvas_id}
                        />
                    </div>
                </div>
            </div>
        )
    }
}
module.exports = LevelProcessor;