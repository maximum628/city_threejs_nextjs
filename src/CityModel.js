// ----------------------------------------------------------------------
import {useEffect} from 'react';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import CameraControls from 'camera-controls';

import Stats from 'three/examples/jsm/libs/stats.module';

// import {Viewer} from './viewer.js';


export default function CityModel({value}) {
  CameraControls.install( { THREE: THREE } );

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath( 'js/draco/gltf/' );
  // dracoLoader.setDecoderConfig({ type: 'js' });
  const loader = new GLTFLoader().setPath( 'models/glb/');
  loader.setDRACOLoader( dracoLoader );

  let model,mixer = [],INTERSECTED;
  const clock = new THREE.Clock();
  const stats = new Stats();
  const bloomLayer = new THREE.Layers();
  const scene = new THREE.Scene();
  const raycaster = new THREE.Raycaster();
  
  const pointer = new THREE.Vector2();

  const findobj_str = [
    /B[1-9]/g
    ,"building"
  ];
  const findcup_names = [
    "t6"
  ];
  const ENTIRE_SCENE = 0, BLOOM_SCENE = 1;
  /**
			 * Sizes
			 */
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
  }
  let clickable_obj = [];
  const params = {
    exposure: 1,
    bloomStrength: 5,
    bloomThreshold: 0.2,
    bloomRadius: 1
  };
  const materials = {};
  bloomLayer.set( BLOOM_SCENE );
  // Lights

  scene.add( new THREE.AmbientLight( 0xffffff, 5 ) );
  const dirLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  dirLight.position.set( 240, 100, 240 );
  dirLight.castShadow = true;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 10;

  dirLight.shadow.camera.right = 1;
  dirLight.shadow.camera.left = - 1;
  dirLight.shadow.camera.top	= 1;
  dirLight.shadow.camera.bottom = - 1;

  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  scene.add( dirLight );
  /**
   * Renderer
   */

  const renderer = new THREE.WebGLRenderer( {
    antialias: true,
      alpha: true
  } );
  renderer.setSize(sizes.width, sizes.height)
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 0.5;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  const pmremGenerator = new THREE.PMREMGenerator( renderer );
  let texture = pmremGenerator.fromScene( new RoomEnvironment(), 0.5 ).texture;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  // scene.background = new THREE.Color(0x007ca9);
  scene.environment = texture;
  /**
   * ground
   */
  const groundtexture = new THREE.TextureLoader().load( 'textures/minecraft/grass.png' );
  groundtexture.magFilter = THREE.NearestFilter;
  const planeGeometry = new THREE.PlaneGeometry( 350, 350, 1, 1 );
  const ground = new THREE.Mesh( planeGeometry,
      new THREE.MeshBasicMaterial( {
        map: groundtexture } ) );//color: 0x115a2d
  ground.rotation.x = - Math.PI / 2;
  ground.position.y = -0.1
  ground.scale.multiplyScalar( 2 );
  ground.receiveShadow = false;
  scene.add(ground);
  /**
   * Camera
   */
  // Base camera
  const cameraState = {
    mousePos: new THREE.Vector2(0, 0),
    virtualMousePos: new THREE.Vector2(0, 0),
    cameraAngle: [
        new THREE.Vector3(50, 600, 0),
        new THREE.Vector3(150, 500, 0),
        new THREE.Vector3(250, 400, 0),
        new THREE.Vector3(300, 350, 0),
        new THREE.Vector3(300, 300, 0),
        new THREE.Vector3(300, 200, 0),
        new THREE.Vector3(200, 100, 0),
        new THREE.Vector3(130, 50, 0),
        new THREE.Vector3(100, 40, 0),
        new THREE.Vector3(60, 30, 0),
    ],
    cameraMethod: 5,
    isClicked: false,
    targetPos: new THREE.Vector3(0, 0, 0),
    isTargetMoving: false,
  };
  const yAxis = new THREE.Vector3(0, 1, 0);
  const xAxis = new THREE.Vector3(1, 0, 0);
  const basePlane = new THREE.Plane(yAxis, 0);
  const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 2, 10000 );
  camera.position.set( 200, 200, 200 );
  scene.add(camera);
  // Controls
  const cameraControls = new CameraControls( camera, renderer.domElement );
  cameraControls.dampingFactor = 0.05;
  cameraControls.draggingDampingFactor = 0.25;
  cameraControls.verticalDragToForward = true;
  cameraControls.dollyToCursor = true;
  // cameraControls.maxPolarAngle = (Math.PI * 0.5) - 0.25;
  // cameraControls.minPolarAngle = (Math.PI * 0.5) - 0.3;
  cameraControls.zoomSpeed = 1.5;
  cameraControls.minDistance = 20;
  cameraControls.maxDistance = 1000;
  cameraControls.maxZoom = 1000;
  cameraControls.minZoom = 20;
  cameraControls.mouseButtons.left = CameraControls.ACTION.NONE
  cameraControls.mouseButtons.right = CameraControls.ACTION.NONE
  cameraControls.mouseButtons.middle = CameraControls.ACTION.NONE
  cameraControls.mouseButtons.wheel = CameraControls.ACTION.NONE
  document.addEventListener('wheel', e => {
    if (e.deltaY < 0) {
      cameraState.cameraMethod = Math.min(cameraState.cameraMethod + 1, cameraState.cameraAngle.length - 1);
    } else {
      cameraState.cameraMethod = Math.max(cameraState.cameraMethod - 1, 0);
    }
  })
  document.addEventListener('mousedown', e => {
    cameraState.isClicked = true;
    cameraState.mousePos.setX(e.pageX);   cameraState.mousePos.setY(e.pageY);
    cameraState.targetPos = cameraControls.getTarget();
    cameraState.virtualMousePos.setX(e.pageX);   cameraState.virtualMousePos.setY(e.pageY);

    console.log(cameraState.cameraMethod);
    // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects( scene.children );
    if(cameraState.cameraMethod > 5){
      for ( let i = 0; i < intersects.length; i ++ ) {
        
        if(intersects[i].object.name === 't6' || intersects[i].object.name === 's3' || intersects[i].object.name === 't9' || intersects[i].object.name === 'trophy' || intersects[i].object.name === 's1003' || intersects[i].object.name === 's1' || intersects[i].object.name === 'tt1' || intersects[i].object.name === 't9' || intersects[i].object.name === 't8' || (intersects[i].object.name.indexOf('Baked') >= 0)){
          // intersects[i].object.material.color.set(0xff0000);

          cameraState.cameraMethod = 9;
          cameraState.isTargetMoving = true;
          cameraState.targetPos = intersects[i].point.clone().setY(0);
          console.log(intersects[i].point)
        }   
      }

    }
  })
  cameraControls.addEventListener( 'controlstart', function() {
    switch ( cameraControls.currentAction ) {
        case CameraControls.ACTION.ROTATE:
        case CameraControls.ACTION.TOUCH_ROTATE: {

          renderer.domElement.classList.add( '-dragging' );
          break;

        }

        case CameraControls.ACTION.TRUCK:
        case CameraControls.ACTION.TOUCH_TRUCK: {

          renderer.domElement.classList.add( '-moving' );
          break;

        }

        case CameraControls.ACTION.DOLLY:
        case CameraControls.ACTION.ZOOM: {

          renderer.domElement.classList.add( '-zoomIn' );
          break;

        }

        case CameraControls.ACTION.TOUCH_DOLLY_TRUCK:
        case CameraControls.ACTION.TOUCH_ZOOM_TRUCK: {

          renderer.domElement.classList.add( '-moving' );
          break;

        }

        default: {
          break;
        }
      }
  } );
  cameraControls.addEventListener( 'controlend', function() {

    renderer.domElement.classList.remove(
      '-dragging',
      '-moving',
      '-zoomIn'
    );

  } );
  
  const renderScene = new RenderPass( scene, camera );

  const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
  bloomPass.threshold = params.bloomThreshold;
  bloomPass.strength = params.bloomStrength;
  bloomPass.radius = params.bloomRadius;

  const bloomComposer = new EffectComposer( renderer );
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
  
  const uniforms = {

    pointTexture: { value: new THREE.TextureLoader().load( 'textures/sprites/ball.png' ) }

  };
  const finalComposer = new EffectComposer( renderer );
  finalComposer.addPass( renderScene );
  finalComposer.addPass( finalPass );

  const mouseMoveHandler = e => {
    if (!cameraState.isClicked) {
      e.preventDefault();
      return;
    }
    cameraState.mousePos.setX(e.pageX);   cameraState.mousePos.setY(e.pageY);
  }
  document.addEventListener('mousemove', mouseMoveHandler);
  const cameraMover = (delta) => {
    let camPos, targetPos;
    let arm;
    camPos = cameraControls.getPosition();
    targetPos = cameraControls.getTarget();
    arm = targetPos.clone().sub(camPos);
    const norm = arm.clone().setY(0).normalize().multiplyScalar(delta.y * Math.log(camPos.y) / 10);
    arm.applyAxisAngle(yAxis, delta.x / 1000);
    targetPos = camPos.clone().add(arm);
    camPos.add(norm);
    targetPos.add(norm);
    targetPos.setY(0);
    
    // camPos.x -= deltaX;
    // targetPos.x -= deltaX;
    // camPos.z -= deltaY;
    // targetPos.z -= deltaY;
    cameraControls.setPosition(...camPos);
    cameraControls.setTarget(...targetPos);
    cameraState.virtualMousePos.add(delta);
  };
  const updateCamera = () => {
    const delta = cameraState.mousePos.clone().sub(cameraState.virtualMousePos).multiplyScalar(0.05);
    cameraMover(delta);

    const cameraPos = cameraControls.getPosition();
    const targetPos = cameraControls.getTarget();
    const cameraAngle = cameraPos.clone().sub(targetPos);
    const projectedAngle = new THREE.Vector3();
    basePlane.projectPoint(cameraAngle, projectedAngle);
    const direction = xAxis.clone().cross(projectedAngle).normalize().y;
    const angle = (Math.PI * 2 + xAxis.angleTo(projectedAngle) * direction) % (Math.PI * 2);
    const normalizedAngle = cameraAngle.clone().applyAxisAngle(yAxis, -angle);
    const newNormalizedAngle = normalizedAngle.add(cameraState.cameraAngle[cameraState.cameraMethod].clone().sub(normalizedAngle).multiplyScalar(0.05));
    const newCameraAngle = newNormalizedAngle.applyAxisAngle(yAxis, angle);
    const newCameraPos = targetPos.clone().add(newCameraAngle);

    if (cameraState.isTargetMoving) {
      const delta = cameraState.targetPos.clone().sub(targetPos);
      const newTargetPos = delta.clone().multiplyScalar(0.02).add(targetPos);
      cameraControls.setTarget(...newTargetPos);
      if (delta.length() < 1e-3) {
        cameraState.isTargetMoving = false;
      }
    }
    cameraControls.setPosition(...newCameraPos);
  }
  document.addEventListener('mouseup', () => {
    cameraState.isClicked = false;
  })
  
  function onPointerMove( event ) {
  
    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components

    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  }
  window.addEventListener( 'pointermove', onPointerMove );
  const animate =  ()=>{
    const delta = clock.getDelta();

    for(let i in mixer){
      mixer[i].update( delta );
    }

    cameraControls.update(0.01);
      updateCamera();
    // cameraControls.update(delta);
    mouseupdate()
    stats.update();

    // renderer.render( scene, camera );
    render();
    // finalComposer.render();

    requestAnimationFrame( animate );
  }

  const darkenNonBloomed = ( obj ) => {
    if ( obj.isMesh && bloomLayer.test( obj.layers ) === false ) {

      materials[ obj.uuid ] = obj.material;
      // obj.material = darkMaterial;

    }
  }
  const restoreMaterial = ( obj ) => {
    if ( materials[ obj.uuid ] ) {

      obj.material = materials[ obj.uuid ];
      delete materials[ obj.uuid ];

    }
  }
  const load_city = (filename) =>{
    // return;
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
    if(filename === 'model1.glb'){
      model.position.set(-160, 0, -160);
    }
    else if(filename === 'model2.glb'){
      model.position.set(0, 0, -140);
    }
    else if(filename === 'model3.glb'){
      model.position.set(180, 0, -160);
    }
    else if(filename === 'model4.glb'){
      model.position.set(-160, 0, 160);
    }
    else if(filename === 'model5.glb'){
      model.position.set(0, 0, 160);
    }
    else if(filename === 'model6.glb'){
      model.position.set(160, 0, 160);
    }
    else if(filename === 'model7.glb'){
      model.position.set(-160, 0, 0);
    }
    else if(filename === 'model8.glb'){
      model.position.set(160, 0, 0);
    }
    model.scale.set(1,1,1);
    scene.add( model );
    model.traverse( function ( child ) {
      if (child.isLight) {
        const sphereSize = 1;
        const pointLightHelper = new THREE.PointLightHelper( child, sphereSize );
        scene.add( pointLightHelper );
      }
      else if ( child.isMesh === true ){
      let obj_name = child.name;
      console.log(child);
      if(obj_name.search(findobj_str[0]) > -1 || obj_name.indexOf(findobj_str[1]) > -1){
        clickable_obj.push(child);
        console.log(obj_name);
      }
      }
    });
    for(let i in gltf.animations){
      // mixer[i] = new THREE.AnimationMixer( model );
      // mixer[i].clipAction( gltf.animations[ i ] ).play();
      
      mixer.push(new THREE.AnimationMixer( model ));
      mixer[mixer.length-1].clipAction( gltf.animations[ i ] ).play();
    }

    }, undefined, function ( e ) {console.error( e );} )
  }
  const loadCityModels = () => {
    
    scene.traverse( disposeMaterial );
    Promise.all([
      load_city('model1.glb'),
      // load_city('model2.glb'),
      load_city('model3.glb'),
      // load_city('model4.glb'),
      load_city('model5.glb'),
      load_city('model6.glb'),
      // load_city('model7.glb'),
      load_city('model8.glb'),
    ]).then((results) => {
      // here the models are returned in deterministic order
      // alert();
      // const [modelA, modelB] = results;
    }).catch((err) => {
      console.log(err);
    });
				
    animate();
  }

  const disposeMaterial = ( obj ) => {

    if ( obj.material ) {

      obj.material.dispose();

    }

  }
  
  const mouseupdate = () => {

    raycaster.setFromCamera( pointer, camera );
    const intersects = raycaster.intersectObjects( clickable_obj,false );//scene.children
    // console.log(clickable_obj);
    // INTERSECTED = the object in the scene currently closest to the camera 
    //		and intersected by the Ray projected from the mouse position
    // if there is one (or more) intersections
    if ( intersects.length > 0 )
    {
      intersects[0].face.color = new THREE.Color(0xf2b640);
      // if the closest object intersected is not the currently stored intersection object
      if ( intersects[ 0 ].object != INTERSECTED ) 
      {
        // camera.lookAt( pointer.x, pointer.y+100,100 );
        // restore previous intersection object (if it exists) to its original color
        if ( INTERSECTED ) 
          INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
        // store reference to closest object as current intersection object
        INTERSECTED = intersects[ 0 ].object;
        // store color of closest object (for later restoration)
        INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
        // set a new color for closest object
        INTERSECTED.material.emissive.setHex( 0x4ad32c );
        document.body.style.cursor = "pointer";
      }
    } 
    else // there are no intersections
    {
      // restore previous intersection object (if it exists) to its original color
      if ( INTERSECTED ) 
        INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
      // remove previous intersection object reference
      //     by setting current intersection object to "nothing"
      INTERSECTED = null;
      document.body.style.cursor = "grab";
      // document.body.style.cursor = "grabbing";
    }
  }
  const render = () => {
    scene.traverse( darkenNonBloomed );
    bloomComposer.render();
    scene.traverse( restoreMaterial );
    // // render the entire scene, then render bloom scene on top
    finalComposer.render();

	}
  window.onresize = function () {

    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize( width, height );

    bloomComposer.setSize( width, height );
    finalComposer.setSize( width, height );

    animate();

  };
  
  loadCityModels();
  useEffect(() => {
      init();
      return () => console.log("Cleanup..");
  }, []);
  const init = () =>{
    document.getElementById( 'city_container' ).innerHTML = "";
    const container = document.getElementById( 'city_container' );
    container.appendChild( renderer.domElement );
  }
  return (
    <div id="city_container" style={{width:'100%',height:"100%"}}>
    </div>
  );
}
