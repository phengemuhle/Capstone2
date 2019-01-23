// import React from 'react';
// import { Platform, StatusBar, StyleSheet, View } from 'react-native';
// import { AppLoading, Asset, Font, Icon } from 'expo';
// import AppNavigator from './navigation/AppNavigator';

// export default class App extends React.Component {
//   state = {
//     isLoadingComplete: false,
//   };

//   render() {
//     if (!this.state.isLoadingComplete && !this.props.skipLoadingScreen) {
//       return (
//         <AppLoading
//           startAsync={this._loadResourcesAsync}
//           onError={this._handleLoadingError}
//           onFinish={this._handleFinishLoading}
//         />
//       );
//     } else {
//       return (
//         <View style={styles.container}>
//           {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
//           <AppNavigator />
//         </View>
//       );
//     }
//   }

//   _loadResourcesAsync = async () => {
//     return Promise.all([
//       Asset.loadAsync([
//         require('./assets/images/robot-dev.png'),
//         require('./assets/images/robot-prod.png'),
//       ]),
//       Font.loadAsync({
//         // This is the font that we are using for our tab bar
//         ...Icon.Ionicons.font,
//         // We include SpaceMono because we use it in HomeScreen.js. Feel free
//         // to remove this if you are not using it in your app
//         'space-mono': require('./assets/fonts/SpaceMono-Regular.ttf'),
//       }),
//     ]);
//   };

//   _handleLoadingError = error => {
//     // In this case, you might want to report the error to your error
//     // reporting service, for example Sentry
//     console.warn(error);
//   };

//   _handleFinishLoading = () => {
//     this.setState({ isLoadingComplete: true });
//   };
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
// });
import 'prop-types';
import 'three';

import ExpoGraphics from 'expo-graphics';
import ExpoTHREE, { THREE } from 'expo-three';
import React from 'react';
import { PixelRatio } from 'react-native';

export default class Scene extends React.Component {
  render() {
    return (
      <ExpoGraphics.View
        style={{ flex: 1 }}
        onContextCreate={this.onContextCreate}
        onRender={this.onRender}
        onResize={this.onResize}
      />
    );
  }

  onContextCreate = async gl => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const scale = PixelRatio.get();

    // renderer
    this.renderer = ExpoTHREE.createRenderer({
      gl,
    });
    this.renderer.capabilities.maxVertexUniforms = 52502;
    this.renderer.setPixelRatio(scale);
    this.renderer.setSize(width / scale, height / scale);
    this.renderer.setClearColor(0x000000, 1.0);

    /// Standard Camera
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 10000);
    this.camera.position.set(0, 6, 12);
    this.camera.lookAt(0, 0, 0);

    this.setupScene();
    await this.loadModelsAsync();
  };

  setupScene = () => {
    // scene
    this.scene = new THREE.Scene();

    // Standard Background
    this.scene.background = new THREE.Color(0x999999);
    this.scene.fog = new THREE.FogExp2(0xcccccc, 0.002);

    this.scene.add(new THREE.GridHelper(50, 50, 0xffffff, 0x555555));

    this.setupLights();
  };

  setupLights = () => {
    // lights
    const directionalLightA = new THREE.DirectionalLight(0xffffff);
    directionalLightA.position.set(1, 1, 1);
    this.scene.add(directionalLightA);

    const directionalLightB = new THREE.DirectionalLight(0xffeedd);
    directionalLightB.position.set(-1, -1, -1);
    this.scene.add(directionalLightB);

    const ambientLight = new THREE.AmbientLight(0x222222);
    this.scene.add(ambientLight);
  };

  /// Magic happens here!
  loadModelsAsync = async () => {
    /// Get all the files in the mesh
    const model = {
      'EarRing.obj': require('./EarRing/EarRing.obj'),
      'EarRing.mtl': require('./EarRing/EarRing.mtl'),
    };

    /// Load model!
    const mesh = await ExpoTHREE.loadAsync(
      [model['EarRing.obj'], model['EarRing.mtl']],
      null,
      name => model[name],
    );

    /// Update size and position
    ExpoTHREE.utils.scaleLongestSideToSize(mesh, 5);
    ExpoTHREE.utils.alignMesh(mesh, { y: 1 });
    /// Smooth mesh
    // ExpoTHREE.utils.computeMeshNormals(mesh);

    /// Add the mesh to the scene
    this.scene.add(mesh);

    /// Save it so we can rotate
    this.mesh = mesh;
  };

  onResize = ({ width, height }) => {
    const scale = PixelRatio.get();

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(scale);
    this.renderer.setSize(width, height);
  };

  onRender = delta => {
    this.mesh.rotation.y += 0.4 * delta;
    this.renderer.render(this.scene, this.camera);
  };
}