import React from 'react';

class NumberInput extends React.Component{
    constructor(props){
      super(props);
      
      this.state = { 
        val: this.props.val,
        maxVal: this.props.maxVal || 15, 
        minVal: this.props.minVal || 1,
      }
    }
    
    tick( val ){
        if( isNaN( val ) ){
        console.err("Invalid argument passed to tick function.");
        return;
        }
        
        if( this.state.val + val < this.state.minVal || this.state.val + val > this.state.maxVal )
            return;

        let clone = this.state;
        clone.val+=val;
        this.setState(clone);

        // respond to handleChange
        this.props.handleChange(this.state.val);
    }
    
    render(){
      return(
        <div className="number-input">
          <div>
            <button onClick={() => this.tick(-1)}></button>
          </div>
          <div>
            <input 
                className="input"  
                type="number" 
                min={this.state.minVal} max={this.state.maxVal}
                value={this.state.val} 
                readOnly
            />
          </div>
          <div>
            <button onClick={() => this.tick(1)}></button>
          </div>      
        </div>
      )
    }
}

module.exports = NumberInput;