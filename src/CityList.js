// import logo from './logo.svg';
import './App.css';
import { useState,useEffect } from 'react';
function CityList({parentState,parentStateSetter}) {
  // const childRef = useRef();
  const [cityNum,setCityNum] = useState(parentState);
  useEffect(() => {
    parentStateSetter(cityNum);
  }, [parentStateSetter, cityNum]);
  return (
    <div width="100%">
      <div className='model_city' onClick={()=>{setCityNum("set 1.16")}}>city_set1.16</div>
      <div className='model_city' onClick={()=>{setCityNum("Set 2.7")}}>city_set2.7</div>
      <div className='model_city' onClick={()=>{setCityNum("Set 3.6")}}>city_set3.6</div>
      <div className='model_city' onClick={()=>{setCityNum("Set 4.7")}}>city_set4.7</div>
      <div className='model_city' onClick={()=>{setCityNum("Set 5.6")}}>city_set5.6</div>
      <div className='model_city' onClick={()=>{setCityNum("Set 6.5")}}>city_set6.5</div>
      <div className='model_city' onClick={()=>{setCityNum("Set 7.7")}}>city_set7.7</div>
      <div className='model_city' onClick={()=>{setCityNum("Set 8.7")}}>city_set8.7</div>
    </div>
  );
}

export default CityList;
