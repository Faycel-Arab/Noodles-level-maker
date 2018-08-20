// entry point
// bootstrap app 

// react dependencies
import React from "react";
import ReactDOM from "react-dom";

// STYLES
import css from './App.css';

// components
import Menu from "./template/parts/menu";
import AssetsSelector from './template/parts/phase_01';
import LevelsParameters from './template/parts/phase_02';
import Setup from './template/parts/phase_03';


/**
 * Main class (entry point)
 */
class Main extends React.Component{

  constructor(props){

    super(props);

    this.state = {
      
      // describe level generating phases
      phases: [
        "Assets selection", // prompt user to select and upload the level image or compressed file 
        "Parameters and configuration", // prompt user to set and configure parameters for levels generation
        "Setup", // load respective tiles images
        "Process images", // process images and generate levels files
        "Download files", // download files for user ( single file for single image or a compressed file) 
      ],

      // set and watch phases state 
      // set phase index to true when it's done
      phasesState: [ false, false, false, false, false ],

      // flag the current phase
      currentPhase: 0,

      // selected assets
      Assets: undefined,

      // selected tiles type
      selectedType: undefined,

      // tiles per X axis
      cols: 3,

      // tiles per Y axis
      rows: 3,

      // required assets for comparison
      // array of objects {folder_index, tile_index, image}
      comparisonImages: [],

      // level params
      TilesTypes: [ 
        { 
          name: "Hexagonal Dark",
          className: "hex-dark-bg",
          val: "hex-dark"
        },
        { 
          name: "Hexagonal Yellow",
          className: "hex-yellow-bg",
          val: "hex-orange"
        },
        { 
          name: "Orthogonal blue",
          className: "orth-blue-bg",
          val: "ortho-grey"
        },
        { 
          name: "Orthogonal Orange",
          className: "orth-orange-bg",
          val: "ortho-orange"
        },
      ],

      // notifications controller
      Notifications: {
        display: false,
        content: ""
      },

    }
  }

  /**
   * Shortcut to edit state
   * creates and modify a copy of state then affecting it to state
   * @param {string} key : prop name to edit
   * @param {string} val : prop value to set
   * @return {void} 
   */
  editState( key, val ){

    // make state copy
    let clone = this.state;

    // edit props
    clone[key] = val;

    // edit state using the built-in setState
    this.setState( clone );
  }

  /**
   * render phases
   * @param {integer} phase
   * @return {DOM} 
   */
  renderPhase( phase ){

    switch( this.state.phases[ phase ] ){

      case "Assets selection": 
        return(
          <AssetsSelector 
          selectedFiles={this.state.Assets}
          onFileSelect={ ( files ) => this.setAssets(files)}/>
        );
        break;
      
      case "Parameters and configuration": 
        
        // get selected type index
        const selectedTypeIndex = this.state.TilesTypes.findIndex( type => type.val === this.state.selectedType );
        return(
          <LevelsParameters 
            tilesTypes={this.state.TilesTypes}
            selectedTypeIndex={selectedTypeIndex}
            colsVal={this.state.cols}
            rowsVal={this.state.rows}
            setType={(val) => this.setParams( 'type', val)}
            setCols={(n) => this.setParams( 'cols', n)}
            setRows={(n) => this.setParams( 'rows', n)}
          />
        );
        break;
      
      case "Setup": 
        return(
          <Setup 
            atlas={this.state.selectedType}
            errorHandler={(msg) => this.displayErrorBox(msg)}
          />
          );
        break;
  
      case "Process images": 
        return(<h2>Process images</h2>);
        break;
      
      case "Download files": 
        return(<h2>Download files</h2>);
        break;

      default: 
        return(<h2>End!</h2>);
        break;
    }
  }

  /**
   * Increment currentPhase state 
   */
  goToNextPhase(){

    let phase = this.state.currentPhase;

    if( this.state.phasesState[phase]  )
      this.editState( "currentPhase", phase+1 );
  }

  /**
   * Decrement currentPhase state 
   */
  goToPrevPhase(){

    let phase = this.state.currentPhase;

    this.editState( "currentPhase", phase-1 );
  }

  /**
   * set Notifications state content and display
   * @param {string} content: error message
   * @return {function} : component
   */
  displayErrorBox( content ){
    // we do a manual edit to state since Notifications
    // state is a nested element
    let clone = this.state;

    // edit
    clone.Notifications.display = true;
    clone.Notifications.content = content;

    this.setState(clone);
  }

  /**
   * return an ErrorBox component
   */
  showErrorComponent(){
    return(
      <ErrorBox content={this.state.Notifications.content} 
        closeEvent={this.closeErrorBox.bind(this) }/>
    )
  }

  /**
   * edit Notifications state Display to false
   */
  closeErrorBox(){
    // we do a manual edit to state since Notifications
    /// state is a nested element
    let clone = this.state;

    // edit
    clone.Notifications.display = false;

    this.setState(clone);
  }
  /**
   * check and set state Assets
   * @param {Filelist} files 
   * @return {void}
   */
  setAssets( files ){

    // check files 
    if( window.FileReader && window.Blob ){

      // flag for files validation
      // set to false when an error occurs
      let flag = true;

      // non valid files ( names )
      let notValidFiles = [];

      // a regexp for accepted formats
      let acceptedFormats = /\b(jpeg|png)\b/;

      for( let i = 0; i < files.length; i++ ){

        let item = files[i];

        // get file type
        let type = item.type.split("/")[1];
        
        if( !acceptedFormats.test( type ) ){
          
          // switch flag
          flag = false;

          // save wrong file name to tell user
          notValidFiles.push( item.name );
        }

      }

      // edit state if all files are ok
      // set Assets state
      // set current phase state to true
      if( flag ){
        this.editState( "Assets", files );

        // get and edit phases state
        let phasesState = this.state.phasesState;
            phasesState[ this.state.currentPhase ] = true;
        this.editState( "phasesState", phasesState );

        // hide ErrorBox in case it's visible
        this.closeErrorBox();
      }

      else{

        // display error msg
        this.displayErrorBox( "one or more files are not valid, please check console for more info" );

        console.error( "one or more files are not valid.");
        console.error( "non-valid files : \n", notValidFiles);
      }
    }
    else
      console.error("Sorry your browser version is too old to support file reading");
  }

  /**
   * Set tile type, tiles per column and tiles per row
   * @param {String} param 
   * @param {mixed} val 
   */
  setParams( param, val ){

    // handle type edit
    if( param === "type" ){
      
      // check if val is valid
      let val_exist = this.state.TilesTypes.find(el => el=="val");
      if( typeof val === "string"  )
        this.editState( "selectedType", val );
    }

    // handle cols edit
    if( param === "cols" ){

      // check if val is valid
      if( typeof val === "number" && val > 0 )
        this.editState( "cols", val );
    }

    // handle rows edit
    if( param === "rows" ){

      // check if val is valid
      if( typeof val === "number" && val > 0 )
        this.editState( "rows", val );
    }

    // set current phase to true 
    // if 'type', 'cols' and 'rows' are set 
    const selectedType = this.state.selectedType; 
    const cols = this.state.cols;
    const rows = this.state.rows; 
    if( selectedType && cols && rows ){
      let clone = this.state;
      clone.phasesState[this.state.currentPhase] = true;
      this.setState(clone);
    }
    
    // otherwise set to false
    else{
      let clone = this.state;
      clone.phasesState[this.state.currentPhase] = false;
      this.setState(clone);
    } 

  }

  /**
   * set state.comparisonImages
   * @param {object} files : array to store comparison images
   * must conform to this.state.comparisonImages hierarchy 
   * array of objects {folder_index, tile_index, image}
   */
  setComparisonImages( files ){
    this.setState({
      comparisonImages: files
    });
  }

  render(){

    let phase = this.state.currentPhase;
    
    return(
      <div id="content">
        { this.renderPhase(phase) }

        <div className="footer">

          { phase !== 0 ?
              <PhaseButton 
                text="Previous"
                enabled={true} 
                position="left"
                clickEvent={this.goToPrevPhase.bind(this)}
              />
            :
              ""
          }

          { phase !== this.state.phases.length -1 ?
              <PhaseButton 
                text="Next"
                position="right"
                enabled={this.state.phasesState[phase]} 
                clickEvent={this.goToNextPhase.bind(this)}
              />
            :
              ""
          }
        </div>
        
        {this.state.Notifications.display 
          ? this.showErrorComponent()
          : ""
        }
        
      </div>
    ) 
  }
}

const PhaseButton = ( props ) => ( 
    <div 
      onClick={props.clickEvent} 
      className={"btn btn-green " + (props.position) + (props.enabled ? " " : " btn-disabled")}>
      {props.text}
    </div>
)

const ErrorBox = ( props ) => (
  <div className="error-box">
    <div className="box-header">
      <a href="#" 
        onClick={props.closeEvent} 
        className="close-button"></a> 
    </div>

    <div className="box-content">
      {props.content}
    </div>
  </div>
)


/** ENTIRE APP HAHA **/
const App = () => (
  <div className="app-container">
    <Menu />
    <Main />
  </div>
)

// This demo uses a HashRouter instead of BrowserRouter
// because there is no server to match URLs
ReactDOM.render((
  <App />
), document.getElementById('root'))
