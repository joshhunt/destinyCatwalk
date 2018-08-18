import React, { Component } from 'react';

import s from './styles.styl';

const THREE = require('three');
require('src/lib/TGXLoader');
const OrbitControls = require('three-orbit-controls')(THREE);

export default class CharacterRenderer extends Component {
  constructor(props) {
    super(props);
    this.rootRef = React.createRef();

    this.itemHash = 3691881271; // Sins of the Past
  }

  componentDidMount() {
    console.log(this.rootRef.current);
    const WIDTH = this.rootRef.current.clientWidth;
    const HEIGHT = 500;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(30, WIDTH / HEIGHT, 0.1, 100000);
    camera.position.z = 100;
    scene.add(camera);

    // Lights
    const ambientLight = {
      name: 'AmbientLight',
      type: 'ambient',
      color: 0xffffff,
      intensity: 0.6
    };

    const frontLight = {
      name: 'FrontLight',
      type: 'point',
      color: 0xffffff,
      intensity: 0.2,
      position: [50, 100, 300],
      parent: 'camera'
    };

    const backLight = {
      name: 'BackLight',
      type: 'point',
      color: 0xffffff,
      intensity: 0.2,
      position: [-50, 100, -300],
      parent: 'camera'
    };

    const spotLight = {
      name: 'SpotLight',
      type: 'point',
      color: 0xffffff,
      intensity: 0.4,
      position: [-50, 300, -200],
      penumbra: 0.8,
      parent: 'camera'
    };

    const topLight = {
      name: 'TopLight',
      type: 'point',
      color: 0xffffff,
      intensity: 1,
      position: [0, 300, 0],
      parent: 'camera'
    };

    const bottomLight = {
      name: 'BottomLight',
      type: 'point',
      color: 0xffffff,
      intensity: 1,
      position: [0, -300, 0],
      parent: 'camera'
    };

    const lights = [
      ambientLight,
      frontLight,
      backLight,
      spotLight,
      topLight,
      bottomLight
    ];

    for (var i = 0; i < lights.length; i++) {
      var gameLight = lights[i];

      var light, lightHelper;
      var parent = gameLight.parent === 'camera' ? camera : scene;
      var color = gameLight.color ? gameLight.color : 0xffffff;
      var intensity = gameLight.intensity ? gameLight.intensity : 1;
      var distance = gameLight.distance ? gameLight.distance : 0;

      if (gameLight.visible !== undefined && !gameLight.visible) continue;

      switch (gameLight.type) {
        case 'ambient':
          light = new THREE.AmbientLight(color, intensity);
          break;

        case 'point':
          light = new THREE.PointLight(color, intensity, distance);
          light.castShadow = true;
          light.shadow.mapSize.width = 1024;
          light.shadow.mapSize.height = 1024;
          light.shadow.camera.far = 100;
          //lightHelper = new THREE.PointLightHelper(light, 30);
          break;

        case 'spot':
          light = new THREE.SpotLight(color, intensity, distance);
          if (gameLight.penumbra) light.penumbra = gameLight.penumbra;
          //lightHelper = new THREE.SpotLightHelper(light);
          break;

        default:
          break;
      }

      if (light) {
        light.name = gameLight.name ? gameLight.name : 'Light' + i;
        if (gameLight.position) light.position.fromArray(gameLight.position);
        parent.add(light);
      }

      if (lightHelper && parent === scene) {
        lightHelper.name = light.name + 'Helper';
        scene.add(lightHelper);
      }
    }

    console.log('Scene', scene.children, camera.children);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });

    renderer.setClearColor(0xffffff, 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(WIDTH, HEIGHT);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.rootRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.rotateSpeed = 2.0;
    controls.zoomSpeed = 0.5;

    controls.addEventListener('change', () => {
      //console.log(controls);
      this.renderScene();
    });

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.renderScene();

    this.loadItem();
  }

  onLoadCallback = (...args) => {
    console.log('onLoadCallback', ...args);
  };

  onProgressCallback = (...args) => {
    console.log('onProgressCallback', ...args);
  };

  onErrorCallback = (...args) => {
    console.log('onErrorCallback', ...args);
  };

  loadItem() {
    THREE.TGXLoader.Game = 'destiny2';
    THREE.TGXLoader.Platform = 'mobile';
    THREE.TGXLoader.APIKey = process.env.REACT_APP_API_KEY; // https://www.bungie.net/en/Application
    THREE.TGXLoader.DestinyInventoryItemDefinition = this.props.DestinyInventoryItemDefinition;
    THREE.TGXLoader.DestinyGearAssetsDefinition = this.props.DestinyGearAssetsDefinition;

    const loader = new THREE.TGXLoader(
      {
        itemHash: 0, // The itemHash to load (required)
        game: 'destiny2',
        apiBasepath: THREE.TGXLoader.APIBasepath2,
        manifestPath2: THREE.TGXLoader.ManifestPath2
      },
      this.onLoadCallback,
      this.onProgressCallback,
      this.onErrorCallback
    );

    const item = this.props.DestinyInventoryItemDefinition[this.itemHash];

    loader.load(this.itemHash, (geometry, materials) => {
      const mesh = new THREE.Mesh(geometry, new THREE.MultiMaterial(materials));

      mesh.geometry.computeBoundingBox();
      const bounds = mesh.geometry.boundingBox;

      const isArmor = item.itemCategoryHashes.includes(20);
      const isShip = item.itemCategoryHashes.includes(42);
      const isSparrow = item.itemCategoryHashes.includes(43);
      const isGhost = item.itemCategoryHashes.includes(39);
      const isSword = item.itemCategoryHashes.includes(54);

      let scale = 100;

      let width = bounds.max.x - bounds.min.x;
      let height = bounds.max.z - bounds.min.z;

      const toRadian = Math.PI / 180;

      mesh.rotation.z = -180 * toRadian;

      if (isArmor) {
        mesh.rotation.z = -120 * toRadian;
        scale = 50;
      }
      if (isGhost) {
        scale = 250;
      }
      if (isShip) {
        scale = 4;
        mesh.rotation.z = -120 * toRadian;
      }
      if (isSparrow) {
        scale = 20;
        mesh.rotation.z = -130 * toRadian;
      }
      if (isSword) {
        mesh.rotation.y = 90 * 1.1 * toRadian;
        mesh.rotation.z = 0;

        width = bounds.max.z - bounds.min.z;
        height = bounds.max.x - bounds.min.x;
        //depth = bounds.max.y-bounds.min.y;
        mesh.position.x -= width / 2 * 1.5 * scale;
      }

      mesh.scale.set(scale, scale, scale);
      mesh.rotation.x = -90 * toRadian;

      mesh.position.x += (bounds.min.x + width / 2) * scale;
      mesh.position.y += -(bounds.min.z + height / 2) * scale;

      this.scene.add(mesh);

      this.renderScene();

      setTimeout(() => {
        this.renderScene();
      });
    });

    this.renderScene();
  }

  renderScene() {
    this.renderer.render(this.scene, this.camera);
  }

  render() {
    return (
      <div className={s.root}>
        <div ref={this.rootRef} />
      </div>
    );
  }
}