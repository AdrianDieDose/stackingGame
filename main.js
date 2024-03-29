import "./style.css";
import * as THREE from "three";
import { Camera } from "three";
import * as CANNON from "cannon";

// We need buggix: when bot loses and we click : error

let camera, scene, renderer; // ThreeJS globals
const originalBoxSize = 3; // Originals width and height of a box
let stack = []; // Height of each layer
let overhangs = [];
let gameStarted = false;
const boxHeight = 1; // Height of each layer
let direction; //Something fishy
let world; // CannonJs world
let autoplayOn = true; // Tells if autoplay if active
let prevLayerPosRdm; // Used to randomize the box autoplay position
const autoplayAccuracy = 8; // The box range of possible outcomes
const speed = 0.04;
const gravity = -5;
const counter = document.getElementById("counter");
let rotateY = boxHeight;

function init() {
  // Init CannonJs
  world = new CANNON.World();
  world.gravity.set(0, gravity, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 40;

  scene = new THREE.Scene();

  // Foundation
  addLayer(0, 0, originalBoxSize, originalBoxSize);

  // Adding first layer
  addLayer(-10, 0, originalBoxSize, originalBoxSize, "x");

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(10, 20, 0);
  scene.add(directionalLight);

  const width = 12 / (window.innerHeight / window.innerWidth);
  const height = width * (window.innerHeight / window.innerWidth);
  camera = new THREE.OrthographicCamera(
    width / -2, //Left
    width / 2, //Right
    height / 2, //Top
    height / -2, //Bottom
    1,
    100
  );

  camera.position.set(8, 8, 8);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);

  document.body.appendChild(renderer.domElement);
  renderer.setAnimationLoop(animation);

  // For some css
  document.querySelector(".menu").style.opacity = 1;
  prevLayerPosRdm = (
    (Math.random() * originalBoxSize) /
    autoplayAccuracy
  ).toFixed(1);
}

function reset() {
  console.log("reset");
  renderer.setAnimationLoop(null);

  stack = [];
  overhangs = [];
  world;
 rotateY = boxHeight;

  world = new CANNON.World();
  world.gravity.set(0, gravity, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 40;

  scene = new THREE.Scene();
  console.log(stack);
  scene = new THREE.Scene();
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(10, 20, 0);
  scene.add(directionalLight);
  // Foundation
  addLayer(0, 0, originalBoxSize, originalBoxSize);

  // Adding first layer
  addLayer(-10, 0, originalBoxSize, originalBoxSize, "x");
  camera.position.set(8, 8, 8);
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
  renderer.setAnimationLoop(animation);
  counter.textContent = 0;
}

function addLayer(x, z, width, depth, direction) {
  const y = boxHeight * stack.length; // Add the new box one layer higher

  const layer = generateBox(x, y, z, width, depth, false);
  layer.direction = direction; //Something fishy
  stack.push(layer);
}

function addOverhang(x, z, width, depth) {
  const y = boxHeight * (stack.length - 1); // Add the new box on the same layer.
  const overhang = generateBox(x, y, z, width, depth, true);
  overhangs.push(overhang);
}

function generateBox(x, y, z, width, depth, falls) {
  // ThreeJS
  const geometry = new THREE.BoxGeometry(width, boxHeight, depth);
  const color = new THREE.Color(`hsl(${30 + stack.length * 4}, 100%, 50%)`);
  const material = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  //CannonJS
  const shape = new CANNON.Box(
    new CANNON.Vec3(width / 2, boxHeight / 2, depth / 2)
  );
  let mass = falls ? 5 : 0;
  const body = new CANNON.Body({ mass, shape });
  body.position.set(x, y, z);
  world.addBody(body);

  return {
    threejs: mesh,
    cannonjs: body,
    width,
    depth,
    direction, // Added bc error ?
  };
}

window.addEventListener("click", () => {
  if (autoplayOn == true || !gameStarted) {
    reset();
    autoplayOn = false;
    gameStarted = true;
    // For some css
    document.querySelector(".menu").classList.toggle("active");
    document.querySelector(".menu").style.opacity = 0;
  } else {
    clickLogic(false);
  }
});

window.addEventListener("keypress", (key) => {
  if (key.key == "r" && gameStarted == true) {
    reset();
    autoplayOn = false;
    gameStarted = true;
  }
});

function clickLogic(autoOn) {
  const topLayer = stack[stack.length - 1];
  const previousLayer = stack[stack.length - 2];

  const direction = topLayer.direction;

  const delta =
    topLayer.threejs.position[direction] -
    previousLayer.threejs.position[direction];

  const overhangSize = Math.abs(delta);

  const size = direction == "x" ? topLayer.width : topLayer.depth;

  const overlap = size - overhangSize;
  //console.log(topLayer.threejs.position[direction]);

  if (overlap > 0) {
    //Cut layer

    cutBox(topLayer, overlap, size, delta);

    // Overhang
    const overhangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta);
    const overhangX =
      direction == "x"
        ? topLayer.threejs.position.x + overhangShift
        : topLayer.threejs.position.x;
    const overhangZ =
      direction == "z"
        ? topLayer.threejs.position.z + overhangShift
        : topLayer.threejs.position.z;
    const overhangWidth = direction == "x" ? overhangSize : topLayer.width;
    const overhangDepth = direction == "z" ? overhangSize : topLayer.depth;

    addOverhang(overhangX, overhangZ, overhangWidth, overhangDepth);

    // Next layer
    const nextX = direction == "x" ? topLayer.threejs.position.x : -10;
    const nextZ = direction == "z" ? topLayer.threejs.position.z : -10;
    const newWidth = topLayer.width; // New layer has the same size as the cut top layer
    const newDepth = topLayer.depth; // New layer has the same size as the cut top layer
    const nextDirection = direction == "x" ? "z" : "x";

    counter.innerHTML = parseInt(counter.textContent) + 1;
    addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);
  }

  prevLayerPosRdm = (
    ((Math.random() - previousLayer.threejs.position[direction]) * size) /
    autoplayAccuracy
  ).toFixed(1);
}

function cutBox(topLayer, overlap, size, delta) {
  const direction = topLayer.direction;
  const newWidth = direction == "x" ? overlap : topLayer.width;
  const newDepth = direction == "z" ? overlap : topLayer.depth;

  //Update metadata
  topLayer.width = newWidth;
  topLayer.depth = newDepth;

  //Update ThreeJS Model
  topLayer.threejs.scale[direction] = overlap / size;
  topLayer.threejs.position[direction] -= delta / 2;

  //Update CannonJS model
  topLayer.cannonjs.position[direction] -= delta / 2;

  //Replace shape to a smaller one (in CanninJS you cant just simply scale a shape)
  const shape = new CANNON.Box(
    new CANNON.Vec3(newWidth / 2, boxHeight / 2, newDepth / 2)
  );
  topLayer.cannonjs.shapes = [];
  topLayer.cannonjs.addShape(shape);
}

function animation() {
  const topLayer = stack[stack.length - 1];
  topLayer.threejs.position[topLayer.direction] += speed;
  topLayer.cannonjs.position[topLayer.direction] += speed;

  if (camera.position.y < boxHeight * (stack.length - 2) + 4) {
    camera.position.y += speed;
    rotateY += speed;
  }
  updatePhysics();
  renderer.render(scene, camera);

  const direction = topLayer.direction;
  if (
    autoplayOn == true &&
    // Wierd bug if not <= the block wont be placed bc numers 0.00 and -0.00 is causing a problem and not triggering?
    prevLayerPosRdm <= topLayer.threejs.position[direction].toFixed(1)
  ) {
    clickLogic(true);
  }
  if(autoplayOn == true){
  rotate();
  }
  //console.log(topLayer.threejs.position[direction].toFixed(1));
  //console.log(prevLayerPosRdm);
}

function rotate() {
  let rotSpeed = 0.01;
  var x = camera.position.x,
    y = camera.position.y,
    z = camera.position.z;

  
    camera.position.x = x * Math.cos(rotSpeed) + z * Math.sin(rotSpeed);
    camera.position.z = z * Math.cos(rotSpeed) - x * Math.sin(rotSpeed);
  

  camera.lookAt(0, rotateY, 0);
}

function updatePhysics() {
  world.step(1 / 60); // Step the physics world

  // Copy coordinates form cannon.js to three.js
  overhangs.forEach((element) => {
    element.threejs.position.copy(element.cannonjs.position);
    element.threejs.quaternion.copy(element.cannonjs.quaternion);
  });
}

function autoplay() {}

init();
