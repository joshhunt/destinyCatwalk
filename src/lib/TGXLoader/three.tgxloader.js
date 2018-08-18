/* eslint-disable */

const THREE = require('three');

THREE.TGXLoader = function(manager) {
  this.manager = manager !== undefined ? manager : THREE.DefaultLoadingManager;
};

// Global defaults
THREE.TGXLoader.APIKey = null;
THREE.TGXLoader.APIBasepath = 'https://www.bungie.net/d1/Platform/Destiny';
THREE.TGXLoader.Basepath = 'https://www.bungie.net';
THREE.TGXLoader.Platform = 'web';
THREE.TGXLoader.ManifestPath = null;
THREE.TGXLoader.DefaultAnimationPath = 'destiny_player_animation.js';
THREE.TGXLoader.Game = 'destiny';
THREE.TGXLoader.NoCache = false;

THREE.TGXLoader.EnvMapPath = null;

// Destiny 2
THREE.TGXLoader.APIBasepath2 = 'https://www.bungie.net/Platform/Destiny2';
THREE.TGXLoader.ManifestPath2 = null;

Object.assign(THREE.TGXLoader.prototype, {
  load: function(options, onLoad, onProgress, onError) {
    var defaultOptions = {
      //itemHash: options,
      itemHashes: [options],
      shaderHash: 0,
      ornamentHash: 0,
      classHash: 0,
      isFemale: false,
      apiKey: THREE.TGXLoader.APIKey,
      //apiBasepath: THREE.TGXLoader.APIBasepath,
      basepath: THREE.TGXLoader.Basepath,
      platform: THREE.TGXLoader.Platform,
      //manifestPath: THREE.TGXLoader.ManifestPath,
      loadTextures: true,
      loadSkeleton: false,
      loadAnimation: false,
      animationPath: THREE.TGXLoader.DefaultAnimationPath,
      game: THREE.TGXLoader.Game,
      noCache: THREE.TGXLoader.NoCache,

      envMapPath: THREE.TGXLoader.EnvMapPath,

      ignoreLockedDyes: false,

      debugMode: false
    };
    if (typeof options !== 'object') options = {};

    var game = options.game ? options.game : defaultOptions.game;

    switch (game) {
      case 'destiny2':
        defaultOptions.apiBasepath = THREE.TGXLoader.APIBasepath2;
        defaultOptions.manifestPath = THREE.TGXLoader.ManifestPath2;
        break;

      default:
        defaultOptions.apiBasepath = THREE.TGXLoader.APIBasepath;
        defaultOptions.manifestPath = THREE.TGXLoader.ManifestPath;
        break;
    }

    for (var key in defaultOptions) {
      if (options[key] === undefined) options[key] = defaultOptions[key];
    }

    if (options.itemHash !== undefined) options.itemHashes = [options.itemHash];

    console.log('Loader', options);

    var scope = this;

    //if (onProgress === undefined) {
    //  onProgress = function(event) {
    //    console.log(event);
    //  }
    //}

    if (onError === undefined) {
      onError = function(error) {
        console.error(error);
      };
    }

    var loader;
    var loadedCount = 0;
    var loadedTotal = 0;
    var items = [];
    var shaderHashes = [];
    var shaders = {};

    // Mobile manifest support
    // if (
    //   options.platform === 'mobile' &&
    //   !options.manifestPath &&
    //   !THREE.TGXManifest.isCapable()
    // ) {
    //   options.platform = 'web';
    // }

    function assetsLoaded() {
      if (loadedCount === loadedTotal) {
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          item.shaderHash = shaderHashes[i];
        }
        scope.parse(items, shaders, options, onLoad, onProgress, onError);
      }
    }

    function itemAsset(itemIndex, itemHash) {
      gearAsset(itemHash, function(item) {
        items[itemIndex] = item;
      });
    }

    function shaderAsset(itemIndex, shaderHash) {
      shaderHashes[itemIndex] = shaderHash;
      if (shaderHash === 0 || shaders[shaderHash] !== undefined) {
        loadedCount++;
        assetsLoaded();
        return;
      }
      shaders[shaderHash] = null;
      gearAsset(shaderHash, function(shader) {
        shaders[shaderHash] = shader;
      });
    }

    function gearAsset(itemHash, callback) {
      const gearAsset = THREE.TGXLoader.DestinyGearAssetsDefinition[itemHash];
      console.log({
        defs: THREE.TGXLoader.DestinyGearAssetsDefinition,
        itemHash,
        gearAsset
      });

      loadedCount++;
      callback({ requestedId: itemHash, gearAsset });
      assetsLoaded();
    }

    loadedTotal = options.itemHashes.length * 2;

    // Only load the single ornamentHash when there is only one item
    var defaultOrnamentHash =
      options.itemHashes.length === 1 ? options.ornamentHash : 0;

    for (var i = 0; i < options.itemHashes.length; i++) {
      var itemHash = options.itemHashes[i];
      var ornamentHash =
        options.ornamentHashes && i < options.ornamentHashes.length
          ? options.ornamentHashes[i]
          : defaultOrnamentHash;
      var shaderHash =
        options.shaderHashes && i < options.shaderHashes.length
          ? options.shaderHashes[i]
          : options.shaderHash;
      itemAsset(i, ornamentHash ? ornamentHash : itemHash);
      shaderAsset(i, shaderHash);
    }
  },

  parse: function(items, shaders, options, onLoad, onProgress, onError) {
    var utils = THREE.TGXLoaderUtils;

    var game = options.game;
    var basepath = options.basepath;
    var contentpath = basepath + '/common/' + game + '_content';
    var platform = options.platform;
    var animationPath = options.animationPath;
    var isFemale = options.isFemale;
    var classHash = options.classHash;
    var loadSkeleton = options.loadSkeleton;
    var loadAnimation = options.loadAnimation;
    var loadTextures = options.loadTextures;
    var noCache = options.noCache;
    var onLoadCallback = onLoad;
    var onProgressCallback = onProgress;
    var onErrorCallback = onError;

    console.log({ contentpath, basepath, game });

    var debugMode = options.debugMode;

    var contentLoaded = {
      items: items,
      regions: {},
      gear: {},
      tgxms: {
        geometry: {},
        textures: {}
      },
      geometry: {},
      textures: {},
      platedTextures: {},
      mobileTextures: {},
      skeleton: null,
      animations: []
    };
    var assetLoadCount = 0;
    var assetLoadTotal = 0;
    var contentParsed = false;

    // Rendering
    var hasBones = false;
    var defaultMaterial, geometry, materials;
    var vertexOffset = 0;

    // Missing Textures
    var DEFAULT_CUBEMAP = '2164797681_default_monocrome_cubemap' /*'env_0'*/;

    // Spasm.TGXAssetLoader.prototype.onLoadAssetManifest
    function loadAssetManifest(gear) {
      console.log('GearAsset', gear);
      if (!gear.gearAsset) {
        console.warn('MissingGearAsset', gear);
        return;
      }

      var gearAsset = gear.gearAsset;

      contentLoaded.regions[gear.requestedId] = [];

      // Tally up gear resources for loading
      assetLoadTotal += Object.keys(gearAsset.gear).length;
      if (loadSkeleton) assetLoadTotal++;
      if (loadAnimation) assetLoadTotal++;

      for (var i = 0; i < gearAsset.content.length; i++) {
        var content = gearAsset.content[i];
        console.log('Content[' + i + ']', content);
        var contentRegions = loadAssetManifestContent(content);

        contentLoaded.regions[gear.requestedId][i] = contentRegions;
      }

      function gearIndexLoop(gearIndex) {
        var gearUrl =
          contentpath + '/geometry/gear/' + gearAsset.gear[gearIndex];

        loadPart(
          gearUrl,
          function(gear) {
            gear = JSON.parse(utils.string(gear));
            gear.url = gearUrl;
            contentLoaded.gear[gear.reference_id] = gear;
            assetLoadCount++;
            checkContentLoaded();
          },
          onProgressCallback,
          onErrorCallback
        );
      }

      // Load Gear
      for (var gearIndex in gearAsset.gear) {
        gearIndexLoop(gearIndex);
      }

      // Load Bones / Animations
      if (loadSkeleton && contentLoaded.skeleton === undefined) {
        contentLoaded.skeleton = null;
        loadPart(
          contentpath + '/animations/destiny_player_skeleton.js',
          function(skeleton) {
            skeleton = JSON.parse(skeleton);
            contentLoaded.skeleton = skeleton;
            assetLoadCount++;
            checkContentLoaded();
          },
          onProgressCallback,
          onErrorCallback
        );

        if (loadAnimation) {
          loadPart(
            contentpath + '/animations/' + animationPath,
            function(animations) {
              animations = JSON.parse(animations);
              contentLoaded.animations = animations;
              assetLoadCount++;
              checkContentLoaded();
            },
            onProgressCallback,
            onErrorCallback
          );
        }
      }
    }

    function loadAssetManifestContent(content) {
      // Filter Regions
      var filteredRegionIndexSets = [];

      if (content.dye_index_set) {
        filteredRegionIndexSets.push(content.dye_index_set);
      }

      if (content.region_index_sets) {
        // Use gender neutral sets
        for (var setIndex in content.region_index_sets) {
          var regionIndexSet = content.region_index_sets[setIndex];
          var skipSet = false;
          if (skipSet) continue;
          for (var j = 0; j < regionIndexSet.length; j++) {
            filteredRegionIndexSets.push(regionIndexSet[j]);
          }
        }
      } else if (content.female_index_set && content.male_index_set) {
        // Use gender-specific set (ie armor)
        filteredRegionIndexSets.push(
          isFemale ? content.female_index_set : content.male_index_set
        );
      } else {
        // This is probably a shader
        // console.warn('NoIndexSetFound['+i+']', content);
      }

      // Build Asset Index Table
      var geometryIndexes = {};
      var textureIndexes = {};
      var platedTextureIndexes = {};

      for (var filteredRegionIndex in filteredRegionIndexSets) {
        var filteredRegionIndexSet =
          filteredRegionIndexSets[filteredRegionIndex];
        var index, i;
        if (filteredRegionIndexSet === undefined) {
          console.warn(
            'MissingFilterRegionIndexSet',
            filteredRegionIndex,
            filteredRegionIndexSets
          );
          continue;
        }

        // Shaders don't have geometry
        if (filteredRegionIndexSet.geometry) {
          for (i = 0; i < filteredRegionIndexSet.geometry.length; i++) {
            index = filteredRegionIndexSet.geometry[i];
            geometryIndexes[index] = index;
          }
        }

        for (i = 0; i < filteredRegionIndexSet.textures.length; i++) {
          index = filteredRegionIndexSet.textures[i];
          textureIndexes[index] = index;
        }

        // Web only
        if (filteredRegionIndexSet.plate_regions) {
          for (i = 0; i < filteredRegionIndexSet.plate_regions.length; i++) {
            index = filteredRegionIndexSet.plate_regions[i];
            platedTextureIndexes[index] = index;
          }
        }

        // Apparently there are shaders?
        if (filteredRegionIndexSet.shaders) {
          console.warn(
            'AssetHasShaders[' + i + ']',
            filteredRegionIndexSet.shaders
          );
        }
      }

      // Tally up geometries and textures for loading
      assetLoadTotal += Object.keys(geometryIndexes).length;
      if (loadTextures) {
        assetLoadTotal += Object.keys(textureIndexes).length;
        assetLoadTotal += Object.keys(platedTextureIndexes).length;
        assetLoadTotal++; // Envmap
      }

      // Remember everything for later
      var contentRegions = {
        geometry: {},
        textures: {},
        platedTextures: {},
        shaders: {}
      };

      function loadGeometryLoop(geometryIndex) {
        loadGeometry(content.geometry[geometryIndex], function(geometry) {
          contentLoaded.geometry[geometry.fileIdentifier] = geometry;
          contentRegions.geometry[geometryIndex] = geometry.fileIdentifier;
          assetLoadCount++;
          checkContentLoaded();
        });
      }

      // Load Geometry
      for (var geometryIndex in geometryIndexes) {
        loadGeometryLoop(geometryIndex);
      }

      if (loadTextures) {
        // EnvMap
        var canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var envMap = canvas.toDataURL('image/png');
        loadDataTexture(envMap, DEFAULT_CUBEMAP, function(textureData) {
          assetLoadCount++;
          checkContentLoaded();
        });

        function loadTextureLoop(textureIndex) {
          var texture = content.textures[textureIndex];
          loadTexture(texture, false, function(textureData) {
            contentRegions.textures[textureIndex] = textureData.referenceId;

            assetLoadCount++;
            checkContentLoaded();
          });
        }

        // Load Textures
        for (var textureIndex in textureIndexes) {
          loadTextureLoop(textureIndex);
        }

        function loadPlatedTexturesLoop(platedTextureIndex) {
          var platedTexture = content.plate_regions[platedTextureIndex];
          loadTexture(platedTexture, true, function(textureData) {
            contentRegions.platedTextures[platedTextureIndex] =
              textureData.referenceId;
            assetLoadCount++;
            checkContentLoaded();
          });
        }

        // Load Plated Textures
        for (var platedTextureIndex in platedTextureIndexes) {
          loadPlatedTexturesLoop(platedTextureIndex);
        }
      }

      return contentRegions;
    }

    // Check for when all content has loaded
    function checkContentLoaded() {
      if (assetLoadCount < assetLoadTotal) return;
      if (contentParsed) return;
      contentParsed = true;

      parseContent(contentLoaded);
    }

    function loadPart(url, onLoad) {
      var loader = new THREE.BungieNetLoader(this.manager);
      loader.load(
        url + (noCache ? '?' + new Date().getTime() : ''),
        null,
        function(response) {
          if (response instanceof ArrayBuffer)
            response = new Uint8Array(response);
          if (onLoad) onLoad(response);
        },
        onProgressCallback,
        onErrorCallback
      );
    }

    function loadGeometry(geometry, onLoad) {
      var url =
        contentpath +
        '/geometry/platform/' +
        platform +
        '/geometry/' +
        geometry;
      loadTGXBin(url, onLoad, onProgressCallback, onErrorCallback);
    }

    // Spasm.TGXBinLoader
    function loadTGXBin(url, onLoad) {
      loadPart(
        url,
        function(data) {
          var magic = utils.string(data, 0x0, 0x4); // TGXM
          var fileOffset = utils.uint(data, 0x8);
          var fileCount = utils.uint(data, 0xc);
          var fileIdentifier = utils.string(data, 0x10, 0x100);
          if (magic !== 'TGXM') {
            console.error('Invalid TGX File', url);
            return;
          }
          var files = [];
          var fileLookup = [];
          var renderMetadata = false;
          for (var f = 0; f < fileCount; f++) {
            var headerOffset = fileOffset + 0x110 * f;
            var name = utils.string(data, headerOffset, 0x100);
            var offset = utils.uint(data, headerOffset + 0x100);
            var type = utils.uint(data, headerOffset + 0x104);
            var size = utils.uint(data, headerOffset + 0x108);
            var fileData = data.slice(offset, offset + size);
            if (name.indexOf('.js') !== -1) {
              // render_metadata.js
              fileData = JSON.parse(utils.string(fileData));
              renderMetadata = fileData;
            }
            files.push({
              name: name,
              offset: offset,
              type: type,
              size: size,
              data: fileData
            });
            fileLookup.push(name);
          }
          var tgxBin = {
            url: url,
            fileIdentifier: fileIdentifier,
            files: files,
            lookup: fileLookup,
            metadata: renderMetadata
          };

          contentLoaded.tgxms[
            url.indexOf('.bin') !== -1 ? 'textures' : 'geometry'
          ][url.slice(url.lastIndexOf('/') + 1).split('.')[0]] = tgxBin;

          if (onLoad) onLoad(tgxBin);
        },
        onProgressCallback,
        onErrorCallback
      );
    }

    function loadDataTexture(textureUri, referenceId, onLoad, isPlated) {
      if (isPlated === undefined) isPlated = false;

      var contentId = isPlated ? 'platedTextures' : 'textures';

      if (contentLoaded[contentId][referenceId] !== undefined) {
        console.warn('CachedDataTexture[' + referenceId + ']', textureUri);
        if (onLoad) onLoad(contentLoaded[contentId][referenceId]);
        return;
      }

      var loader = new THREE.TextureLoader(this.manager);
      var textureData = loader.load(
        textureUri,
        function(texture) {
          if (onLoad) onLoad(texture);
        },
        onProgressCallback,
        onErrorCallback
      );

      textureData.flipY = false;
      textureData.minFilter = THREE.LinearMipMapLinearFilter;
      textureData.wrapS = THREE.RepeatWrapping;
      textureData.wrapT = THREE.RepeatWrapping;

      textureData.name = referenceId;
      textureData.src = textureUri;

      contentLoaded[contentId][referenceId] = {
        referenceId: referenceId,
        texture: textureData
      };
    }

    function loadTexture(texture, isPlated, onLoad) {
      if (isPlated === undefined) isPlated = false;
      var url =
        contentpath +
        '/geometry/platform/' +
        platform +
        '/' +
        (isPlated ? 'plated_textures' : 'textures') +
        '/' +
        texture;

      var referenceId = texture.split('.')[0];

      if (texture.indexOf('.bin') !== -1) {
        // Mobile texture
        loadTGXBin(url, function(tgxBin) {
          contentLoaded.mobileTextures[referenceId] = {
            url: url,
            referenceId: referenceId,
            fileIdentifier: tgxBin.fileIdentifier,
            texture: tgxBin.lookup
          };
          var count = 0;
          var total = tgxBin.files.length;

          function thisLoopFunction(fileIndex) {
            var textureFile = tgxBin.files[fileIndex];
            if (contentLoaded['textures'][textureFile.name] !== undefined) {
              count++;
              if (count === total && onLoad)
                onLoad(contentLoaded.mobileTextures[referenceId]);
              return;
            }
            var textureData = loadMobileTexture(textureFile, function() {
              count++;
              if (count === total && onLoad)
                onLoad(contentLoaded.mobileTextures[referenceId]);
            });
            textureData.name = textureFile.name;
            textureData.flipY = false;
            textureData.minFilter = THREE.LinearFilter;
            textureData.magFilter = THREE.LinearFilter;
            textureData.wrapS = THREE.RepeatWrapping;
            textureData.wrapT = THREE.RepeatWrapping;
            contentLoaded['textures'][textureFile.name] = {
              url: url,
              mobileReferenceId: referenceId,
              referenceId: textureFile.name,
              texture: textureData
            };
          }

          for (var i = 0; i < tgxBin.files.length; i++) {
            thisLoopFunction(i);
          }
        });
      } else {
        var contentId = isPlated ? 'platedTextures' : 'textures';
        if (contentLoaded[contentId][referenceId] !== undefined) {
          if (onLoad) onLoad(contentLoaded[contentId][referenceId]);
          return;
        }

        var loader = new THREE.TextureLoader(this.manager);
        var textureData = loader.load(
          url,
          function(texture) {
            if (onLoad) onLoad(texture);
          },
          onProgressCallback,
          onErrorCallback
        );
        textureData.name = referenceId;
        textureData.flipY = false;
        textureData.minFilter = THREE.LinearFilter;
        textureData.magFilter = THREE.LinearFilter;
        textureData.wrapS = THREE.RepeatWrapping;
        textureData.wrapT = THREE.RepeatWrapping;

        contentLoaded[contentId][referenceId] = {
          url: url,
          referenceId: referenceId,
          texture: textureData
        };
      }
    }

    function loadMobileTexture(textureFile, onLoad) {
      var isPng = utils.string(textureFile.data, 1, 3) === 'PNG';
      var mimeType = 'image/' + (isPng ? 'png' : 'jpeg');

      var urlCreator = window.URL || window.webkitURL;
      var imageUrl = urlCreator.createObjectURL(
        new Blob([textureFile.data], { type: mimeType })
      );

      var texture = new THREE.Texture();

      var image = new Image();
      image.onload = function() {
        texture.image = image;
        texture.needsUpdate = true;
        if (onLoad) onLoad(texture);
      };
      image.src = imageUrl;

      return texture;
    }

    function parseContent() {
      console.log('ContentLoaded', contentLoaded);

      // Set up THREE.Geometry and load skeleton (if any)
      geometry = new THREE.Geometry();
      geometry.bones = parseSkeleton();
      hasBones = geometry.bones.length > 0;

      var animation =
        hasBones && loadAnimation ? parseAnimation(geometry.bones) : false;

      // Set up default white material
      defaultMaterial = new THREE.MeshLambertMaterial({
        emissive: 0x444444,
        color: 0x777777,
        //shading: THREE.FlatShading,
        flatShading: true,
        side: THREE.DoubleSide,
        skinning: hasBones
      });
      defaultMaterial.name = 'DefaultMaterial';
      materials = [];
      if (!loadTextures) materials.push(defaultMaterial);

      vertexOffset = 0;
      for (var i = 0; i < contentLoaded.items.length; i++) {
        parseItem(contentLoaded.items[i]);
      }

      if (typeof onLoadCallback !== 'function') {
        console.warn('NoOnLoadCallback', geometry, materials, animation);
        return;
      }
      onLoadCallback(geometry, materials, animation ? [animation] : []);
    }

    function parseItem(item) {
      var gear = contentLoaded.gear[item.requestedId];
      var shaderGear = item.shaderHash
        ? contentLoaded.gear[item.shaderHash]
        : null;

      // TODO: Should iterate this, but its never has more than one
      var regionIndexSets = item.gearAsset.content[0].region_index_sets;
      var assetIndexSet = contentLoaded.regions[item.requestedId];

      console.log('ParseItem', item, assetIndexSet);

      // Figure out which geometry should be loaded ie class, gender
      var artContent = gear.art_content;
      var artContentSets = gear.art_content_sets;
      if (artContentSets && artContentSets.length > 1) {
        for (var r = 0; r < artContentSets.length; r++) {
          var artContentSet = artContentSets[r];
          if (artContentSet.classHash === classHash) {
            artContent = artContentSet.arrangement;
            break;
          }
        }
      } else if (artContentSets && artContentSets.length > 0) {
        artContent = artContentSets[0].arrangement;
      }

      console.log('ArtContent', artContent);

      var artRegionPatterns = [];

      if (artContent) {
        var gearSet = artContent.gear_set;
        var regions = gearSet.regions;
        if (regions.length > 0) {
          for (var u = 0; u < regions.length; u++) {
            var region = regions[u];

            if (region.pattern_list.length > 1) {
              console.warn('MultiPatternRegion[' + u + ']', region);
              // Weapon attachments?
            }

            for (var p = 0; p < region.pattern_list.length; p++) {
              var pattern = region.pattern_list[p];

              artRegionPatterns.push({
                hash: pattern.hash,
                artRegion: u,
                patternIndex: p,
                regionIndex: region.region_index,
                geometry: pattern.geometry_hashes
              });

              break;
            }
          }
        } else {
          var overrideArtArrangement = isFemale
            ? gearSet.female_override_art_arrangement
            : gearSet.base_art_arrangement;
          artRegionPatterns.push({
            hash: overrideArtArrangement.hash,
            artRegion: isFemale ? 'female' : 'male',
            patternIndex: -1,
            regionIndex: -1,
            geometry: overrideArtArrangement.geometry_hashes,
            textures: [] // TODO Implement this later
          });
        }
      }

      var geometryTextures = parseTextures(artRegionPatterns);

      var gearDyes = parseGearDyes(gear, shaderGear);

      // Compress geometry into a single THREE.Geometry
      for (var a = 0; a < artRegionPatterns.length; a++) {
        var artRegionPattern = artRegionPatterns[a];

        var skipRegion = false;
        switch (artRegionPattern.regionIndex) {
          case -1: // armor (no region)
          case 0: // weapon grip
          case 1: // weapon body
          //case 2: // Khvostov 7G-0X?
          case 3: // weapon scope
          case 4: // weapon stock/scope?
          case 5: // weapon magazine
          case 6: // weapon ammo (machine guns)

          case 8: // ship helm
          case 9: // ship guns
          case 10: // ship casing
          case 11: // ship engine
          case 12: // ship body
            break;

          case 21: // hud
            //skipRegion = true;
            break;

          case 22: // sparrow wings
          case 23: // sparrow body

          case 24: // ghost shell casing
          case 25: // ghost shell body
          case 26: // ghost shell cube?
            break;
          default:
            console.warn(
              'UnknownArtRegion[' + a + ']',
              artRegionPattern.regionIndex
            );
            skipRegion = true;
            break;
        }
        if (skipRegion) continue;

        console.log('ArtRegion[' + a + ']', artRegionPattern);

        for (var g = 0; g < artRegionPattern.geometry.length; g++) {
          var geometryHash = artRegionPattern.geometry[g];
          var tgxBin = contentLoaded.geometry[geometryHash];

          if (tgxBin === undefined) {
            console.warn('MissingGeometry[' + g + ']', geometryHash);
            continue;
          }

          parseGeometry(geometryHash, geometryTextures, gearDyes);
        }
      }
    }

    //function parseTextures(geometryHashes) {
    function parseTextures(artRegionPatterns) {
      var canvas, ctx;
      var canvasPlates = {};
      var geometryTextures = [];

      for (var a = 0; a < artRegionPatterns.length; a++) {
        var artRegionPattern = artRegionPatterns[a];

        for (var g = 0; g < artRegionPattern.geometry.length; g++) {
          var geometryHash = artRegionPattern.geometry[g];

          var tgxBin = contentLoaded.geometry[geometryHash];

          if (!tgxBin) {
            console.warn('MissingTGXBinGeometry[' + g + ']', geometryHash);
            continue;
          }

          var metadata = tgxBin.metadata;
          var texturePlates = metadata.texture_plates;

          // Spasm.TGXAssetLoader.prototype.getGearRenderableModel
          if (texturePlates.length === 1) {
            var texturePlate = texturePlates[0];
            var texturePlateSet = texturePlate.plate_set;

            // Stitch together plate sets
            // Web versions are pre-stitched

            for (var texturePlateId in texturePlateSet) {
              var texturePlate = texturePlateSet[texturePlateId];
              var texturePlateRef =
                texturePlateId + '_' + texturePlate.plate_index;

              var textureId = texturePlateId;
              switch (texturePlateId) {
                case 'diffuse':
                  textureId = 'map';
                  break;
                case 'normal':
                  textureId = 'normalMap';
                  break;
                case 'gearstack':
                  textureId = 'gearstackMap';
                  break;
                default:
                  console.warn(
                    'UnknownTexturePlateId',
                    texturePlateId,
                    texturePlateSet
                  );
                  break;
              }

              // Web version uses pre-plated textures
              var platedTexture =
                contentLoaded.platedTextures[texturePlate.reference_id];
              var scale = 1;

              if (platedTexture) {
                scale =
                  platedTexture.texture.image.width /
                  texturePlate.plate_size[0];
              }

              var canvasPlate = canvasPlates[texturePlateRef];
              if (!canvasPlate) {
                canvas = document.createElement('canvas');
                canvas.width = texturePlate.plate_size[0];
                canvas.height = texturePlate.plate_size[1];
                ctx = canvas.getContext('2d');

                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#FFFFFF';
                canvasPlate = {
                  plateId: texturePlateId,
                  textureId: textureId,
                  canvas: canvas,
                  hashes: []
                };
                canvasPlates[texturePlateRef] = canvasPlate;
              }
              canvas = canvasPlate.canvas;
              ctx = canvas.getContext('2d');
              if (canvasPlate.hashes.indexOf(geometryHash) === -1)
                canvasPlate.hashes.push(geometryHash);

              for (var p = 0; p < texturePlate.texture_placements.length; p++) {
                var placement = texturePlate.texture_placements[p];
                var placementTexture =
                  contentLoaded.textures[placement.texture_tag_name];

                // Actually it looks like the alpha channel is being used for masking
                ctx.clearRect(
                  placement.position_x * scale,
                  placement.position_y * scale,
                  placement.texture_size_x * scale,
                  placement.texture_size_y * scale
                );

                if (platedTexture) {
                  ctx.drawImage(
                    platedTexture.texture.image,
                    placement.position_x * scale,
                    placement.position_y * scale,
                    placement.texture_size_x * scale,
                    placement.texture_size_y * scale,
                    placement.position_x * scale,
                    placement.position_y * scale,
                    placement.texture_size_x * scale,
                    placement.texture_size_y * scale
                  );
                } else {
                  // Should be fixed, but add these checks in case
                  if (!placementTexture) {
                    console.warn(
                      'MissingPlacementTexture',
                      placement.texture_tag_name,
                      contentLoaded.textures
                    );
                    continue;
                  }
                  if (!placementTexture.texture.image) {
                    console.warn('TextureNotLoaded', placementTexture);
                    continue;
                  }
                  ctx.drawImage(
                    placementTexture.texture.image,
                    placement.position_x,
                    placement.position_y,
                    placement.texture_size_x,
                    placement.texture_size_y
                  );
                }
              }
            }
          } else if (texturePlates.length > 1) {
            console.warn('MultipleTexturePlates?', texturePlates);
          }
        }
      }

      for (var canvasPlateId in canvasPlates) {
        var canvasPlate = canvasPlates[canvasPlateId];
        var dataUrl = canvasPlate.canvas.toDataURL('image/png');
        loadDataTexture(dataUrl, canvasPlateId, null, true);
        for (var i = 0; i < canvasPlate.hashes.length; i++) {
          var geometryHash = canvasPlate.hashes[i];
          if (geometryTextures[geometryHash] === undefined) {
            geometryTextures[geometryHash] = {};
          }
          if (
            geometryTextures[geometryHash][canvasPlate.textureId] !== undefined
          ) {
            console.warn(
              'OverridingTexturePlate[' +
                geometryHash +
                ':' +
                canvasPlate.textureId +
                ']',
              geometryTextures[geometryHash][canvasPlate.textureId]
            );
            continue;
          }
          var texture = contentLoaded.platedTextures[canvasPlateId].texture;
          geometryTextures[geometryHash][canvasPlate.textureId] = texture;
        }
      }

      return geometryTextures;
    }

    function checkRenderPart(part) {
      var shouldRender = false;

      // Spasm was checking the lod category name for zeros which was very inefficient.
      // This implementation checks the lod category value and then further checks against
      // the part flags before filtering out geometry.
      switch (part.lodCategory.value) {
        case 0: // Main Geometry
        case 1: // Grip/Stock
        case 2: // Stickers
        case 3: // Internal/Hidden Geometry?
          //case 8: // Grip/Stock/Scope
          //if (!(part.flags & 0x30)) {
          shouldRender = true;
          //}
          break;
        case 4: // LOD 1: Low poly geometries
        case 7: // LOD 2: Low poly geometries
        case 8: // HUD / Low poly geometries
        case 9: // LOD 3: Low poly geometries
          shouldRender = false;
          break;
        default:
          console.warn('SkippedRenderMeshPart', part.lodCategory, part);
          break;
      }

      switch (part.shader ? part.shader.type : 7) {
        case -1:
          shouldRender = false;
          break;
      }

      return shouldRender;
    }

    function parseGeometry(geometryHash, geometryTextures, gearDyes) {
      var tgxBin = contentLoaded.geometry[geometryHash];
      var renderMeshes = parseTGXAsset(tgxBin, geometryHash);

      var gearDyeSlotOffsets = [];

      if (loadTextures) {
        for (var i = 0; i < gearDyes.length; i++) {
          var gearDye = gearDyes[i];

          gearDyeSlotOffsets.push(materials.length);

          // Create a material for both primary and secondary color variants
          for (var j = 0; j < 2; j++) {
            var materialParams = {
              game: game,
              skinning: hasBones,
              usePrimaryColor: j === 0,
              envMap: null
            };
            for (var textureId in geometryTextures[geometryHash]) {
              var texture = geometryTextures[geometryHash][textureId];

              materialParams[textureId] = texture;
            }

            copyGearDyeParams(gearDye, materialParams);

            var material = new THREE.TGXMaterial(materialParams);
            //var material = new THREE.MeshPhongMaterial(materialParams);
            material.name =
              geometryHash + '-' + (j === 0 ? 'Primary' : 'Secondary') + i;
            materials.push(material);
          }
        }
      }

      for (var m = 0; m < renderMeshes.length; m++) {
        var renderMesh = renderMeshes[m];
        var indexBuffer = renderMesh.indexBuffer;
        var vertexBuffer = renderMesh.vertexBuffer;
        var positionOffset = renderMesh.positionOffset;
        var positionScale = renderMesh.positionScale;
        var texcoord0ScaleOffset = renderMesh.texcoord0ScaleOffset;
        var texcoordOffset = renderMesh.texcoordOffset;
        var texcoordScale = renderMesh.texcoordScale;
        var parts = renderMesh.parts;

        if (parts.length === 0) {
          console.log(
            'Skipped RenderMesh[' + geometryHash + ':' + m + ']: No parts'
          );
          continue;
        } // Skip meshes with no parts

        // Spasm.Renderable.prototype.render
        var partCount = -1;
        for (var p = 0; p < parts.length; p++) {
          var part = parts[p];

          if (!checkRenderPart(part)) continue;

          console.log(
            'RenderMeshPart[' + geometryHash + ':' + m + ':' + p + ']',
            part
          );
          partCount++;

          var gearDyeSlot = part.gearDyeSlot;

          if (gearDyeSlotOffsets[gearDyeSlot] === undefined) {
            console.warn('MissingDefaultDyeSlot', gearDyeSlot);
            gearDyeSlot = 0;
          }
          var materialIndex =
            gearDyeSlotOffsets[gearDyeSlot] + (part.usePrimaryColor ? 0 : 1);

          // Load Material
          if (loadTextures) {
            var textures = geometryTextures[geometryHash];
            var material = parseMaterial(part, gearDyes[gearDyeSlot], textures);

            if (material) {
              material.name = geometryHash + '-CustomShader' + m + '-' + p;
              materials.push(material);
              materialIndex = materials.length - 1;
            }
          }

          // Load Vertex Stream
          var increment = 3;
          var start = part.indexStart;
          var count = part.indexCount;

          // PrimitiveType, 3=TRIANGLES, 5=TRIANGLE_STRIP
          // https://stackoverflow.com/questions/3485034/convert-triangle-strips-to-triangles

          if (part.primitiveType === 5) {
            increment = 1;
            count -= 2;
          }

          for (var i = 0; i < count; i += increment) {
            var faceVertexNormals = [];
            var faceVertexUvs = [];
            var faceVertex = [];

            var faceColors = [];

            var detailVertexUvs = [];

            var faceIndex = start + i;

            var tri = part.primitiveType === 3 || i & 1 ? [0, 1, 2] : [2, 1, 0];

            for (var j = 0; j < 3; j++) {
              var index = indexBuffer[faceIndex + tri[j]];
              var vertex = vertexBuffer[index];
              if (!vertex) {
                // Verona Mesh
                console.warn('MissingVertex[' + index + ']');
                i = count;
                break;
              }
              var normal = vertex.normal0;
              var uv = vertex.texcoord0;
              var color = vertex.color0;

              var detailUv = vertex.texcoord2;
              if (!detailUv) detailUv = [0, 0];

              faceVertex.push(index + vertexOffset);
              faceVertexNormals.push(
                new THREE.Vector3(-normal[0], -normal[1], -normal[2])
              );

              var uvu = uv[0] * texcoordScale[0] + texcoordOffset[0];
              var uvv = uv[1] * texcoordScale[1] + texcoordOffset[1];
              faceVertexUvs.push(new THREE.Vector2(uvu, uvv));

              if (color) {
                faceColors.push(new THREE.Color(color[0], color[1], color[2]));
              }

              detailVertexUvs.push(
                new THREE.Vector2(uvu * detailUv[0], uvv * detailUv[1])
              );
            }
            var face = new THREE.Face3(
              faceVertex[0],
              faceVertex[1],
              faceVertex[2],
              faceVertexNormals
            );
            face.materialIndex = materialIndex;
            if (faceColors.length > 0) face.vertexColors = faceColors;
            geometry.faces.push(face);
            geometry.faceVertexUvs[0].push(faceVertexUvs);

            if (geometry.faceVertexUvs.length < 2)
              geometry.faceVertexUvs.push([]);
          }
        }

        for (var v = 0; v < vertexBuffer.length; v++) {
          var vertex = vertexBuffer[v];
          var position = vertex.position0;
          var x = position[0];
          var y = position[1];
          var z = position[2];

          if (platform === 'web') {
            // Ignored on mobile?
            x = x * positionScale[0] + positionOffset[0];
            y = y * positionScale[1] + positionOffset[1];
            z = z * positionScale[2] + positionOffset[2];
          }

          geometry.vertices.push(new THREE.Vector3(x, y, z));

          // Set bone weights
          var boneIndex = position[3];

          var blendIndices = vertex.blendindices0
            ? vertex.blendindices0
            : [boneIndex, 255, 255, 255];
          var blendWeights = vertex.blendweight0
            ? vertex.blendweight0
            : [1, 0, 0, 0];

          var skinIndex = [0, 0, 0, 0];
          var skinWeight = [0, 0, 0, 0];

          var totalWeights = 0;
          for (var w = 0; w < blendIndices.length; w++) {
            if (blendIndices[w] === 255) break;
            skinIndex[w] = blendIndices[w];
            skinWeight[w] = blendWeights[w];
            totalWeights += blendWeights[w] * 255;
          }
          if (totalWeights !== 255)
            console.error('MissingBoneWeight', 255 - totalWeights, i, j);

          geometry.skinIndices.push(new THREE.Vector4().fromArray(skinIndex));
          geometry.skinWeights.push(new THREE.Vector4().fromArray(skinWeight));
          //geometry.skinIndices[index+vertexOffset].fromArray(skinIndex);
          //geometry.skinWeights[index+vertexOffset].fromArray(skinWeight);
        }
        vertexOffset += vertexBuffer.length;
      }
    }

    function copyGearDyeParams(gearDye, materialParams) {
      for (var dyeKey in gearDye) {
        var paramKey = dyeKey;
        var dyeTexture = false;
        switch (dyeKey) {
          case 'hash':
          case 'investmentHash':
          case 'slotTypeIndex':
          case 'variant':
            paramKey = '';
            break;
          case 'diffuse':
            paramKey = 'detailMap';
            dyeTexture = true;
            break;
          case 'normal':
            paramKey = 'detailNormalMap';
            dyeTexture = true;
            break;
          case 'decal':
            paramKey = 'detailDecalMap';
            dyeTexture = true;
            break;

          case 'primaryDiffuse':
            paramKey = 'primaryDetailMap';
            dyeTexture = true;
            break;
          case 'secondaryDiffuse':
            paramKey = 'secondaryDetailMap';
            dyeTexture = true;
            break;
        }
        if (paramKey) {
          materialParams[paramKey] = gearDye[dyeKey];
        }
      }
    }

    function parseMaterial(part, gearDye, geometryTextures) {
      var materialParams = {
        game: game,
        skinning: hasBones,
        envMap: null,
        usePrimaryColor: part.usePrimaryColor
      };

      var textureLookup = [];

      // Use these for debugging
      var color = 0x333333;
      var emissive = new THREE.Color(
        Math.random(),
        Math.random(),
        Math.random()
      );

      if (part.variantShaderIndex !== -1)
        console.warn(
          'VariantShaderPresent[' + part.variantShaderIndex + ']',
          part
        );

      var textures = {
        map: null,
        normalMap: null,
        gearstackMap: null,
        envMap: null
      };

      for (var textureId in geometryTextures) {
        textures[textureId] = geometryTextures[textureId];
      }

      if (part.shader) {
        var shader = part.shader;
        var staticTextureIds = shader.staticTextures
          ? shader.staticTextures
          : [];
        var staticTextureCount = staticTextureIds.length;

        copyGearDyeParams(gearDye, materialParams);

        if (part.flags & 0x8) {
          materialParams.useAlphaTest = true;
          console.warn('AlphaTest', part, gearDye);
        }

        if (part.flags & ~(0x8 | 0x10 | 0x5)) {
          console.warn('UnknownFlags', part.flags);
        }

        // Worldline Zero hack fix
        if (
          materialParams.primaryColor.r === 1 &&
          materialParams.primaryColor.g === 0 &&
          materialParams.primaryColor.b === 0
        ) {
          materialParams.useDye = false;
          materialParams.useAlphaTest = false;
        }

        for (var i = 0; i < staticTextureIds.length; i++) {
          var staticTextureId = staticTextureIds[i];
          var staticTextureContent = contentLoaded.textures[staticTextureId];
          if (!staticTextureContent) {
            console.warn('MissingTexture[' + staticTextureId + ']');
            //continue;
          }
          var staticTexture = staticTextureContent
            ? staticTextureContent.texture
            : null;
          logTexture(
            'staticTexture' +
              i +
              (textureLookup[i] !== undefined
                ? '[' + textureLookup[i] + ']'
                : ''),
            staticTexture
          );
        }

        var skipShader = false;

        switch (shader.type) {
          case 7:
            for (var textureId in textures) {
              materialParams[textureId] = textures[textureId];
            }

            if (staticTextureIds.length > 0) {
              console.warn('StaticTexturesFound', staticTextureIds);
            }

            if (part.flags & 0x10) {
              switch (staticTextureIds.length) {
                case 1:
                  textureLookup.push('cubeMap');
                  break;
                case 3:
                  materialParams.map = null;
                  materialParams.normalMap = null;
                  materialParams.gearstackMap = null;
                  textureLookup.push('map');
                  textureLookup.push('map2');
                  textureLookup.push('cubeMap');
                  break;
              }

              for (var i = 0; i < textureLookup.length; i++) {
                var textureId = textureLookup[i];

                var staticTextureId = staticTextureIds[i];
                var staticTextureContent =
                  contentLoaded.textures[staticTextureId];

                console.warn(
                  textureId + 'Texture',
                  staticTextureContent
                    ? staticTextureContent.referenceId
                    : staticTextureContent
                );
              }
            }
            break;
          default:
            console.warn('UnknownShader', shader, part, gearDye);
            skipShader = true;
            break;
        }

        if (!skipShader) {
          for (var i = 0; i < textureLookup.length; i++) {
            var textureId = textureLookup[i];
            var staticTextureId = staticTextureIds[i];
            var staticTextureContent = contentLoaded.textures[staticTextureId];
            if (!staticTextureContent) {
              console.warn('MissingTexture[' + staticTextureId + ']');
              //continue;
            }
            var staticTexture = staticTextureContent
              ? staticTextureContent.texture
              : null;
            switch (textureId) {
              case 'alphaMap':
                materialParams.transparent = true;
                break;
              case 'cubeMap':
                staticTexture = loadCubeTexture(staticTexture);
                textureId = 'envMap';
                break;
            }
            materialParams[textureId] = staticTexture;
          }

          return new THREE.TGXMaterial(materialParams);
        }
      } else {
        console.warn('NoShader', part);
      }

      return false;
    }

    function parseMaterialOld(part, gearDye, textures) {
      var materialParams = {
        game: game,
        side: THREE.DoubleSide,
        skinning: hasBones,
        envMap: null,
        usePrimaryColor: part.usePrimaryColor,
        useAlphaTest: (part.flags & 0x8) !== 0
      };

      if (part.variantShaderIndex !== -1)
        console.warn(
          'VariantShaderPresent[' + part.variantShaderIndex + ']',
          part
        );

      if (!textures) {
        textures = {
          map: null,
          normalMap: null,
          gearstackMap: null,
          envMap: null
        };
      }

      if (textures.envMap === undefined) textures.envMap = null;

      if (part.shader) {
        var shader = part.shader;
        var staticTextureIds = shader.staticTextures
          ? shader.staticTextures
          : [];
        var staticTextureCount = staticTextureIds.length;

        // Use these for debugging
        var color = 0x333333;
        var emissive = new THREE.Color(
          Math.random(),
          Math.random(),
          Math.random()
        );

        var override = false;
        var log = false;
        var textureLookup = [];

        console.log(
          'Shader',
          shader,
          utils.bits(part.flags, 16) + ' (' + part.flags + ')',
          'LOD Category',
          part.lodCategory
        );

        copyGearDyeParams(gearDye, materialParams);

        if (part.flags & 0x8) {
          materialParams.useAlphaTest = true;
        }

        log = true;

        switch (shader.type) {
          case 7:
            if ((part.flags & 0x20) | 0x40) {
              // Decal
              switch (staticTextureCount) {
                case 1:
                  materialParams.useDecal = true;
                  textureLookup.push('map');
                  break;
              }
            } else if (part.flags & 0x10) {
              // Glow Decal?
              materialParams.useDecal = true;
              materialParams.color = color;
              materialParams.emissive = emissive;
            } else {
              switch (staticTextureCount) {
                case 1:
                  break;
                case 3:
                  textureLookup.push('map');
                  textureLookup.push('gearstackMap');
                  textureLookup.push('normalMap');
                  materialParams.useDetail = false;
                  break;
                case 5:
                  textureLookup.push('map');
                  textureLookup.push('detailMap');
                  textureLookup.push('normalMap');
                  textureLookup.push('detailNormalMap');
                  textureLookup.push('scratchMap');
                  break;
              }
            }
            break;
        }

        if (!debugMode) {
          log = false;
          override = false;
        }

        if (log) {
          console.log(
            'ParseMaterial',
            '\n\tPart:',
            part,
            '\n\tFlags:',
            utils.bits(part.flags, 16) + ' (' + part.flags + ')',
            '\n\tLOD:',
            part.lodCategory,
            '\n\tShader:',
            part.shader,
            '\n\tGearDye:',
            gearDye,
            '\n\tTextures:',
            textures
          );
          logColors([
            gearDye.primaryColor,
            gearDye.secondaryColor,
            gearDye.wearColor
          ]);

          for (var i = 0; i < staticTextureIds.length; i++) {
            var staticTextureId = staticTextureIds[i];
            var staticTextureContent = contentLoaded.textures[staticTextureId];
            if (!staticTextureContent) {
              console.warn('MissingTexture[' + staticTextureId + ']');
              //continue;
            }
            var staticTexture = staticTextureContent
              ? staticTextureContent.texture
              : null;
            logTexture(
              'staticTexture' +
                i +
                (textureLookup[i] !== undefined
                  ? '[' + textureLookup[i] + ']'
                  : ''),
              staticTexture
            );
          }
        }

        for (var i = 0; i < textureLookup.length; i++) {
          var textureId = textureLookup[i];
          var staticTextureId = staticTextureIds[i];
          var staticTextureContent = contentLoaded.textures[staticTextureId];
          if (!staticTextureContent) {
            console.warn('MissingTexture[' + staticTextureId + ']');
            //continue;
          }
          var staticTexture = staticTextureContent
            ? staticTextureContent.texture
            : null;
          switch (textureId) {
            case 'alphaMap':
              materialParams.transparent = true;
              break;
            case 'cubeMap':
              staticTexture = loadCubeTexture(staticTexture);
              textureId = 'envMap';
              break;
          }
          materialParams[textureId] = staticTexture;
        }

        console.log(
          'MaterialParamsAlphaTest',
          materialParams.useAlphaTest,
          part
        );

        return new THREE.TGXMaterial(materialParams);
      } else {
        console.warn('NoShader', part);
      }
      return false;
    }

    function loadCubeTexture(texture) {
      var textureId = (texture ? texture.name : 'null') + '__';
      if (contentLoaded.textures[textureId] !== undefined) {
        return contentLoaded.textures[textureId].texture;
      }

      var loader = new THREE.CubeTextureLoader();

      var cubeWidth = 256;
      var cubeHeight = 256;

      var canvas = document.createElement('canvas');
      if (texture) {
        cubeWidth = texture.image.width / 4;
        cubeHeight = texture.image.height / 3;
      }
      var cubeSize = Math.floor(cubeWidth / 4) * 4;
      canvas.width = cubeSize;
      canvas.height = cubeSize;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, cubeSize, cubeSize);
      var offsets = [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2]];
      var images = [];
      for (var i = 0; i < offsets.length; i++) {
        var offset = offsets[i];
        if (texture) {
          ctx.drawImage(
            texture.image,
            offset[0] * cubeWidth,
            offset[1] * cubeHeight,
            cubeWidth,
            cubeHeight,
            0,
            0,
            cubeSize,
            cubeSize
          );
        }
        var cubeFace = canvas.toDataURL('image/png');
        images.push(cubeFace);
      }

      var cubeTexture = loader.load(images);
      cubeTexture.name = textureId;
      contentLoaded.textures[textureId] = {
        referenceId: textureId,
        texture: cubeTexture
      };

      return cubeTexture;
    }

    function logTexture(textureId, texture) {
      var src = null;
      var logName = '';
      if (texture) {
        src = texture.image ? texture.image.src : texture.src;
        logName =
          texture.name + (src && src.indexOf('blob') !== -1 ? ' ' + src : '');
      }

      console.log('\t' + textureId + ': ' + logName);

      if (src && src.indexOf('blob') !== -1) {
        var canvas = document.createElement('canvas');
        canvas.width = texture.image.width;
        canvas.height = texture.image.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
        src = canvas.toDataURL('image/png');
      }

      if (src) logImageSrc(src);
    }

    function logImageSrc(src) {
      console.log(
        '\t\t' + '%c  ',
        'font-size: 50px; background: url("' +
          src +
          '") center no-repeat; background-size: contain; border: 1px solid;'
      );
    }

    function logColors(colors) {
      var format = [];
      var args = [];
      for (var i = 0; i < colors.length; i++) {
        var color = colors[i];
        if (!color) continue;
        color = new THREE.Color(color);
        format.push('%c #' + color.getHexString());
        args.push('border-left: 14px solid #' + color.getHexString() + ';');
      }
      console.log.apply(null, [format.join(' ')].concat(args));
    }

    // Spasm.Skeleton.prototype.onLoadSkeletonSuccess
    // TODO Fix bone loading
    function parseSkeleton() {
      var bones = [];
      var absBones = [];
      if (contentLoaded.skeleton) {
        var definition = contentLoaded.skeleton.definition;
        var inverseTransforms =
          definition.default_inverse_object_space_transforms;
        var transforms = definition.default_object_space_transforms;
        var nodes = definition.nodes;

        for (var n = 0; n < nodes.length; n++) {
          var node = nodes[n];
          var inverseTransform = inverseTransforms[n];
          var transform = transforms[n];

          var offset = transform.offset;
          var origin = transform.origin || [0, 0, 0]; // ts[0-2];
          var r = transform.r || [0, 0, 0, 1];
          var s = transform.scale || 1; // ts[3];
          var parentNode = bones[node.parent_node_index];

          var pos = new THREE.Vector3(origin[0], origin[1], origin[2]);
          var scale = new THREE.Vector3(s, s, s);
          var rotq = new THREE.Quaternion(r[0], r[1], r[2], r[3]);
          var euler = new THREE.Euler().setFromQuaternion(rotq);

          euler.set(0, 0, 0);
          rotq.setFromEuler(euler);

          var absPos = new THREE.Vector3(pos.x, pos.y, pos.z);
          var absRotq = new THREE.Quaternion(rotq.x, rotq.y, rotq.z, rotq.w);
          var absEuler = new THREE.Euler().setFromQuaternion(absRotq);

          var absScale = new THREE.Vector3(scale.x, scale.y, scale.z);

          if (parentNode) {
            absPos.x -= parentNode.pos[0];
            absPos.y -= parentNode.pos[1];
            absPos.z -= parentNode.pos[2];

            var parentRotq = new THREE.Quaternion().fromArray(parentNode.rotq);
            var parentEuler = new THREE.Euler().setFromQuaternion(parentRotq);

            absEuler.x -= parentEuler.x;
            absEuler.y -= parentEuler.y;
            absEuler.z -= parentEuler.z;

            absRotq = absRotq.multiply(parentRotq.inverse());
          }

          if (n <= -1)
            console.log(
              'Bone[' + n + ']',
              node.name.string + ':' + node.name.hash,
              node.parent_node_index,
              '\n' + 'pos: ' + pos.x + ', ' + pos.y + ', ' + pos.z,
              '\n' + 'apos: ' + absPos.x + ', ' + absPos.y + ', ' + absPos.z,
              '\n' +
                'rot: ' +
                Math.round(utils.radianToDegrees(euler.x)) +
                ', ' +
                Math.round(utils.radianToDegrees(euler.y)) +
                ', ' +
                Math.round(utils.radianToDegrees(euler.z)),
              '\n' +
                'arot: ' +
                Math.round(utils.radianToDegrees(absEuler.x)) +
                ', ' +
                Math.round(utils.radianToDegrees(absEuler.y)) +
                ', ' +
                Math.round(utils.radianToDegrees(absEuler.z)),

              '\n' + 'scale: ' + scale.x + ', ' + scale.y + ', ' + scale.z
            );

          bones.push({
            parent: node.parent_node_index,
            nodeHash: node.name.hash,
            name: node.name.string,
            pos: pos.toArray(),
            rotq: rotq.toArray(),
            scl: scale.toArray()
          });
          absBones.push({
            parent: node.parent_node_index,
            nodeHash: node.name.hash,
            name: node.name.string,
            pos: absPos.toArray(),
            rotq: absRotq.toArray(),
            scl: absScale.toArray()
          });
        }
      }
      return absBones;
    }

    function parseAnimation(bones) {
      console.log('Animation[' + animationPath + ']', contentLoaded.animations);
      var animation = contentLoaded.animations[0];

      var animRate = 30;
      var animLength = animation.duration_in_frames / animRate;

      var staticBoneData = animation.static_bone_data;
      var staticScaleControlMap = staticBoneData.scale_control_map;
      var staticRotationControlMap = staticBoneData.rotation_control_map;
      var staticTranslationControlMap = staticBoneData.translation_control_map;
      var staticTransforms =
        staticBoneData.transform_stream_header.streams.frames[0];

      var staticScales = staticTransforms.scales;
      var staticRotations = staticTransforms.rotations;
      var staticTranslations = staticTransforms.translations;

      var animatedBoneData = animation.animated_bone_data;
      var animatedScaleControlMap = animatedBoneData.scale_control_map;
      var animatedRotationControlMap = animatedBoneData.rotation_control_map;
      var animatedTranslationControlMap =
        animatedBoneData.translation_control_map;
      var animatedTransformFrames =
        animatedBoneData.transform_stream_header.streams.frames;

      var hierarchy = [];

      for (var i = 0; i < animation.frame_count; i++) {
        var animatedTransforms = animatedTransformFrames[i];
        var animatedScales = animatedTransforms.scales;
        var animatedRotations = animatedTransforms.rotations;
        var animatedTranslations = animatedTransforms.translations;

        for (var j = 0; j < animation.node_count; j++) {
          var staticScaleIndex = staticScaleControlMap.indexOf(j);
          var staticRotationIndex = staticRotationControlMap.indexOf(j);
          var staticTranslationIndex = staticTranslationControlMap.indexOf(j);

          var animatedScaleIndex = animatedScaleControlMap.indexOf(j);
          var animatedRotationIndex = animatedRotationControlMap.indexOf(j);
          var animatedTranslationIndex = animatedTranslationControlMap.indexOf(
            j
          );

          var scale =
            staticScaleIndex >= 0
              ? staticScales[staticScaleIndex]
              : animatedScales[animatedScaleIndex];
          var rotation =
            staticRotationIndex >= 0
              ? staticRotations[staticRotationIndex]
              : animatedRotations[animatedRotationIndex];
          var translation =
            staticTranslationIndex >= 0
              ? staticTranslations[staticTranslationIndex]
              : animatedTranslations[animatedTranslationIndex];

          var bone = bones[j];

          if (i === 0) {
            hierarchy.push({
              parent: bone.parent,
              name: bone.name,
              keys: []
            });
          }
          var node = hierarchy[j];
          node.keys.push({
            time: i / animRate,
            pos: translation,
            rot: rotation,
            scl: [scale, scale, scale]
          });
        }
        //break;
      }

      return {
        name: animationPath.split('.js')[0],
        fps: animRate,
        length: animLength,
        hierarchy: hierarchy
      };
    }

    // Spasm.TGXAssetLoader.prototype.getGearDyes
    function getGearDyes(gear) {
      var dyeGroups = {
        customDyes: gear.custom_dyes || [],
        defaultDyes: gear.default_dyes || [],
        lockedDyes: gear.locked_dyes || []
      };

      var gearDyeGroups = {};

      for (var dyeType in dyeGroups) {
        var dyes = dyeGroups[dyeType];
        var gearDyes = [];
        for (var i = 0; i < dyes.length; i++) {
          var dye = dyes[i];
          var dyeTextures = dye.textures;
          var materialProperties = dye.material_properties;
          console.log('GearDye[' + dyeType + '][' + i + ']', dye);

          var gearDyeTextures = {};

          for (var dyeTextureId in dyeTextures) {
            var dyeTexture = dyeTextures[dyeTextureId];

            if (
              dyeTexture.reference_id &&
              contentLoaded.textures[dyeTexture.reference_id] !== undefined
            ) {
              gearDyeTextures[dyeTextureId] =
                contentLoaded.textures[dyeTexture.reference_id];
            } else if (
              dyeTexture.name &&
              contentLoaded.textures[dyeTexture.name] !== undefined
            ) {
              gearDyeTextures[dyeTextureId] =
                contentLoaded.textures[dyeTexture.name];
            }
          }

          // Spasm.GearDye
          var gearDye = {
            //identifier: dye.identifier, // Doesn't exist?
            hash: dye.hash,
            investmentHash: dye.investment_hash,
            slotTypeIndex: dye.slot_type_index,

            diffuse: gearDyeTextures.diffuse
              ? gearDyeTextures.diffuse.texture
              : null,
            normal: gearDyeTextures.normal
              ? gearDyeTextures.normal.texture
              : null,
            decal: gearDyeTextures.decal ? gearDyeTextures.decal.texture : null,

            primaryDiffuse: gearDyeTextures.primary_diffuse
              ? gearDyeTextures.primary_diffuse.texture
              : null,

            secondaryDiffuse: gearDyeTextures.secondary_diffuse
              ? gearDyeTextures.secondary_diffuse.texture
              : null,

            isCloth: dye.cloth
          };

          var dyeMat = dye.material_properties;

          switch (game) {
            case 'destiny':
              gearDye.dyeVariant = dye.variant;
              gearDye.dyeBlendMode = dye.blend_mode;

              gearDye.primaryColor = new THREE.Color().fromArray(
                dyeMat.primary_color
              );
              gearDye.secondaryColor = new THREE.Color().fromArray(
                dyeMat.secondary_color
              );

              gearDye.decalAlphaMapTransform = dyeMat.decal_alpha_map_transform;
              gearDye.decalBlendOption = dyeMat.decal_blend_option;

              gearDye.detailNormalContributionStrength =
                dyeMat.detail_normal_contribution_strength;
              gearDye.detailTransform = dyeMat.detail_transform;
              gearDye.specularProperties = dyeMat.specular_properties;
              gearDye.subsurfaceScatteringStrength =
                dyeMat.subsurface_scattering_strength;

              logColors([gearDye.primaryColor, gearDye.secondaryColor]);
              break;
            case 'destiny2':
              gearDye.primaryColor = new THREE.Color().fromArray(
                dyeMat.primary_albedo_tint
              );
              // primary_material_params
              gearDye.secondaryColor = new THREE.Color().fromArray(
                dyeMat.secondary_albedo_tint
              );
              // secondary_material_params
              gearDye.wornColor = new THREE.Color().fromArray(
                dyeMat.worn_albedo_tint
              );
              // worn_material_parameters

              var spec = dyeMat.specular_properties;
              console.log('MatSpecularParams', dyeMat.specular_properties);

              gearDye.detailDiffuseTransform = dyeMat.detail_diffuse_transform;
              gearDye.detailNormalTransform = dyeMat.detail_normal_transform;

              gearDye.primaryParams = dyeMat.primary_material_params;
              gearDye.secondaryParams = dyeMat.secondary_material_params;
              gearDye.wornParams = dyeMat.worn_material_parameters;

              console.warn(
                'PrimaryMatParams',
                dyeMat.primary_material_params,
                dyeMat.primary_material_advanced_params
              );
              console.warn(
                'SecondaryMatParams',
                dyeMat.secondary_material_params
              );
              console.warn('WornMatParams', dyeMat.worn_material_parameters);

              logColors([
                gearDye.primaryColor,
                gearDye.secondaryColor,
                gearDye.wornColor
              ]);
              break;
          }

          gearDyes.push(gearDye);
        }
        gearDyeGroups[dyeType] = gearDyes;
      }
      return gearDyeGroups;
    }
    function parseGearDyes(gear, shaderGear) {
      var gearDyeGroups = getGearDyes(gear);
      var shaderDyeGroups = shaderGear
        ? getGearDyes(shaderGear)
        : gearDyeGroups;

      console.log('GearDyes', gearDyeGroups);

      // Spasm.GearRenderable.prototype.getResolvedDyeList
      var resolvedDyes = [];
      var dyeTypeOrder = ['defaultDyes', 'customDyes', 'lockedDyes'];
      for (var i = 0; i < dyeTypeOrder.length; i++) {
        var dyeType = dyeTypeOrder[i];
        var dyes = [];
        switch (dyeType) {
          case 'defaultDyes':
            dyes = gearDyeGroups[dyeType];
            break;
          case 'customDyes':
            dyes = shaderDyeGroups[dyeType];
            break;
          case 'lockedDyes':
            dyes = gearDyeGroups[dyeType];
            break;
        }
        for (var j = 0; j < dyes.length; j++) {
          var dye = dyes[j];
          resolvedDyes[dye.slotTypeIndex] = dye;
        }
      }

      console.log('ResolvedGearDyes', resolvedDyes);

      return resolvedDyes;
    }

    // Spasm.TGXAssetLoader.prototype.getGearRenderableModel
    function parseTGXAsset(tgxBin, geometryHash) {
      var metadata = tgxBin.metadata; // Arrangement

      var meshes = [];

      for (var r = 0; r < metadata.render_model.render_meshes.length; r++) {
        var renderMeshIndex = r;
        var renderMesh = metadata.render_model.render_meshes[renderMeshIndex]; // BoB Bunch of Bits

        // IndexBuffer
        var indexBufferInfo = renderMesh.index_buffer;
        var indexBufferData =
          tgxBin.files[tgxBin.lookup.indexOf(indexBufferInfo.file_name)].data;

        var indexBuffer = [];
        for (
          var j = 0;
          j < indexBufferInfo.byte_size;
          j += indexBufferInfo.value_byte_size
        ) {
          var indexValue = utils.ushort(indexBufferData, j);
          indexBuffer.push(indexValue);
        }

        // VertexBuffer
        var vertexBuffer = parseVertexBuffers(tgxBin, renderMesh);

        var parts = [];
        var partIndexList = [];
        var stagesToRender = [0, 7, 15]; // Hardcoded?
        var partOffsets = [];

        var partLimit = renderMesh.stage_part_offsets[4];
        for (var i = 0; i < partLimit; i++) {
          partOffsets.push(i);
        }

        for (var i = 0; i < partOffsets.length; i++) {
          var partOffset = partOffsets[i];
          var stagePart = renderMesh.stage_part_list[partOffset];

          if (!stagePart) {
            console.warn(
              'MissingStagePart[' + renderMeshIndex + ':' + partOffset + ']'
            );
            continue;
          }
          if (partIndexList.indexOf(stagePart.start_index) !== -1) {
            continue;
          }
          partIndexList.push(stagePart.start_index);
          parts.push(parseStagePart(stagePart));
        }

        // Spasm.RenderMesh
        meshes.push({
          positionOffset: renderMesh.position_offset,
          positionScale: renderMesh.position_scale,
          texcoordOffset: renderMesh.texcoord_offset,
          texcoordScale: renderMesh.texcoord_scale,
          texcoord0ScaleOffset: renderMesh.texcoord0_scale_offset,
          indexBuffer: indexBuffer,
          vertexBuffer: vertexBuffer,
          parts: parts
        });
      }

      return meshes;
    }

    // Spasm.RenderMesh.prototype.getAttributes
    function parseVertexBuffers(tgxBin, renderMesh) {
      if (renderMesh.stage_part_vertex_stream_layout_definitions.length > 1) {
        console.warn(
          'Multiple Stage Part Vertex Layout Definitions',
          renderMesh.stage_part_vertex_stream_layout_definitions
        );
      }
      var stagePartVertexStreamLayoutDefinition =
        renderMesh.stage_part_vertex_stream_layout_definitions[0];
      var formats = stagePartVertexStreamLayoutDefinition.formats;

      var vertexBuffer = [];

      for (var vertexBufferIndex in renderMesh.vertex_buffers) {
        var vertexBufferInfo = renderMesh.vertex_buffers[vertexBufferIndex];
        var vertexBufferData =
          tgxBin.files[tgxBin.lookup.indexOf(vertexBufferInfo.file_name)].data;
        var format = formats[vertexBufferIndex];

        var vertexIndex = 0;
        for (
          var v = 0;
          v < vertexBufferInfo.byte_size;
          v += vertexBufferInfo.stride_byte_size
        ) {
          var vertexOffset = v;
          if (vertexBuffer.length <= vertexIndex)
            vertexBuffer[vertexIndex] = {};
          for (var e = 0; e < format.elements.length; e++) {
            var element = format.elements[e];
            var values = [];

            var elementType = element.type.replace(
              '_vertex_format_attribute_',
              ''
            );
            var types = [
              'ubyte',
              'byte',
              'ushort',
              'short',
              'uint',
              'int',
              'float'
            ];
            for (var typeIndex in types) {
              var type = types[typeIndex];
              if (elementType.indexOf(type) === 0) {
                var count = parseInt(elementType.replace(type, ''));
                var j, value;
                switch (type) {
                  case 'ubyte':
                    for (j = 0; j < count; j++) {
                      value = utils.ubyte(vertexBufferData, vertexOffset);
                      if (element.normalized)
                        value = utils.unormalize(value, 8);
                      values.push(value);
                      vertexOffset++;
                    }
                    break;
                  case 'byte':
                    for (j = 0; j < count; j++) {
                      value = utils.byte(vertexBufferData, vertexOffset);
                      if (element.normalized) value = utils.normalize(value, 8);
                      values.push(value);
                      vertexOffset++;
                    }
                    break;
                  case 'ushort':
                    for (j = 0; j < count; j++) {
                      value = utils.ushort(vertexBufferData, vertexOffset);
                      if (element.normalized)
                        value = utils.unormalize(value, 16);
                      values.push(value);
                      vertexOffset += 2;
                    }
                    break;
                  case 'short':
                    for (j = 0; j < count; j++) {
                      value = utils.short(vertexBufferData, vertexOffset);
                      if (element.normalized)
                        value = utils.normalize(value, 16);
                      values.push(value);
                      vertexOffset += 2;
                    }
                    break;
                  case 'uint':
                    for (j = 0; j < count; j++) {
                      value = utils.uint(vertexBufferData, vertexOffset);
                      if (element.normalized)
                        value = utils.unormalize(value, 32);
                      values.push(value);
                      vertexOffset += 4;
                    }
                    break;
                  case 'int':
                    for (j = 0; j < count; j++) {
                      value = utils.int(vertexBufferData, vertexOffset);
                      if (element.normalized)
                        value = utils.normalize(value, 32);
                      values.push(value);
                      vertexOffset += 4;
                    }
                    break;
                  case 'float':
                    // Turns out all that icky binary2float conversion stuff can be done with a typed array, who knew?
                    values = new Float32Array(
                      vertexBufferData.buffer,
                      vertexOffset,
                      count
                    );
                    vertexOffset += count * 4;
                    break;
                }
                break;
              }
            }

            var semantic = element.semantic.replace('_tfx_vb_semantic_', '');
            switch (semantic) {
              case 'position':
              case 'normal':
              case 'tangent': // Not used
              case 'texcoord':
              case 'blendweight': // Bone weights 0-1
              case 'blendindices': // Bone indices, 255=none, index starts at 1?
              case 'color':
                break;
              default:
                console.warn(
                  'Unknown Vertex Semantic',
                  semantic,
                  element.semantic_index,
                  values
                );
                break;
            }
            vertexBuffer[vertexIndex][
              semantic + element.semantic_index
            ] = values;
          }
          vertexIndex++;
        }
      }
      return vertexBuffer;
    }

    // Spasm.RenderablePart
    function parseStagePart(stagePart) {
      var gearDyeSlot = 0;
      var usePrimaryColor = true;
      var useInvestmentDecal = false;

      switch (stagePart.gear_dye_change_color_index) {
        case 0:
          gearDyeSlot = 0;
          break;
        case 1:
          gearDyeSlot = 0;
          usePrimaryColor = false;
          break;
        case 2:
          gearDyeSlot = 1;
          break;
        case 3:
          gearDyeSlot = 1;
          usePrimaryColor = false;
          break;
        case 4:
          gearDyeSlot = 2;
          break;
        case 5:
          gearDyeSlot = 2;
          usePrimaryColor = false;
          break;
        case 6:
          gearDyeSlot = 3;
          useInvestmentDecal = true;
          break;
        case 7:
          gearDyeSlot = 3;
          useInvestmentDecal = true;
          break;
        default:
          console.warn(
            'UnknownDyeChangeColorIndex[' +
              stagePart.gear_dye_change_color_index +
              ']',
            stagePart
          );
          break;
      }

      var part = {
        gearDyeSlot: gearDyeSlot,
        usePrimaryColor: usePrimaryColor,
        useInvestmentDecal: useInvestmentDecal
      };

      for (var key in stagePart) {
        var partKey = key;
        var value = stagePart[key];

        switch (key) {
          case 'gear_dye_change_color_index':
            partKey = 'changeColorIndex';
            break;

          case 'start_index':
            partKey = 'indexStart';
            break;

          case 'shader':
            var staticTextures = value.static_textures;

            value = {
              type: value.type
            };

            if (staticTextures) value.staticTextures = staticTextures;

            break;

          default:
            var keyWords = key.split('_');
            var partKey = '';
            for (var i = 0; i < keyWords.length; i++) {
              var keyWord = keyWords[i];
              partKey +=
                i === 0
                  ? keyWord
                  : keyWord.slice(0, 1).toUpperCase() + keyWord.slice(1);
            }
            break;
        }
        part[partKey] = value;
      }

      return part;
    }

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var shader = item.shaderHash ? shaders[item.shaderHash] : null;
      loadAssetManifest(item);
      if (shader) loadAssetManifest(shader);
    }
  }
});
