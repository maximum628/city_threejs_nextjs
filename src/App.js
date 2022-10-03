// import logo from './logo.svg';
import './App.css';
// import GLTFViewer from './GLTFViewer';
import CityModel from './CityModel';
import CityList from './CityList';
import React, { useState,useCallback } from 'react';
function App() {
  const [cityNum,setCityNum] = useState('set 1.16');
  // make wrapper function to give child
  const wrapperSetParentState = useCallback(val => {
    setCityNum(val);
  }, [setCityNum]);
  const viewer_width = window.innerWidth;
  const viewer_height = window.innerHeight;
  return (
    <div style={{display:'flex'}}>
      <div width={viewer_width} height={viewer_height}>
        <CityModel value={cityNum}/>
        {/* <GLTFViewer value={cityNum} /> */}
      </div>
    </div>
  );
}

export default App;
