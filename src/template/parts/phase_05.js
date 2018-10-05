import React from 'react';
import TilesTable from '../components/tiles-table';
import {
        highlightTile,
        mouseRelativePos,
        loadImagesFromFileList,
        whichArrow,
        getAtlasShort,
        randomRotation,
        Tiles_Map
        } from '../../functions';
import {saveAs} from 'file-saver/FileSaver';

class Levels_checker extends React.Component{
    constructor(props){
        super(props);

        this.state = {

            levels: this.props.levels,   // levels json

            images: [],   // Levels images

            regular_tiles: this.props.regularTiles,   // levels regular images

            starting_tiles: this.props.startingTiles,   // levels starting images
            
            tiles: this.props.tiles,   // required tiles

            index: 0,   // current level index

            board_width: 450,   // canvases default width

            selectedIndex: 0,   // index of selected tile

            // UI
            selectedTile: undefined,

            selectedTileType: "regular",

            displayTable: false,

        }
    }
 
    next(direction){
        
        // check if valid direction is provided
        if ( !direction || 
            Math.abs(direction) !== 1) {
                
            console.error("invalid direction parameter, direction can either be 1 or -1 ");
            return;
        }

        let index  = this.state.index;
            index += direction;

        if ( index >= 0 && index <= this.state.levels.length-1 )
            this.setState({
                index: index
            });
    }

    /**
     * draw image to level image canvas
     */
    setLevelImage(){
        
        // create canvas ref
        const canvas = document.querySelector("#level_image");
        const ctx    = canvas.getContext('2d');

        // quick refs
        const index = this.state.index;

        const img = this.state.images[index].image;

        ctx.drawImage( img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height );
    }

    /**
     * return tile dimensions based on tile type
     * and number of columns
     * @param {string} type
     * @param {integer} cols
     * @returns {integer} dimensions
     * @memberof Levels_checker
     */
    getTileDimensions( type, cols ){
        
        const width = this.state.board_width;

        // tile dimensions
        let dimensions;
        
        switch ( type ){

            case "ortho": 
                dimensions = width / cols;
                break;

            case "hex": 
                 dimensions = width / cols + ( width / cols )/4;
                 break;

        }

        return dimensions
    }

    /**
     * draw tile to generated level board
     * @param {object} tile  : tile data {t,r}
     * @param {string} type  : tile type "ortho", "hex"
     * @param {integer} cols : columns
     * @param {integer} index: tile index
     * @memberof Levels_checker
     */
    drawTile( tile, type, cols, i, flag = "regular" ){
        
        // create canvas ref
        const canvas = document.querySelector("#generated_level")
        const ctx    = canvas.getContext('2d')

        // get tile position 
        const position = this.getXyFromIndex( i, cols )

        // get tile dimensions
        const dimensions = this.getTileDimensions( type, cols )

        // aliases
        const index = this.state.index;
        
        // caching
        let x,y;

        // get tile image
        let img;
        if( flag === "regular" )
            img = this.state.regular_tiles.find( item => {
                        return item.folder_index === tile.t
                            && item.tile_index === tile.r;
                    });

        else
            img = this.state.starting_tiles.find( item => {
                        return item.folder_index === tile.t
                            && item.tile_index === tile.r;
                    });

        img = img.image;
            
        // draw tile
        switch( type ){

            case "ortho": 
                x = dimensions * position.x;
                y = dimensions * position.y;
                ctx.drawImage( img, 0, 0, img.width, img.height, x+4, y+4, dimensions-4, dimensions-4 );
                break;

            case  "hex"                                        : 
            const topIndex = position.x% 2 ===0 ?dimensions / 2: 0;
                x = dimensions *position.x - ( dimensions/4 * position.x)
                y = dimensions *position.y +topIndex
                ctx.drawImage( img, 0, 0, img.width, img.height, x+4, y+4, dimensions-4, dimensions-4 );
                break;
        }

    }

    /**
     * returns x,y position based on tile index 
     * and number of columns
     * @param {integer} index
     * @param {integer} cols
     * @returns {object} x,y position
     * @memberof Levels_checker
     */
    getXyFromIndex( index, cols ){
        
        return {
            x: index % cols,
            y: Math.floor( index / cols )
        }
    }

    getIndexFromXy( x, y, cols ){
        
        return y*cols + x;
    }

    fakeMousePos( x, y, cols, rows, type ){

        // tile dimension
        const dim = this.getTileDimensions( type, cols);

        let mousePos = {
            x: undefined,
            y: undefined
        }

        if( type === "hex"){

            const topIndex  = x % 2 === 0 ? dim / 2 : 0;
            const leftIndex = dim/4 * (x-1) - 1;

            mousePos.x = x * dim - leftIndex ;
            mousePos.y = y * dim + topIndex;
            
        }

        else{

            mousePos.x = x/cols * (cols*dim);
            mousePos.y = y/rows * (rows*dim);
        }

        console.log( mousePos )

        return mousePos;
    }


    /**
     *  draw level tiles
     */
    drawLevel(){
        
        const level = this.state.levels[this.state.index];

        // create canvas ref
        const canvas = document.querySelector("#generated_level");
        const ctx    = canvas.getContext('2d');

        // get params from level 
        const cols  = level.width;
        const type  = level["tile-type"];
        const tiles = level.tiles;

        // caching
        let flag = "regular";

        // apply a white background
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height );
        ctx.fillStyle = "white";
        ctx.fill();

        // start drawing
        tiles.forEach( ( tile, i ) => {
            if( level.start === i )
                flag = "starting";

            else
                flag = "regular";
                
            this.drawTile( tile, type, cols, i, flag ) 
        })
    }

    setBoardsDimensions(){

        const index = this.state.index;
        
        const level = document.querySelector("#generated_level");
        const image = this.refs.canvas;
        const rows  = this.state.levels[index].height;
        const cols  = this.state.levels[index].width;
        const type  = this.state.levels[index]["tile-type"];

        // get tile dimensions
        const dimensions = this.getTileDimensions( type, cols );

        // set width
        level.width = this.state.board_width;
        image.width = this.state.board_width;

        // set height
        switch( type ){

            case "ortho": 
                level.height = dimensions * rows;
                image.height = dimensions * rows;
                break;
                
            case "hex": 
                level.height = (rows*2+1) * (dimensions/2);
                image.height = (rows*2+1) * (dimensions/2);
                break;
        }
    }

    /**
     * highlight tile at x,y position
     * @memberof Levels_checker
     */
    selectTile(){

        const mousePos = this.state.selectedTile;

        // check for mousePos
        if( !mousePos || 
            !mousePos.hasOwnProperty("x") || 
            !mousePos.hasOwnProperty("y") ){
                return;
            }
        
        // create canvas ref
        const canvas  = this.refs.levelCanvas
        const ctx     = canvas.getContext('2d')
        const canvas2 = this.refs.canvas
        const ctx2    = canvas2.getContext('2d')

        // quick refs
        const index = this.state.index;
        const cols  = this.state.levels[index].width;
        const rows  = this.state.levels[index].height;
        const type  = this.state.levels[index]["tile-type"];

        // get tile dimensions
        const dimensions = this.getTileDimensions( type, cols );

        // calc tile x,y position from mouse coords
        let x,y; 

        switch(type){
            
            case "ortho": 
                x = Math.floor(mousePos.x / (cols*dimensions) * cols);
                y = Math.floor(mousePos.y / (rows*dimensions) * rows);
                break;

            case "hex": 
                x = mousePos.x <= dimensions ? 0 : Math.floor((mousePos.x - dimensions) / (dimensions/4*3) + 1);
                y = Math.floor( mousePos.y / (rows*dimensions) * rows );
                break;
        }

        if( type === "hex"){
            const topIndex = x % 2 === 0 ? dimensions / 2 : 0;
            if( mousePos.y >= topIndex ){
                 // highlight the same pos in level and generated image
                highlightTile( ctx2, dimensions, x, y, type);
                highlightTile( ctx, dimensions, x, y, type);
            }
        }

        else {
            // highlight the same pos in level and generated image
            highlightTile( ctx2, dimensions, x, y);
            highlightTile( ctx, dimensions, x, y);
        }
        
    }

    /**
     * edit current level 
     * @param {integer} tileIndex
     * @memberof Levels_checker
     */
    setNewTile( tileIndex ){
        
        // quick refs
        const index        = this.state.index;
        const level        = this.state.levels[index];
        const selectedType = this.state.selectedTileType;

        let newTile = (selectedType === "regular")
            ? this.state.regular_tiles[tileIndex]
            :                                                                                                           this.state.starting_tiles[tileIndex]

        level.tiles[ this.state.selectedIndex ] = { t: newTile.folder_index, r: newTile.tile_index}

        const  levels = this.state.levels;
        levels[index] = level;

        this.setState({
            levels      : levels,
            displayTable: false
        })
    }

    /**
     * @param {*} e: event
     * @memberof Levels_checker
     */
    handleKeyPress(e){

        e.preventDefault();

        // accepted keys
        let keys = [ 37, 38, 39, 40 ]
    
        // clicked key code
        let keyCode = e.keyCode;
        // proceed only if an arrows key is clicked
        if( keys.includes( keyCode ) ){

            const index = this.state.index;

            // quick refs
            const cols          = this.state.levels[index].width;
            const rows          = this.state.levels[index].height;
            let   selectedIndex = this.state.selectedIndex;
            let   xyPos         = this.getXyFromIndex( selectedIndex, cols );
            const type          = this.state.levels[index]["tile-type"];
           
            // clicked arrow 
            let arrow = whichArrow( keyCode);

            // starting or regular
            let tileType;

            // we fake a correspondent mouse position
            let mousePos;

            if( arrow && typeof arrow === "string" ){

                switch( arrow ){

                    case    "LEFT"                     : 
                    xyPos.x = xyPos.x > 0 ? xyPos.x - 1: cols-1;
                        break;

                    case "RIGHT": 
                        xyPos.x = xyPos.x < cols-1 ? xyPos.x + 1 : 0; 
                        break;

                    case    "UP"                       : 
                    xyPos.y = xyPos.y > 0 ? xyPos.y - 1: rows-1;
                        break;

                    case "DOWN": 
                        xyPos.y = xyPos.y < rows-1 ? xyPos.y + 1 : 0; 
                        break;
                }

                // set new index
                selectedIndex = this.getIndexFromXy( xyPos.x, xyPos.y, cols);

                // tile type
                tileType = (this.state.levels[index].start === selectedIndex)
                        ? "starting": "regular";

                // fake a mouse position using new x and y
                mousePos = this.fakeMousePos(xyPos.x,xyPos.y,cols,rows,type);

                // set state
                this.setState({
                    selectedTile    : mousePos,
                    selectedIndex   : selectedIndex,
                    selectedTileType: tileType,
                    displayTable    : true
                })
            }

        }


        
    }

    /**
     * @param {*} e: event
     * @memberof Levels_checker
     */
    handleCanvasClick(e){

        // grab mouse coords relative to canvas
        const mousePos = mouseRelativePos(e)
        
        // quick refs
        const index = this.state.index;
        const cols  = this.state.levels[index].width;
        const rows  = this.state.levels[index].height;
        const type  = this.state.levels[index]["tile-type"];

        // get tile dimensions
        let d = this.getTileDimensions( type, cols );

        if( type === "ortho" ){

            let x = Math.floor(mousePos.x / (cols*d) * cols);
            let y = Math.floor(mousePos.y / (rows*d) * rows);

            // calc tile index from x,y pos
            let tileIndex = cols * y + x;
            let tileType  = (this.state.levels[index].start === tileIndex)
                                ? "starting": "regular";

            this.setState({
                selectedTile    : mousePos,
                selectedIndex   : tileIndex,
                selectedTileType: tileType,
                displayTable    : true
            })
        }

        else if( type === "hex" ){

            // calc tile x,y position from mouse coords
            let x = mousePos.x <= d ? 0 : Math.floor((mousePos.x - d) / (d/4*3) + 1);
            let y = Math.floor( mousePos.y / (rows*d) * rows );

            // calc tile index from x,y pos
            let tileIndex = cols * y + x;
            let tileType  = (this.state.levels[index].start === tileIndex)
                                    ?     "starting"                  : "regular";
                                    const topIndex = x % 2 === 0 ? d/2: 0;

            if( x % 2 === 0 && mousePos.y >= topIndex ){
                this.setState({
                    selectedTile    : mousePos,
                    selectedIndex   : tileIndex,
                    selectedTileType: tileType,
                    displayTable    : true
                })
                
            }

            else 
                this.setState({
                    selectedTile    : mousePos,
                    selectedIndex   : tileIndex,
                    selectedTileType: tileType,
                    displayTable    : true
                })
        }

    }

    downloadLevels(){

        let blob;

        let type = this.props.atlas;

        let stars_offset = 7;

        let stars;
        
        // generate and download level files
        this.state.levels.forEach( ( file, index ) => {

            // shuffle level
            let tiles = file.tiles;
            let rotations;
            let newTile; 
            let rm = 0;

            tiles.forEach( ( tile, i ) => {
                rotations = Tiles_Map( "regular", type ).map[tile.t];
                newTile = randomRotation( tile,  rotations )

                file.tiles[i] = newTile.tile;
                rm = rm + newTile.rm; 
            })

            // calc stars 
            stars = Array(4).fill(0).map( (v,i) => rm+stars_offset*i);

            file.moves = stars;

            // level 
            blob = new Blob( [JSON.stringify(file)], {type: "text/json;charset=utf-8"});
            name = this.state.images[index].name;
            name = name.substring( 0, name.lastIndexOf( '.' ) );                          // remove extension from original name
            
            saveAs( blob, name+'.json');

        })
    }

    componentDidMount(){

        // set refs
        this.props.onRef(this)

        // load level images
        loadImagesFromFileList( this.props.levelImages )
        .then( images => {

            // set loaded images
            this.setState({
                images: images
            })
        })
    }

    componentDidUpdate(){

        // create canvas ref
        const canvas  = this.refs.levelCanvas
        const ctx     = canvas.getContext('2d')
        const canvas2 = this.refs.canvas
        const ctx2    = canvas2.getContext('2d')

        // clear canvases
        ctx.clearRect( 0, 0, canvas.width, canvas.height )
        ctx2.clearRect( 0, 0, canvas2.width, canvas2.height )

        
        // set canvases dimensions
        this.setBoardsDimensions()

        // draw level to canvas
        this.setLevelImage()

        // draw level 
        this.drawLevel()
        
        // highlight tile 
        this.selectTile()
        
    }

    render(){

        // Level index
        let counter = this.state.index + 1;

        // tiles table
        const tilesTable = this.state.displayTable ?
            <div className="tiles">
                <TilesTable 
                    tiles         = {this.state.selectedTileType === "regular" ? this.state.regular_tiles : this.state.starting_tiles}
                    selectHandler = {( tile ) => this.setNewTile(tile)}
                />
            </div>: 
            <div></div>;
        
        return(
            <div 
                id        = "level-checker"
                onKeyDown = {this.handleKeyPress.bind(this)}
                tabIndex  = {0}
            >

                <canvas
                    ref       = "canvas"
                    className = "level-image"
                    id        = "level_image"
                />

                <canvas 
                    ref       = "levelCanvas"
                    id        = "generated_level"
                    className = "generated-level"
                    onClick   = {this.handleCanvasClick.bind(this)}
                />
                

                <div className="moveNswitch">
                    <div className="arrows">

                        <span 
                            className = "arrow left"
                            onClick   = {() => this.next(-1)}
                        >
                            <i></i>
                        </span>
                        
                        <span 
                            className="level-index">
                            {counter+"/"+this.state.levels.length}
                        </span>
                        
                        <span 
                            className = "arrow right"
                            onClick   = {() => this.next(1)}
                        >
                            <i></i>
                        </span>
                    </div>  
                    
                    {tilesTable}

                </div>
            </div>
        )
    }
}
module.exports = Levels_checker;
