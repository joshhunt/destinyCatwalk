import React, { Component } from 'react';
import { keyBy } from 'lodash';

import {
  BUCKET_ARMOR_HEAD,
  BUCKET_ARMOR_ARMS,
  BUCKET_ARMOR_CHEST,
  BUCKET_ARMOR_LEGS,
  BUCKET_ARMOR_CLASS_ITEM
} from 'src/lib/destinyEnums';

import s from './styles.styl';

const THREE = require('three');
require('src/lib/TGXLoader');
const OrbitControls = require('three-orbit-controls')(THREE);

export default class CharacterRenderer extends Component {
  constructor(props) {
    super(props);
    this.rootRef = React.createRef();
    this.state = { loading: true };

    this.itemHash = 3691881271; // Sins of the Past
  }

  componentDidMount() {
    console.log(this.rootRef.current);
    const WIDTH = this.rootRef.current.clientWidth;
    const HEIGHT = 500;
    this.setState({ height: HEIGHT });

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(30, WIDTH / HEIGHT, 0.01, 10000);
    camera.position.z = 4;
    camera.position.y = 1;
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
          break;

        case 'spot':
          light = new THREE.SpotLight(color, intensity, distance);
          if (gameLight.penumbra) light.penumbra = gameLight.penumbra;
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
    controls.target.set(0, 1, 0);
    controls.rotateSpeed = 2.0;
    controls.zoomSpeed = 0.5;
    controls.update();

    controls.addEventListener('change', () => {
      //console.log(controls);
      this.renderScene();
    });

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.renderScene();

    const buckets = keyBy(this.props.equipment.items, item => item.bucketHash);
    [
      buckets[BUCKET_ARMOR_HEAD].itemHash,
      buckets[BUCKET_ARMOR_ARMS].itemHash,
      buckets[BUCKET_ARMOR_CHEST].itemHash,
      buckets[BUCKET_ARMOR_LEGS].itemHash,
      buckets[BUCKET_ARMOR_CLASS_ITEM].itemHash
    ].forEach(itemHash => this.loadItem(itemHash));
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

  loadItem(itemHash) {
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

    loader.load(itemHash, (geometry, materials) => {
      const mesh = new THREE.Mesh(geometry, materials);

      mesh.geometry.computeBoundingBox();
      const bounds = mesh.geometry.boundingBox;

      let width = bounds.max.x - bounds.min.x;
      let height = bounds.max.z - bounds.min.z;

      const toRadian = Math.PI / 180;

      mesh.rotation.x = -90 * toRadian;
      mesh.rotation.z = -90 * toRadian;

      this.scene.add(mesh);
      this.renderScene();

      setTimeout(() => {
        this.renderScene();
        this.setState({ loading: false });
      });
    });

    this.renderScene();
  }

  renderScene() {
    this.renderer.render(this.scene, this.camera);
  }

  render() {
    return (
      <div className={s.root} style={{ minHeight: this.state.height }}>
        {this.state.loading && (
          <div style={{ height: this.state.height }} className={s.loading}>
            Loading...
          </div>
        )}
        <div ref={this.rootRef} />
      </div>
    );
  }
}
