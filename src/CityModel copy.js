// ----------------------------------------------------------------------
import {useEffect} from 'react';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import CameraControls from './camera-controls/dist/camera-controls.module.js';

import Stats from 'three/examples/jsm/libs/stats.module';

// import {Viewer} from './viewer.js';


export default function CityModel({value}) {
  let loader;
  let camera, scene,controls, renderer,stats,bloomComposer,finalComposer,bloomLayer;
  let model, clock;
  let mixer = [];
  let materials = [];
  const ENTIRE_SCENE = 0, BLOOM_SCENE = 1;
  CameraControls.install( { THREE: THREE } );
  useEffect(() => {
      init();
  }, [value]);
  const init = () =>{
    document.getElementById( 'city_1' ).innerHTML = "";
    const container = document.getElementById( 'city_1' );

    scene = new THREE.Scene();
    // scene.background = new THREE.Color( 0x4e4e4e );
    scene.add( new THREE.AmbientLight( 0x404040 ) );
    

    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 2, 10000 );
    camera.position.set( 30, 300, 130 );
    camera.lookAt( 0, 1, 0 );
    // camera.far = 100000;
    camera.updateProjectionMatrix();
    camera.layers.set( 0 );
    
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth*0.93, window.innerHeight );
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 0.5;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild( renderer.domElement );
    
    const pmremGenerator = new THREE.PMREMGenerator( renderer );
    let texture = pmremGenerator.fromScene( new RoomEnvironment(), 0.5 ).texture;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    stats = new Stats();
    // stats
		// container.appendChild( stats.dom );
    
    // let texture = new RGBELoader().load( 'models/gltf/set7.7/set7.7.hdr' );
    // texture.mapping = THREE.EquirectangularReflectionMapping;
    // scene.environment = texture;
    // scene.fog = new THREE.Fog( 0xa0a0a0, 10, 50 );
    
    // const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
    // hemiLight.position.set( 0, 20, 0 );
    // scene.add( hemiLight );

    // const dirLight = new THREE.DirectionalLight( 0xffffff );
    // dirLight.position.set( - 3, 10, - 10 );
    // dirLight.castShadow = true;
    // dirLight.shadow.camera.top = 2;
    // dirLight.shadow.camera.bottom = - 2;
    // dirLight.shadow.camera.left = - 2;
    // dirLight.shadow.camera.right = 2;
    // dirLight.shadow.camera.near = 0.1;
    // dirLight.shadow.camera.far = 40;
    // scene.add( dirLight );
    
    // ground

    const geometry = new THREE.PlaneGeometry( 900, 900 );
    const material = new THREE.MeshPhongMaterial( { color: 0x4e4e4e, depthWrite: false,side: THREE.DoubleSide } );
    const mesh = new THREE.Mesh( geometry, material );//0x999999
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    mesh.material.color.set(1,1,1);
    scene.add( mesh );

    clock = new THREE.Clock();
    
    bloomLayer = new THREE.Layers();
    bloomLayer.set( BLOOM_SCENE );
    const renderScene = new RenderPass( scene, camera );

    const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
    bloomPass.threshold = 0.2;
    bloomPass.strength = 5;
    bloomPass.radius = 1;

    bloomComposer = new EffectComposer( renderer );
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass( renderScene );
    bloomComposer.addPass( bloomPass );

    const finalPass = new ShaderPass(
      new THREE.ShaderMaterial( {
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture }
        },
        vertexShader: document.getElementById( 'vertexshader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
        defines: {}
      } ), 'baseTexture'
    );
    finalPass.needsSwap = true;

    finalComposer = new EffectComposer( renderer );
    finalComposer.addPass( renderScene );
    finalComposer.addPass( finalPass );
    // model
    // const loader = new GLTFLoader().setPath( 'models/gltf/'+value+'/' );
    loader = new GLTFLoader().setPath( 'models/glb/' );
    Promise.all([
      load_city('set 1.16.glb'),
      load_city('Set 2.7.glb'),
      load_city('Set 3.6.glb'),
    ]).then((results) => {
      // here the models are returned in deterministic order
      // alert();
      const [modelA, modelB] = results;
      console.log(modelA);
    }).catch((err) => {
      console.log(err);
    });
    
    // loader.load( 'Set 2.7.glb', load_city2, undefined, function ( e ) {console.error( e );} );
    // loader.load( 'Set 3.6.glb', load_city3, undefined, function ( e ) {console.error( e );} );
    // loader.load( 'Set 4.7.glb', load_city4, undefined, function ( e ) {console.error( e );} );
    // loader.load( 'Set 5.6.glb', load_city5, undefined, function ( e ) {console.error( e );} );
    // loader.load( 'Set 6.5.glb', load_city6, undefined, function ( e ) {console.error( e );} );
    // loader.load( 'Set 7.7.glb', load_city7, undefined, function ( e ) {console.error( e );} );
    // loader.load( 'Set 8.7.glb', load_city8, undefined, function ( e ) {console.error( e );} );
    // controls = new FirstPersonControls( camera, renderer.domElement );

    // controls.movementSpeed = 500;
    // controls.lookSpeed = 0.1;

    controls = new OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', render ); // use if there is no animation loop
    controls.enablePan = false;
    controls.minDistance = 10;
    controls.maxDistance = 5000;
    controls.target.set( 0, 0.5, 0 );
    controls.update();
    controls.enableDamping = true;
    
    window.addEventListener( 'resize', onWindowResize );
  }
  const load_city = (filename)=> {
    loader.load( filename, function(gltf){
      model = gltf.scene || gltf.scenes[0];
      const clips = gltf.animations || [];
      if (!scene) {
        // Valid, but not supported by this viewer.
        throw new Error(
          'This model contains no scene, and cannot be viewed here. However,'
          + ' it may contain individual 3D resources.'
        );
      }
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3()).length();
      const center = box.getCenter(new THREE.Vector3());
      // model.position.x += (model.position.x - center.x);
      // model.position.y += (model.position.y - center.y);
      // model.position.z += (model.position.z - center.z);
      if(filename === 'set 1.16.glb'){
        model.position.set(-160, 0, -160);
      }
      else if(filename === 'Set 2.7.glb'){
        model.position.set(0, 0, -140);
      }
      else if(filename === 'Set 3.6.glb'){
        model.position.set(200, 0, -160);
      }
      // model.position.set( 1, 1, 0 );
      // model.scale.set( 0.01, 0.01, 0.01 );
      // let gltf_mat = [];
      model.scale.set(1,1,1);
      scene.add( model );
      // model.traverse( function ( child ) {
      //   // child.layers.set( 10 )
      //   child.layers.enable( BLOOM_SCENE );
      //   if (child.isLight) {
      //     console.log(child);
      //     const sphereSize = 1;
      //     const pointLightHelper = new THREE.PointLightHelper( child, sphereSize );
      //     scene.add( pointLightHelper );
      //   }
      //   else if ( child.isMesh === true ){
  
      //     // child.material.transparent = true           
      //     // child.material.envMapIntensity = 1
      //     // if(child.name.indexOf('Plane') > -1){
      //     //   child.material.emissiveIntensity = 1
      //     //   // child.material.emissive = new THREE.Color( 0x0044ff );
      //     //   child.layers.toggle( BLOOM_SCENE );
      //     //   console.log(1,child);
      //     // }
      //     // else{
      //     //   // child.layers.toggle( BLOOM_SCENE );
      //     //   console.log(2,child);
      //     // }
      //   }
        
      //   // if ( child instanceof THREE.Mesh ) {
      //   //   child.castShadow = true;
      //   //   child.receiveShadow = true
      //   // }
      // });
      // scene.add( model );
      // finalComposer.render();
      for(let i in gltf.animations){
        mixer[i] = new THREE.AnimationMixer( model );
        mixer[i].clipAction( gltf.animations[ i ] ).play();
      }
      animate();

    }, undefined, function ( e ) {console.error( e );} )
  }
  const onWindowResize = () => {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    finalComposer.setSize( window.innerWidth, window.innerHeight );
    animate();

  }
  const render = () =>{
    // renderer.render( scene, camera );
    scene.traverse( function ( obj ) {
      if ( obj.isMesh && bloomLayer.test( obj.layers ) === false ) {

        materials[ obj.uuid ] = obj.material;
        // obj.material = darkMaterial;

      }

    } );
    bloomComposer.render();
    scene.traverse( function( obj ) {

      if ( materials[ obj.uuid ] ) {

        obj.material = materials[ obj.uuid ];
        delete materials[ obj.uuid ];

      }

    } );
  }
  
  const animate = () => {

    requestAnimationFrame( animate );

    const delta = clock.getDelta();

    for(let i in mixer){
      mixer[i].update( delta );
    }

    controls.update(delta);

    stats.update();

    // renderer.render( scene, camera );
    render();
    finalComposer.render();

  }
  return (
    <div id="city_1" style={{width:'100%',height:"100%"}}>
    </div>
  );
}
