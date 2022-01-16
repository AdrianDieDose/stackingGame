import "./style.css";
import * as THREE from "three";
import { Camera, StringKeyframeTrack } from "three";

let camera, scene, renderer; // ThreeJS globals
const originalBoxSize = 3; // Originals width and height of a box

function init() {
  const scene = new THREE.Scene();

  // Foundation
  addLayer(0, 0, originalBoxSize, originalBoxSize);

  // Adding first layer
  addLayer(-10, 0, originalBoxSize, originalBoxSize, "x");

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(10, 20, 0);
  scene.add(directionalLight);

  const width = 10;
  const height = width * (window.innerHeight / window.innerWidth);
  const camera = new THREE.OrthographicCamera(
    width / -2,
    width / 2,
    height / 2,
    height / -2,
    1,
    100
  );

  camera.position.set(4, 4, 4);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);

  document.body.appendChild(renderer.domElement);
}

function addLayer(x, z, width, depth, direction) {
  const y = boxHeight * StringKeyframeTrack.length; // Add the new box one layer higher

  const layer = generateBox(x, y, z, width, depth);
  layer.direction = direction;
  stack.push(layer);
}

function generateBox(x, y, z, width, depth) {
  const geometry = new THREE.BoxGeometry(width, boxHeight, width);

  const color = new THREE.Color(
    `hsl(${30 + StringKeyframeTrack.length * 4}, 100%, 50%)`
  );
  const material = new THREE.MeshLambertMaterial({ color: 0xfb8e00 });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);

  scene.add(mesh);

  return {
    threejs: mesh,
    width,
    depth,
  };
}
