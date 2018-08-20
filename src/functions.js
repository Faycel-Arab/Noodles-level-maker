const TILES = {

    "regular":{
        "ortho-grey":{
            length: 5,
            map   : [2,4,4,4,4]
        }
    },
    
    "starting":{
        "ortho-grey":{
            length: 4,
            map   : [4,4,2,4]
        }
    }


}

const Tiles_Map = function( position, atlas ){
    return TILES[position][atlas];
}

module.exports = Tiles_Map;