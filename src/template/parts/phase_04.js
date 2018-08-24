import React from 'react';
import Canvas from '../components/canvas';
import {asyncImageLoader, drawToCanvas} from '../../functions';


class LevelProcessor extends React.Component{

    constructor(props){
        super(props);

        this.state = {

            // generated levels
            levels: [],

            // for UI
            level_canvas_id     : "level",
            tile_canvas_id      : 'tile',
            comparison_canvas_id: "comparison", 
        }
    }


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
                        reject();
                })
            } 

            function loop(c){

                step(c)
                .then( c => loop(c), () => stop() )
            }

            function stop(){
                reject()
            }

            function start(){
                loop(c)
            }

            // start
            start();
        })

    }

    setTile( canvas, ctx, img ){
        return new Promise( ( resolve, reject ) => {

            drawToCanvas( canvas, ctx, img.image )
            .then( () => setTimeout( () => resolve(), 2000) )
        })
    }

    startComparison( cvs, images, stopOnFirstMatch = false ){

        this.recursiveCall( images.length-1, 0, index => {
            return new Promise( ( resolve, reject ) => {
                this.setTile( cvs.t_canvas, cvs.t_ctx, images[index] )
                .then( () => resolve() );
            })
        }).then( undefined, () => {
            console.log("done");
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

        // execute the following and catch any error
        try{

            if( !FileReader ){
                throw "Your browser doesn't support file reading";
                this.props.handleError("An error has occured please check console for more informations.");
            }

            // loop through each file 
            Array.from( this.props.levelImages ).forEach( file => {
     
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

                        this.startComparison( cvs, this.props.regularTiles );
                        
                    })
                }
                // read file
                fr.readAsDataURL( file );
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