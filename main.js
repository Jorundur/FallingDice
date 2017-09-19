'use strict';
   
Physijs.scripts.worker = 'physijs_worker.js';
Physijs.scripts.ammo = 'js/ammo.js';

var initScene, render, _boxes = [], spawnBox, loader, update,
    renderer, render_stats, physics_stats, scene, ground_material, moving_ground, axes, light, camera, controls;

var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

initScene = function() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
    document.getElementById( 'viewport' ).appendChild( renderer.domElement );

    // CONTROLS
    controls = new THREE.OrbitControls( camera, renderer.domElement );

    // LOADER
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
    scene = new Physijs.Scene;
    scene.setGravity(new THREE.Vector3( 0, -30, 0 ));
    scene.addEventListener(
        'update',
        function() {
            scene.simulate( undefined, 1 );
            physics_stats.update();
        }
    );
   
    // CAMERA
    camera = new THREE.PerspectiveCamera(
        35,
        window.innerWidth / window.innerHeight,
        1,
        15000 // Set far end high enough to cover skybox
    );
    camera.position.set( 150, 150, 400 );
    camera.lookAt( scene.position );
    scene.add( camera );

    // CONTROLS
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
            side: THREE.BackSide
        }));
    var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
    var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
    scene.add( skyBox );

    // Light
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

    var sunlight = new THREE.PointLight(0xffffff);
    sunlight.position.set(0,150,100);
    scene.add( sunlight );

    var ambience = new THREE.AmbientLight(0x444444);
    scene.add( ambience );

    // EARTH
    // Params: radius, segmentsWidth, segmentsHeight
    var sphereGeom = new THREE.SphereGeometry( 40, 32, 16 ); 
    // shaded earth -- side away from light picks up AmbientLight's color.
    var earthTexture = loader.load( 'images/earth-day.jpg' );
    var earthMaterial = new THREE.MeshLambertMaterial( { map: earthTexture } );
    var earth = new THREE.Mesh( sphereGeom.clone(), earthMaterial );
    earth.position.set(-200, 50, 0);
    scene.add( earth );

    // create a small sphere to show position of light
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
    ground_material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping;
    ground_material.map.repeat.set( 3, 3 );
   
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
         
            material = Physijs.createMaterial(
                DiceBlueMaterial,
                .6, // medium friction
                .3 // low restitution
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
    var moveDistance = 100 * delta; // 200 pixels per second
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