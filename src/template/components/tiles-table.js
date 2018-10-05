import React from 'react';

class TilesTable extends React.Component{

  constructor(props){
    super(props)
    
    this.state = {
      selectedTileIndex: undefined,
    }
  }

  back(){
    this.setState({
      selectedTileIndex: undefined
    })
  }

  selectTileIndex( index ){
    this.setState({
      selectedTileIndex: index
    })
  }

  tilesTable(){
    
    const selectedTileIndex = this.state.selectedTileIndex
    const tiles             = this.props.tiles

    // elements to return 
    let elmnts = [];
    
    if( typeof selectedTileIndex !== "number"){
      let c = tiles[0].folder_index;
      tiles.map( ( tile, index ) => {
        
        if( tile.tile_index === 0 ){
          elmnts.push( <span key={index} onClick={this.selectTileIndex.bind(this, c)}>
              <img src={tile.image.src} />
            </span>)
            c = c+1;
        }
            
      })
    }
     

    else{

      tiles.map( ( tile, index ) => {
        
        if( tile.folder_index === selectedTileIndex )
          elmnts.push(<span key={index} onClick={ () => this.props.selectHandler(index)}>
            <img src={tile.image.src} />
          </span>)
          
      })

      elmnts.push(
        <span key="return" className="back" onClick={this.back.bind(this)}>
          <a href="#">
            Back
          </a>
        </span>
      )
    }
      

  
    return(
      <div>{elmnts}</div>
    )
    
  }

  render(){

    
    return(
      
      <div className="tiles-table">
          {this.tilesTable()}
      </div>
    )
  }
} 
module.exports = TilesTable