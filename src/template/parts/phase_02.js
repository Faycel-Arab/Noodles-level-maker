import React from 'react';

// components
import NumberInput from '../components/number-input';

class LevelsParameters extends React.Component{

    constructor(props){
        super(props);

        // for UI
        this.state = {
            selectedCard: undefined || this.props.selectedTypeIndex,
        }
    }

    setCols(n){
        this.props.setCols(n);
    }

    setRows(n){
        this.props.setRows(n);
    }

    setType( type, i ){
        // edit state
        let clone = this.state;
        clone.selectedCard = i;
        this.setState(clone);

        // handle change
        this.props.setType(type);
    }

    render(){

        // get selected card index
        let index = this.state.selectedCard;
        return(
            <div className="phase-element">

                <div className="cards">
                {this.props.tilesTypes.map( ( item, i ) => {
                    let selected = index === i ? "selected" : "";
                    return (
                    <div 
                        key={i}
                        className={"card "+item.className+" "+selected}
                        onClick={ () => this.setType(item.val, i)}>
                        <div className="card-name">
                            {item.name}
                        </div>
                    </div>
                    )
                })}
                </div>

                <div className="input-group">
                    <div>
                        <label>Set columns:</label>
                        <NumberInput 
                            val={this.props.colsVal} 
                            maxVal={10} 
                            minVal={2} 
                            handleChange={(val) => this.setCols(val)}
                        />
                    </div>

                    <div>
                    <label>Set rows:</label>
                        <NumberInput 
                            val={this.props.rowsVal} 
                            maxVal={10} 
                            minVal={2} 
                            handleChange={(val) => this.setRows(val)}
                        />
                    </div>
                </div>
                


            </div>
        )
    }
}
module.exports = LevelsParameters;