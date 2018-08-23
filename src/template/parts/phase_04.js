import React from 'react';

class LevelProcessor extends React.Component{

    constructor(props){
        super(props);
    }
    
    render(){
        return(
            <div class="level-processor">
                
                { this.props.regularTiles.map( (tile, i)=> {
                    return(
                        <img key={i} src={tile.image.src} />
                    )
                }) }
                
            </div>
        )
    }
}

module.exports = LevelProcessor;