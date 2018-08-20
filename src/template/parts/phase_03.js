import React from 'react';

import Tiles_Map from '../../functions';

class Setup extends React.Component{

    constructor(props){
        super(props);

        this.state = {

            // images
            images: [],

            // starting images are loaded 
            start_images_loaded: false,

            // regular images are loaded 
            regular_images_loaded: false,

            // starting tiles map
            STM: Tiles_Map( "starting", this.props.atlas).map,

            // regular tiles map
            RTM: Tiles_Map( "regular", this.props.atlas).map,

            // halt flag
            halt: false,

            // waiting message
            message: "Did you know ? \n The fact that you are reading this is by it self a proof that you didn't know, isn't that right?"

        }
    }

    /**
     * load an image asynchronously
     * @param {string} src: image source folder 
     * @return {Promise}
     */
    asyncImageLoader( src ){
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

  /**
   * push a new object state.images
   * @param {object} obj : {folder_index, tile_index, image}
   */
    setImageState( obj ){

        let imageObj = this.state.images;

        imageObj.push( obj );

        this.setState({
            images: imageObj,
        })
    }

    /**
     * load tiles images
     * @param {array} map 
     * @param {string} folderName 
     * @param {integer} tileIndex 
     * @param {integer} folderIndex 
     * @param {function} callback 
     */
    tilesLoader( map, folderName, tileIndex = 0, folderIndex = 0, callback ){

        // aliases
        let fi = folderIndex;
        let ti = tileIndex;
        const fn = folderName;

        // check if folder index is valid
        if( fi < map.length ){

            // check if tile index is valid
            if( ti < map[fi] ){

                // set image src
                const src = folderName+""+this.props.atlas+"/tile"+fi+"/"+ti+".png";
                
                // load image
                this.asyncImageLoader( src )
                    .then( img => {

                        this.setImageState({
                            folder_index: fi,
                            tile_index: ti,
                            image: img
                        });

                        // if remaining tiles in the same folder
                        if( ti <  map[fi]-1 ){
                            ti = ti + 1;
                            this.tilesLoader( map, fn, ti, fi, callback );
                        }

                        else if( fi < map.length-1 ){
                            ti = 0;
                            fi = fi + 1;
                            this.tilesLoader( map, fn, ti, fi, callback );
                        }

                        else
                            callback();
                    }, () => {
                       // halt everything
                       this.setState({
                           halt: true
                       }) 

                       this.props.errorHandler( "We're unable to load some resources, please check console for more info");
                    });
            }
        }
    }

    componentDidMount(){

        setTimeout( () => {

            // tell user what is happening 
            this.setState({
                message: "Loading required assets, please wait..."
            })
            // create Images
            // starting images
            this.tilesLoader( this.state.STM,  "./tiles/starting/", 0, 0, () => {
                setTimeout( () => {
                    this.setState({
                        starting_images_loaded: true,
                    });

                    if( this.state.regular_images_loaded 
                        || this.state.starting_images_loaded )
                        this.setState({
                            message: "Everything is up, your majesty can proceed"
                        })
                }, 4000);
            });

            // regular images
            this.tilesLoader( this.state.RTM,  "./tiles/regular/", 0, 0, () => {
                setTimeout( () => {
                    this.setState({
                        regular_images_loaded: true,
                    });

                    if( this.state.regular_images_loaded 
                        && this.state.starting_images_loaded )
                        this.setState({
                            message: "Everything is up, your majesty can proceed"
                        })
                }, 4000);
            });
        }, 7000);
    }

    /**
     * display a loader or a success image
     */
    isLoading(){
        if( !this.state.regular_images_loaded 
            || !this.state.starting_images_loaded )
            return(
                <div className="loader">
                    <img src="./loaders/pacman-loader.gif" />
                </div>
            )
        else
            return(
                <div className="loader">
                    <img src="./loaders/success.png" />
                </div>
            )
    }

    render(){
        return(
            <div className="setup-status">
                {this.isLoading()}

                <div className="status-message">
                    <pre>{this.state.message}</pre>
                </div>
            </div>
        )
    }
}
module.exports = Setup;