import React from 'react';

import Tiles_Map from '../../functions';

class Setup extends React.Component{

    constructor(props){
        super(props);

        this.state = {

            // images
            images: { starting: [], regular: [] },

            // starting tiles map 
            STM: Tiles_Map( "starting", this.props.atlas ).map,

            // regular tiles map
            RTM: Tiles_Map( "regular", this.props.atlas ).map,

            // loading or success image
            status_pic: "pacman-loader.gif",

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
    setImageState( obj, key ){

        let imageObj = this.state.images;

        imageObj[key].push( obj );

        this.setState({
            images: imageObj
        })
    }

    /**
     * load tiles images
     * @param {array} map 
     * @param {string} folderName 
     * @param {strig} key
     * @param {integer} tileIndex 
     * @param {integer} folderIndex 
     * @param {function} callback 
     */
    tilesLoader( map, folderName, key, tileIndex = 0, folderIndex = 0, callback ){

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
                        }, key );

                        // if remaining tiles in the same folder
                        if( ti <  map[fi]-1 ){
                            ti = ti + 1;
                            this.tilesLoader( map, fn, key, ti, fi, callback );
                        }

                        else if( fi < map.length-1 ){
                            ti = 0;
                            fi = fi + 1;
                            this.tilesLoader( map, fn, key, ti, fi, callback );
                        }

                        else
                            callback();
                    }, () => {

                       this.props.errorHandler( "We're unable to load some resources, please check console for more info");
                    });
            }
        }
    }

    componentDidMount(){

        if ( !this.state.regular_images_loaded && !this.state.start_images_loaded )

            setTimeout( () => {

                // tell user what is happening 
                this.setState({
                    message: "Loading required assets, please wait..."
                })

                // create Images
                // starting images
                if( this.state.STM && this.state.STM.length > 0 || 
                    this.state.RTM && this.state.RTM.length > 0 )

                    this.tilesLoader( this.state.STM,  "./tiles/starting/", 'starting', 0, 0, () => 
                        this.tilesLoader( this.state.RTM,  "./tiles/regular/", 'regular', 0, 0, () => { 

                            this.setState({
                                message: "Everything is up, your majesty can proceed",
                                status_pic: "success.png",
                            })

                            // set files on parent component {Main}
                            this.props.setFiles( this.state.images )
                        })
                    )

                else 
                    this.props.errorHandler("Sorry cats are unable to find a map for "+this.props.atlas+" tiles")
            
            }, 3000);
    }

    render(){
        return(
            <div className="setup-status">
                <div className="loader">
                    <img src={"./loaders/"+this.state.status_pic} />
                </div>

                <div className="status-message">
                    <pre>{this.state.message}</pre>
                </div>
            </div>
        )
    }
}
module.exports = Setup;