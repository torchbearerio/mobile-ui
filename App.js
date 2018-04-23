import React from 'react';
import {Component} from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Button,
  Image,
  Text,
  TouchableHighlight,
  Alert,
  Speech,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  TouchableOpacity,
  Modal
} from 'react-native';

import Geocoder from 'react-native-geocoder';
import Icon from 'react-native-vector-icons/FontAwesome';
import {Select, Option} from 'react-native-select-lists';
import * as RouteService from './routeService';
import * as API from './api';
import {getDemoRoutes} from './demoService';
import {DemoRouteTable} from './Views/DemoRouteTable';

export default class Torchbearer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      destinationLat: 0,
      destinationLong: 0,
      screen: 'home',
      settingsVisible: false,
      demoVisible: false,
      pipeline: 'CV-CV',
    };
  }

  componentDidMount() {
    navigator.geolocation.requestAuthorization();
  }

  buildRoute(originPoint) {
    console.log(originPoint);
    this.setState({position: originPoint});
    const {destinationLat, destinationLong, pipeline} = this.state;

    const waypoints = {
      originLat: originPoint.latitude,
      originLong: originPoint.longitude,
      destinationLat,
      destinationLong,
    };

    API.retrieveRoute(originPoint.latitude, originPoint.longitude, destinationLat, destinationLong, pipeline)
      .then((route) => {
        console.log("Route received.")
        RouteService.registerRoute(route, waypoints, originPoint.accuracy, pipeline)
            .then(() => {
                RouteService.start(d => this.setState({distanceToNextTurn: d}), this.startNavigation);
            });
        this.setState({screen: 'navigation'});
      })
      .catch((e) => console.log("Error fetching route: " + e));
  }

  async startNavigation(originPoint) {
    if (this.state.screen !== 'navigation') {
      this.setState({screen: 'loading'});
    }

    await RouteService.stop();

    if (originPoint) {
      this.buildRoute(originPoint);
    }

    else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.buildRoute(position.coords);
        },
        (error) => {
          console.log(JSON.stringify(error))
          this.setState({screen: 'home'});
        },
        {
          enableHighAccuracy: true,
          timeout: 10 * 1000,
        });
    }
  };

  handleGoPress = () => {
    // Geocode address
    Geocoder.geocodeAddress(this.state.destination).then(res => {
      const result = res[0];
      Alert.alert(
        'Is this the right place?',
        `${result.formattedAddress}`, [{
          text: 'Yes',
          onPress: () => {
            this.setState({
              destinationLat: result.position.lat,
              destinationLong: result.position.lng
            }, () => {
              this.startNavigation();
            });
          }
        },
          {
            text: 'No',
          }
        ], {
          cancelable: false
        }
      );
    })
      .catch(err => console.log(err))
  };

  handleSettingsPress = () => {
    this.setState({settingsVisible: true});
  };

  handleDemoPress = () => {
    this.setState({demoVisible: true});
  };

  handleStopPress = () => {
    RouteService.stop();
    this.setState({screen: 'home'});
  };

  startDemoRoute = (route) => {
    const fakeOrigin = {longitude: route.originLong, latitude: route.originLat};
    this.setState({
      destinationLong: route.destinationLong,
      destinationLat: route.destinationLat,
    }, () => {
      this.startNavigation(fakeOrigin);
    });
  };

  renderDemoModal = () => {
    const demoRoutes = getDemoRoutes();

    return (
      <Modal
        animationType={"slide"}
        transparent={false}
        visible={this.state.demoVisible}
      >
        <Text style={styles.modalHeader}>
          Demo Routes
        </Text>
        <View style={styles.container}>
          <Image source={require('./Images/city-skyline.png')}
                 style={styles.backgroundImg2}
          />
          <DemoRouteTable routes={demoRoutes} selectDemoRoute={(route) => {
            this.setState({demoVisible: false});
            this.startDemoRoute(route);
          }}/>

          <TouchableHighlight style={styles.doneButton}
                              onPress={
                                () => this.setState({demoVisible: false})
                              }
                              underLayColor='white'>
            <Text style={styles.buttonText}>
              Done
            </Text>
          </TouchableHighlight>
        </View>
      </Modal>
    );
  };

  renderSettingsModal = () => {
    return (
      <Modal
        animationType={"slide"}
        transparent={false}
        visible={this.state.settingsVisible}
      >
        <Text style={styles.modalHeader}>
          Settings
        </Text>
        <View style={styles.container}>
          <Select
            listHeight={200}
            onSelect={(value) => {
              this.setState({pipeline: value})
            }}
            selectStyle={styles.selectList}>
            <Option value={"CV-CV"}>CV-CV</Option>
            <Option value={"CV-HUMAN"}>CV-Human</Option>
            <Option value={"HUMAN-CV"}>Human-CV</Option>
            <Option value={"HUMAN-HUMAN"}>Human-Human</Option>
          </Select>
          <TouchableHighlight style={styles.doneButton}
                              onPress={
                                () => this.setState({settingsVisible: false})
                              }
                              underLayColor='white'>
            <Text style={styles.buttonText}>
              Done
            </Text>
          </TouchableHighlight>
          <Image source={require('./Images/city-skyline.png')}
                 style={styles.backgroundImg2}
          />
        </View>
      </Modal>
    );
  };

  renderHomeScreen = () => {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <StatusBar hidden={true}/>

          {this.renderSettingsModal()}
          {this.renderDemoModal()}

          <TouchableOpacity style={styles.demoButton}
                            onPress={
                              this.handleDemoPress
                            }
                            underLayColor='white'>
            <Icon name="location-arrow" size={30} color="#FFF"/>

          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsButton}
                            onPress={
                              this.handleSettingsPress
                            }
                            underLayColor='white'>
            <Icon name="cog" size={30} color="#FFF"/>

          </TouchableOpacity>
          <Text style={styles.hello}>
            Torchbearer
          </Text>

          <Image source={require('./Images/city-skyline.png')}
                 style={
                   styles.backgroundImg2
                 }
          />

          <TextInput style={{height: 40, backgroundColor: 'white', width: '90%', opacity: 0.6}}
                     placeholder="Where to? "
                     onChangeText={
                         (text) => this.setState({
                             destination: text
                         })
                     }
          />

          <TouchableHighlight style={styles.goButton}
                              onPress={
                                this.handleGoPress
                              }
                              underLayColor='white'>
            <Text style={styles.buttonText}>
              Go!
            </Text>
          </TouchableHighlight>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  renderLoadingScreen = () => {
    return (
      <View style={styles.container}>
        <Image source={require('./Images/city-skyline.png')}
               style={styles.backgroundImg2}
        />
        <ActivityIndicator
          animating={this.state.animating}
          style={[styles.centering, {height: 500}]}
          size="large"
          color='#4F86F7'
        />
      </View>
    );
  }

  renderNavigationScreen = () => {
    return (
      <View style={
        styles.container
      }>
        <Text style={styles.loadingText}>
          {this.state.distanceToNextTurn}
        </Text>
        <TouchableHighlight style={styles.stopButton}
                            onPress={
                              this.handleStopPress
                            }
                            underLayColor='white'>
          <Text style={styles.buttonText}>
            Stop
          </Text>
        </TouchableHighlight>
        <Image source={require('./Images/city-skyline.png')}
               style={styles.backgroundImg2}
        />
      </View>
    );
  }

  render() {
    switch (this.state.screen) {
      case 'home':
        return this.renderHomeScreen();
        break;

      case 'loading':
        return this.renderLoadingScreen();
        break;

      case 'navigation':
        return this.renderNavigationScreen();
        break;
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: null,
    height: null,
    padding: 20,
    paddingTop: 50,
    paddingBottom: 0,
    backgroundColor: 'rgba(147, 195, 234, 1.0)',
  },

  hello: {
    padding: 10,
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 100,
    fontFamily: "Nixie One"
  },

  goButton: {
    marginTop: 30,
    borderRadius: 20,
    height: 40,
    width: 200,
    backgroundColor: '#4F86F7',
    justifyContent: 'center',
    alignItems: 'center'
  },

  stopButton: {
    marginTop: 30,
    borderRadius: 20,
    height: 40,
    width: 200,
    backgroundColor: '#f45f42',
    justifyContent: 'center',
    alignItems: 'center'
  },

  doneButton: {
    marginTop: 20,
    borderRadius: 20,
    height: 40,
    width: 200,
    backgroundColor: '#4F86F7',
    justifyContent: 'center',
    alignItems: 'center'
  },

  selectList: {
    marginBottom: 30,
  },

  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 20,
  },
  bear: {
    height: 50,
    width: 50,
    justifyContent: 'flex-end',
    marginBottom: 0
  },
  backgroundImg1: {
    flexGrow: 1,
    flexShrink: 1,
    resizeMode: 'contain',
    justifyContent: 'center'
  },
  backgroundImg2: {
    //flexGrow: 1,
    //flexShrink: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
    marginBottom: 0,
    position: 'absolute',
    bottom: 0
  },
  loadingText: {
    justifyContent: 'center',
    fontSize: 20
  },
  settingsButton: {
    position: 'absolute',
    height: 30,
    width: 30,
    top: 20,
    right: 20
  },
  demoButton: {
    position: 'absolute',
    height: 30,
    width: 30,
    top: 20,
    left: 20
  },
  modalHeader: {
    textAlign: 'center',
    fontSize: 25,
    backgroundColor: 'rgba(147, 195, 234, 1.0)',
    padding: 30

  }

});
