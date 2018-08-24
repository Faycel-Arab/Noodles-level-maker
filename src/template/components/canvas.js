import React from 'react';

class Canvas extends React.Component{

    constructor(props){
        super(props);
    }

    render(){
        return(
            <canvas 
                className={this.props.classes}
                id={this.props.identifier}
            ></canvas>
        )
    }
}
module.exports = Canvas;
