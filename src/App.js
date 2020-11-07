import React, {useReducer, useState, useRef} from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import './App.css';

const stateMachine = {
  initial: 'initial',
  states :{
  initial: { on: { next : 'loadingModel' } },
  loadingModel: { on: { next : 'awaitingUpload' } },
  awaitingUpload: { on: { next : 'ready' }},
  ready: { on: { next : 'classifying' }, showImage:true  },
  classifying: { on: { next : 'complete' } },
  complete: { on: { next : 'awaitingUpload' }, showImage:true, showResults:true }
  }
}

const reducer = (currentState, event) => stateMachine.states[currentState].on[event] || stateMachine.initial

const formatResult = ({ className, probability }) => (
  <li key={className}>
    {`${(className)}: %${(probability * 100).toFixed(2)}`};
  </li>
);

function App() {
  tf.setBackend("cpu");
  const [state, dispatch] = useReducer(reducer, stateMachine.initial)
  const [model, setModel] = useState(null);
  const [imageURL, setImageURL] = useState(null);
  const [results, setResults] = useState([]);
  const inputRef = useRef();
  const imageRef = useRef();

  const next = () => dispatch('next');

  const loadModel = async() => {
    next();
    const mobilenetModel = await mobilenet.load();
    setModel(mobilenetModel);
    next();
  }

  const handleUpload = e => {
    const { files } = e.target;
    if (files.length > 0) {
      const url = URL.createObjectURL(files[0]);
      setImageURL(url);
      next();
    }
  }

  const identify = async () => {
    next();
    const classificationResults = await model.classify(imageRef.current);
    setResults(classificationResults)
    next();
  } 

  const reset = () => {
    setResults([]);
    setImageURL(null);
    next();
  }

  const buttonProps = {
    initial: { text:'Load Model', action: loadModel },
    loadingModel: {text:'Loading Model...', action: ()=> {}},
    awaitingUpload: {text:'Upload Photo', action: ()=> inputRef.current.click()},
    ready: {text:'Identify', action: identify },
    classifying: {text:'Identifying', action: ()=> {}},
    complete: {text:'Reset', action: reset}
  }

  const { showImage = false, showResults = false } = stateMachine.states[state];

  return (
    <div>
      {showImage && <img src={imageURL} alt="upload-preview" ref={imageRef} />}
      {showResults && <ul>
        {results.map(formatResult)}
      </ul>}
      <input accept="image/*" capture="camera" type="file" ref={inputRef} onChange={handleUpload}/>
      <button onClick = {buttonProps[state].action}> {buttonProps[state].text} </button>
    </div>
  );
}

export default App;
