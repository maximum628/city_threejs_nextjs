// ----------------------------------------------------------------------
import {useEffect} from 'react';
// import queryString from 'query-string';
import {Viewer} from './viewer.js';
import * as THREE from 'three';


export default function GLTFViewer({value}) {
  useEffect(() => {
    const hash = {};
    const options = {
      kiosk: true,
      model: hash.model || '',
      preset: hash.preset || 'assetgenerator',
      background : new THREE.Color( 0x302f2e ), //,
      cameraPosition: null
    };
    const init = () =>{
      document.getElementById( 'city_1' ).innerHTML = "";
      const container = document.getElementById( 'city_1' );
      
      // const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 );
      // camera.position.y = 200;

      // const scene = new THREE.Scene();
      // scene.background = new THREE.Color( 0xaaccff );
      // scene.fog = new THREE.FogExp2( 0xaaccff, 0.0007 );

      // const geometry = new THREE.PlaneGeometry( 20000, 20000, worldWidth - 1, worldDepth - 1 );
      // geometry.rotateX( - Math.PI / 2 );

      // const position = geometry.attributes.position;

      const viewer = new Viewer(container, options);
      if (viewer) viewer.clear();
      const fileURL = 'models/glb/'+value+'.glb';
      const rootPath = 'models/glb/';
      const fileMap = new Map();
      viewer
        .load(fileURL, rootPath, fileMap)
        .catch((e) => this.onError(e))
        .then((gltf) => {
          return;
          // console.log(gltf);
          // document.getElementById( 'city_1' ).innerHTML = "";
          // cleanup();
        });
  
        // const loader = new GLTFLoader().setPath( 'models/glb/' );
        // loader.load( value+'.glb', function ( gltf ) {
    }
    init();
  }, [value]);
  return (
    <div id="city_1" width={window.innerWidth*0.93} height={window.innerHeight} style={{height:"100%"}}>
    </div>
  );
}
