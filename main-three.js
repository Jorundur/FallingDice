/*
   Three.js "tutorials by example"
   Author: Lee Stemkoski
   Date: July 2013 (three.js v59dev)
*/

// MAIN

Physijs.scripts.worker = 'physijs_worker.js';
Physijs.scripts.ammo = 'js/ammo.js';

// standard global variables
var container, scene, camera, renderer, controls, stats, loader;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// custom global variables
var MovingFloor;
var Axis;

init();
animate();

// FUNCTIONS      
function init() 
{
   // SCENE
   //scene = new THREE.Scene();
   scene = new Physijs.Scene;
   
   // CAMERA
   var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
   var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
   camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
   scene.add(camera);
   camera.position.set(0,400,1200);
   camera.lookAt(scene.position);   
   
   // RENDERER
   if ( Detector.webgl )
      renderer = new THREE.WebGLRenderer( {antialias:true} );
   else
      renderer = new THREE.CanvasRenderer(); 
   renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
   container = document.getElementById( 'ThreeJS' );
   container.appendChild( renderer.domElement );
   
   // EVENTS
   THREEx.WindowResize(renderer, camera);
   THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
   
   // CONTROLS
   controls = new THREE.OrbitControls( camera, renderer.domElement );
   
   // STATS
   stats = new Stats();
   stats.domElement.style.position = 'absolute';
   stats.domElement.style.bottom = '0px';
   stats.domElement.style.zIndex = 100;
   container.appendChild( stats.domElement );
   
   // LIGHT
   var light = new THREE.PointLight(0xffffff);
   light.position.set(0,150,100);
   scene.add(light);
   
   loader = new THREE.TextureLoader();

   // FLOOR
   var floorTexture = new THREE.ImageUtils.loadTexture( 'images/checkerboard.jpg' );
   floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
   floorTexture.repeat.set( 2, 2 );
   var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
   var floorGeometry = new THREE.PlaneGeometry(200, 200, 2, 2);
   MovingFloor = new THREE.Mesh(floorGeometry, floorMaterial);
   MovingFloor.position.y = -0.5;
   MovingFloor.rotation.x = Math.PI / 2;
   scene.add(MovingFloor);

   // AXES
   Axes = new THREE.AxisHelper(150);
   scene.add( Axes )
   
   // SKYBOX
   var imagePrefix = "images/dawnmountain-";
   var directions  = ["xpos", "xneg", "ypos", "yneg", "zpos", "zneg"];
   var imageSuffix = ".png";
   var skyGeometry = new THREE.CubeGeometry( 5000, 5000, 5000 );  
   var materialArray = [];
   for (var i = 0; i < 6; i++)
      materialArray.push( new THREE.MeshBasicMaterial({
         map: THREE.ImageUtils.loadTexture( imagePrefix + directions[i] + imageSuffix ),
         side: THREE.BackSide
      }));
   var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
   var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
   scene.add( skyBox );
   
   ////////////
   // CUSTOM //
   ////////////
   // Spheres
   //   Note: a standard flat rectangular image will look distorted,
   //   a "spherical projection" image will look "normal".
   
   // radius, segmentsWidth, segmentsHeight
   var sphereGeom =  new THREE.SphereGeometry( 40, 32, 16 ); 
   
   var light2 = new THREE.AmbientLight(0x444444);
   scene.add(light2);
   
   // shaded earth -- side away from light picks up AmbientLight's color.
   var earthTexture = THREE.ImageUtils.loadTexture( 'images/earth-day.jpg' );

   // var earthTexture = THREE.TextureLoader( 'images/earth-day.jpg' );
   var earthMaterial = new THREE.MeshLambertMaterial( { map: earthTexture } );
   var earth = new THREE.Mesh( sphereGeom.clone(), earthMaterial );
   earth.position.set(300, 150, 0);
   scene.add( earth );      
   
   // create a small sphere to show position of light
   var lightbulb = new THREE.Mesh( 
      new THREE.SphereGeometry( 10, 16, 8 ), 
      new THREE.MeshBasicMaterial( { color: 0xffaa00 } )
   );
   scene.add( lightbulb );
   lightbulb.position = light.position;
   
   // Cubes
   //   Note: when using a single image, it will appear on each of the faces.
   //   Six different images (one per face) may be used if desired.
   
   // create an array with six textures for a cool cube
   var materialArray = [];
   materialArray.push(new THREE.MeshLambertMaterial( { map: THREE.ImageUtils.loadTexture( 'images/dice1.png' ) }));
   materialArray.push(new THREE.MeshLambertMaterial( { map: THREE.ImageUtils.loadTexture( 'images/dice6.png' ) }));
   materialArray.push(new THREE.MeshLambertMaterial( { map: THREE.ImageUtils.loadTexture( 'images/dice2.png' ) }));
   materialArray.push(new THREE.MeshLambertMaterial( { map: THREE.ImageUtils.loadTexture( 'images/dice5.png' ) }));
   materialArray.push(new THREE.MeshLambertMaterial( { map: THREE.ImageUtils.loadTexture( 'images/dice3.png' ) }));
   materialArray.push(new THREE.MeshLambertMaterial( { map: THREE.ImageUtils.loadTexture( 'images/dice4.png' ) }));
   // materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.TextureLoader( 'images/dice1.png' ) }));
   // materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.TextureLoader( 'images/dice6.png' ) }));
   // materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.TextureLoader( 'images/dice2.png' ) }));
   // materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.TextureLoader( 'images/dice5.png' ) }));
   // materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.TextureLoader( 'images/dice3.png' ) }));
   // materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.TextureLoader( 'images/dice4.png' ) }));
   var DiceBlueMaterial = new THREE.MeshFaceMaterial(materialArray);
   var DiceBlueGeom = new THREE.CubeGeometry( 85, 85, 85, 1, 1, 1 );
   var DiceBlue = new THREE.Mesh( DiceBlueGeom, DiceBlueMaterial );
   DiceBlue.position.set(60, 50, -100);
   scene.add( DiceBlue );   
}

function animate() {
   requestAnimationFrame( animate );
   render();      
   update();
}

function update() {
   var delta = clock.getDelta(); // seconds.
   var moveDistance = 200 * delta; // 200 pixels per second
   var rotateAngle = Math.PI / 2 * delta;   // pi/2 radians (90 degrees) per second
   
   // local coordinates
   // local transformations

   if (keyboard.pressed("W")) {
      MovingFloor.position.y += moveDistance;
      Axes.position.y += moveDistance;
   }
   if (keyboard.pressed("S")) {
      MovingFloor.position.y -= moveDistance;
      Axes.position.y -= moveDistance;
   }
      
   // global coordinates
   if (keyboard.pressed("left")) {
      MovingFloor.position.x -= moveDistance;
      Axes.position.x -= moveDistance;
   }
   if (keyboard.pressed("right")) {
      MovingFloor.position.x += moveDistance;
      Axes.position.x += moveDistance;
   }
   if (keyboard.pressed("up")) {
      MovingFloor.position.z -= moveDistance;
      Axes.position.z -= moveDistance;
   }
   if (keyboard.pressed("down")) {
      MovingFloor.position.z += moveDistance;
      Axes.position.z += moveDistance;
   }
   
   controls.update();
   stats.update();
}

function render() {
   scene.simulate(); // run physics
   renderer.render( scene, camera );
}
