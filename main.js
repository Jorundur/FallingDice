// The strict context prevents certain actions from being taken and throws more exceptions. 
'use strict';

// Physijs is a physics plugin for three.js

// A web worker is a JavaScript that runs in the background, independently of other scripts,
// without affecting the performance of the page.
// Physijs runs the physics simulation in a separate thread (via web worker).
Physijs.scripts.worker = 'physijs_worker.js';

// Physijs is built on top of ammo.js 
// (Ammo is a direct port of the Bullet physics engine to JavaScript using Emscripten)
Physijs.scripts.ammo = 'js/ammo.js';

// Declare global variables
var initScene, render, _boxes = [], spawnBox, loader, update,
    renderer, render_stats, physics_stats, scene, ground_material, moving_ground, axes, light, camera, controls;

// For simple key press checks
var keyboard = new THREEx.KeyboardState();

// For getting delta time
var clock = new THREE.Clock();

// Initial set up
initScene = function() {
    // The WebGL renderer displays your beautifully crafted scenes using WebGL
    // antialias makes jagged edges more smooth
    renderer = new THREE.WebGLRenderer({ antialias: true });
    // Set size to browser window
    renderer.setSize( window.innerWidth, window.innerHeight );
    // Allow shadows in scene
    renderer.shadowMap.enabled = true;
    // Soften shadows so they appear less pixellated
    renderer.shadowMapSoft = true;
    // Add renderer to html file (div with id 'viewport')
    document.getElementById( 'viewport' ).appendChild( renderer.domElement );

    // LOADER
    // Used to load textures later on
    loader = new THREE.TextureLoader();
   
    // Stats that appear in upper left corner
    render_stats = new Stats();
    render_stats.domElement.style.position = 'absolute';
    render_stats.domElement.style.top = '0px';
    render_stats.domElement.style.zIndex = 100;
    document.getElementById( 'viewport' ).appendChild( render_stats.domElement );

    physics_stats = new Stats();
    physics_stats.domElement.style.position = 'absolute';
    physics_stats.domElement.style.top = '50px';
    physics_stats.domElement.style.zIndex = 100;
    document.getElementById( 'viewport' ).appendChild( physics_stats.domElement );
    
    // Create scene using Physijs to access physics
    // Holy trinity: A scene, a camera, and a renderer so we can render the scene with the camera.
    scene = new Physijs.Scene;
    scene.setGravity(new THREE.Vector3( 0, -30, 0 ));
    scene.addEventListener(
        'update',
        function() {
            // Simulate as much as possible for one iteration
            scene.simulate( undefined, 1 );
            // Could also have this in update function...
            physics_stats.update();
        }
    );
   
    // CAMERA
    // This projection mode is designed to mimic the way the human eye sees.
    // It is the most common projection mode used for rendering a 3D scene.
    // fov - aspect - near - far
    camera = new THREE.PerspectiveCamera(
        35,
        window.innerWidth / window.innerHeight,
        1,
        15000 // Set far end high enough to cover skybox
    );
    camera.position.set( 150, 150, 400 );
    camera.lookAt( scene.position );
    scene.add( camera );

    // CONTROLS (moving around with mouse)
    // Just a simple way to move around in the scene
    controls = new THREE.OrbitControls( camera, renderer.domElement );

    // SKYBOX
    var imagePrefix = "images/dawnmountain-";
    var directions  = ["xpos", "xneg", "ypos", "yneg", "zpos", "zneg"];
    var imageSuffix = ".png";
    var skyGeometry = new THREE.CubeGeometry( 5000, 5000, 5000 );  
    var materialArray = [];
    for (var i = 0; i < 6; i++)
        materialArray.push( new THREE.MeshBasicMaterial({
            map: loader.load( imagePrefix + directions[i] + imageSuffix ),
            side: THREE.BackSide // Render backside since we're inside box
        }));
    var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
    var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
    scene.add( skyBox );

    // Light
    /* A light that gets emitted in a specific direction.
      This light will behave as though it is infinitely far away and the rays produced from it are all parallel.
      The common use case for this is to simulate daylight;
      the sun is far enough away that its position can be considered to be infinite,
      and all light rays coming from it are parallel.
    */
    light = new THREE.DirectionalLight( 0xFFFFFF );
    light.position.set( 20, 40, -15 );
    light.target.position.copy( scene.position );
    light.castShadow = true;
    light.shadowCameraLeft = -60;
    light.shadowCameraTop = -60;
    light.shadowCameraRight = 60;
    light.shadowCameraBottom = 60;
    light.shadowCameraNear = 20;
    light.shadowCameraFar = 200;
    light.shadowBias = -.0001
    light.shadowMapWidth = light.shadowMapHeight = 2048;
    light.shadowDarkness = .7;
    scene.add( light );

    /* A light that gets emitted from a single point in all directions.
      A common use case for this is to replicate the light emitted from a bare lightbulb.  
    */
    var sunlight = new THREE.PointLight(0xffffff);
    sunlight.position.set(0,150,100);
    scene.add( sunlight );

    /* This light globally illuminates all objects in the scene equally.
      This light cannot be used to cast shadows as it does not have a direction.
    */
    var ambience = new THREE.AmbientLight(0x444444);
    scene.add( ambience );

    // EARTH
    // Params: radius, segmentsWidth, segmentsHeight
    var sphereGeom = new THREE.SphereGeometry( 40, 32, 16 ); 
    // shaded earth -- side away from light picks up AmbientLight's color.
    var earthTexture = loader.load( 'images/earth-day.jpg' );
    // A material for non-shiny surfaces, without specular highlights.
    var earthMaterial = new THREE.MeshLambertMaterial( { map: earthTexture } );
    var earth = new THREE.Mesh( sphereGeom.clone(), earthMaterial );
    earth.position.set(-200, 50, 0);
    scene.add( earth );

    // create a small sphere to show position of sunlight
    var lightbulb = new THREE.Mesh( 
        new THREE.SphereGeometry( 10, 16, 8 ), 
        new THREE.MeshBasicMaterial( { color: 0xffaa00 } )
    );
    lightbulb.position.set(sunlight.position.x, sunlight.position.y, sunlight.position.z);
    scene.add( lightbulb );

    // GROUND
    ground_material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: loader.load( 'images/checkerboard.jpg' ) }),
        .8, // high friction
        .3 // low restitution
    );
    // UV mapping
    ground_material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping;
    ground_material.map.repeat.set( 3, 3 );
   
    // We want this to be a Physijs mesh (instead of ThreeJS mesh) because we want it to be impacted by physics
    moving_ground = new Physijs.BoxMesh(
        new THREE.BoxGeometry(100, 1, 100),
        ground_material,
        0 // mass
    );
    moving_ground.receiveShadow = true;
    scene.add( moving_ground );

    // Spawns dice in random places every second
    spawnBox();

    // AXES
    axes = new THREE.AxisHelper(80);
    scene.add( axes )

    // The window.requestAnimationFrame() method tells the browser that you wish to perform an animation and
    // requests that the browser call a specified function to update an animation before the next repaint.
    // The method takes an argument as a callback to be invoked before the repaint.
    requestAnimationFrame( render );
    scene.simulate();
};

spawnBox = (function() {
    var box_geometry = new THREE.BoxGeometry( 16, 16, 16),
        handleCollision = function( collided_with, linearVelocity, angularVelocity ) {
        },
        createBox = function() {

            // create an array with six textures for our dice
            var materialArray = [];
            materialArray.push(new THREE.MeshLambertMaterial( { map: loader.load( 'images/dice1.png' ) }));
            materialArray.push(new THREE.MeshLambertMaterial( { map: loader.load( 'images/dice6.png' ) }));
            materialArray.push(new THREE.MeshLambertMaterial( { map: loader.load( 'images/dice2.png' ) }));
            materialArray.push(new THREE.MeshLambertMaterial( { map: loader.load( 'images/dice5.png' ) }));
            materialArray.push(new THREE.MeshLambertMaterial( { map: loader.load( 'images/dice3.png' ) }));
            materialArray.push(new THREE.MeshLambertMaterial( { map: loader.load( 'images/dice4.png' ) }));

            var DiceBlueMaterial = new THREE.MeshFaceMaterial(materialArray);

            var box, material;
         
            /* Related side note: You must call Physijs.createMaterial with the three.js material,
              friction, and restitution values you want the Physijs material to have.
              This new material can be used just like any other three.js material.
            */
            material = Physijs.createMaterial(
                DiceBlueMaterial,
                .6, // medium friction 
                .3 // low restitution ("bounciness")
            );

            box = new Physijs.BoxMesh(
                box_geometry,
                material
            );

            box.collisions = 0;

            box.position.set(
                Math.random() * 15 - 7.5,
                125,
                Math.random() * 15 - 7.5
            );

            box.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            box.castShadow = true;
            box.addEventListener( 'collision', handleCollision );
            box.addEventListener( 'ready', spawnBox );
            scene.add( box );
        };

    return function() {
        setTimeout( createBox, 1000 );
    };
})();

update = function() {
    var delta = clock.getDelta(); // seconds.
    var moveDistance = 100 * delta; // 100 pixels per second
    var rotateAngle = Math.PI / 2 * delta;   // pi/2 radians (90 degrees) per second

    if (keyboard.pressed("W")) {
        moving_ground.position.y += moveDistance;
        moving_ground.__dirtyPosition = true;
        axes.position.y += moveDistance;
        // __dirtyPosition used because of: https://github.com/chandlerprall/Physijs/wiki/Updating-an-object's-position-&-rotation
        axes.__dirtyPosition = true;
    }
    if (keyboard.pressed("S")) {
        moving_ground.position.y -= moveDistance;
        moving_ground.__dirtyPosition = true;
        axes.position.y -= moveDistance;
        axes.__dirtyPosition = true;
    }
      
    // global coordinates
    if (keyboard.pressed("left")) {
        moving_ground.position.x -= moveDistance;
        moving_ground.__dirtyPosition = true;
        axes.position.x -= moveDistance;
        axes.__dirtyPosition = true;
    }
    if (keyboard.pressed("right")) {
        moving_ground.position.x += moveDistance;
        moving_ground.__dirtyPosition = true;
        axes.position.x += moveDistance;
        axes.__dirtyPosition = true;
    }
    if (keyboard.pressed("up")) {
        moving_ground.position.z -= moveDistance;
        moving_ground.__dirtyPosition = true;
        axes.position.z -= moveDistance;
        axes.__dirtyPosition = true;
    }
    if (keyboard.pressed("down")) {
        moving_ground.position.z += moveDistance;
        moving_ground.__dirtyPosition = true;
        axes.position.z += moveDistance;
        axes.__dirtyPosition = true;
    }

    controls.update();
    render_stats.update();
};

render = function() {
    requestAnimationFrame( render );
    renderer.render( scene, camera );
    update();
};

window.onload = initScene;