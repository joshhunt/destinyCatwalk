import React, { Component } from 'react';

import s from './styles.styl';

const THREE = require('three');

export default class CharacterRenderer extends Component {
  constructor(props) {
    super(props);
    this.rootRef = React.createRef();
  }

  componentDidMount() {
    console.log(this.rootRef.current);
    const WIDTH = 700;
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
      intensity: 0.5
    };

    const frontLight = {
      name: 'FrontLight',
      type: 'point',
      color: 0xffffff,
      intensity: 0.2,
      position: [0, 100, 300],
      parent: 'camera'
    };

    const backLight = {
      name: 'BackLight',
      type: 'point',
      color: 0xffffff,
      intensity: 0.2,
      position: [0, 100, -300],
      parent: 'camera'
    };

    const spotLight = {
      name: 'SpotLight',
      type: 'point',
      color: 0xffffff,
      intensity: 0.8,
      position: [-200, 1000, 0],
      penumbra: 0.8,
      parent: 'camera'
    };

    const lights = [ambientLight, frontLight, backLight, spotLight];

    ambientLight.intensity = 0.6;

    frontLight.intensity = 0.2;
    frontLight.position = [50, 100, 300];

    backLight.intensity = 0.2;
    backLight.position = [-50, 100, -300];

    spotLight.intensity = 0.4;
    spotLight.position = [-50, 300, -200];

    const topLight = {
      name: 'TopLight',
      type: 'point',
      color: 0xffffff,
      intensity: 1,
      position: [0, 300, 0],
      parent: 'camera'
    };

    lights.push(topLight);

    const bottomLight = {
      name: 'BottomLight',
      type: 'point',
      color: 0xffffff,
      intensity: 1,
      position: [0, -300, 0],
      parent: 'camera'
    };
    lights.push(bottomLight);

    for (var i = 0; i < lights.length; i++) {
      var gameLight = lights[i];

      var light, lightHelper;
      var parent = gameLight.parent === 'camera' ? camera : scene;
      var color = gameLight.color ? gameLight.color : 0xffffff;
      var intensity = gameLight.intensity ? gameLight.intensity : 1;
      var distance = gameLight.distance ? gameLight.distance : 0;

      if (gameLight.visible != undefined && !gameLight.visible) continue;

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

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    const itemHash = 3691881271; // Gjallarhorn

    // Global Defaults
    THREE.TGXLoader.APIKey = process.env.REACT_APP_API_KEY; // https://www.bungie.net/en/Application
    THREE.TGXLoader.APIBasepath = 'https://www.bungie.net/d1/Platform/Destiny'; // The basepath for making API requests
    THREE.TGXLoader.Basepath = 'https://www.bungie.net'; // The basepath to load gear assets from
    THREE.TGXLoader.Platform = 'web'; // Whether to use "web" or "mobile" gear assets (note the latter requires extra setup to use.
    THREE.TGXLoader.ManifestPath = null; // The url for server-side manifest querying. Must include $itemHash
    THREE.TGXLoader.NoCache = false; // Whether to force assets to ignore caching.

    // Destiny 2 Global Defaults
    THREE.TGXLoader.APIBasepath2 = 'https://www.bungie.net/Platform/Destiny2';
    THREE.TGXLoader.ManifestPath2 = null;

    // Instance options
    new THREE.TGXLoader(
      {
        itemHash: 0, // The itemHash to load (required)
        classHash: 0, // The classHash to load
        isFemale: false, // Whether to use male or female geometry sets (for Armor)
        apiKey: THREE.TGXLoader.APIKey,
        apiBasepath: THREE.TGXLoader.APIBasepath,
        basepath: THREE.TGXLoader.Basepath,
        platform: THREE.TGXLoader.Platform,
        manifestPath: THREE.TGXLoader.ManifestPath,
        loadTextures: true, // Whether textures should be loaded
        loadSkeleton: false, // Whether the skeleton should be loaded (not implemented yet)
        loadAnimation: false, // Whether the animation should be loaded (not implemented yet)
        animationPath: THREE.TGXLoader.DefaultAnimationPath // The animation to load (not implemented yet)
      },
      onLoadCallback,
      onProgressCallback,
      onErrorCallback
    );
    loader.load(itemHash, function(geometry, materials) {
      console.log('LoadedItem', geometry, materials);
      const mesh = new THREE.Mesh(geometry, new THREE.MultiMaterial(materials));
      mesh.rotation.x = 90 * Math.PI / 180;
      mesh.scale.set(500, 500, 500);
      scene.add(mesh);
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
