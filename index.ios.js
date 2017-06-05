import React from 'react';
import {Component} from 'react';
import {
  AppRegistry,
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
import {Select, Option} from 'react-native-select-list';
import * as RouteService from './routeService';
import * as API from './api';
import {getDemoRoutes} from './demoService';
import {DemoRouteTable} from './Views/DemoRouteTable';

class Torchbearer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      text: 'Torchbearer',
      destinationLat: 0,
      destinationLong: 0,
      screen: 'home',
      settingsVisible: false,
      demoVisible: false,
      pipeline: 'CV-CV',
    };
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
        },
        {
          enableHighAccuracy: true,
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
            <Option value={"cv-cv"}>CV-CV</Option>
            <Option value={"cv-human"}>CV-Human</Option>
            <Option value={"human-cv"}>Human-CV</Option>
            <Option value={"human-human"}>Human-Human</Option>
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
            {this.state.text}
          </Text>

          <TextInput style={{height: 40, backgroundColor: 'white', opacity: 0.6}}
                     placeholder="Where to? "
                     onChangeText={
                       (text) => this.setState({
                         destination: text
                       })
                     }
          />

          <Image source={require('./Images/city-skyline.png')}
                 style={
                   styles.backgroundImg2
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

  componentDidMount() {
    //Tts.speak("Wait a minute man Hey check this out man tell it It was this blind man right, it was this blind man right He was feelin' his way down the street with a stick right, hey He walked past this fish market, you know what I'm sayin' He stopped he took a deep breath he said Snfffffff, woooo good morning ladies, ha You like that shit man Hey man I've got a gang of that shit man Hey I'll tell you what We'll all have a good time We'll pull on the drug And hey, hey if everybody crowd around the mike I'll tell you all these motherfuckin' jokes I got First I'm gonna start off like that, hey help me sing it homeboy [Hook] Said colt 45 and two zigzags baby thats all we need We can go to the park, after dark Smoke that tumbleweed As the marijuana burn we can take our turn Singin' them dirty rap songs Stop and hit the bong like Cheech and Chong And sell tapes from here to Hong Kong So roll, roll, roll my joint, pick out the seeds and stems Feelin' high as hell flyin' through Palmdale Skatin' on Dayton rims So roll, roll, the '83 Cadillac Coupe Deville If my tapes and my cds just don't sell, I bet my Caddy will [Verse 1] Well it was just sundown in small white town They call it East Side Palmdale When the afroman walked through the white land Houses went up for sale Well I was standing on the corner sellin' rap cds When I met a little girl named Jan I let her ride in my Caddy Because I didn't know her daddy was the leader of the Ku Klux Klan We fucked on the bed Fucked on the floor Fucked so long I grew a fuckin' afro Then I fucked to the left (left) Fucked to the right (right) She sucked my dick 'til the shit turned white Thought to myself sheeba-sheeba Got my ass lookin' like a zebra I put on my clothes and I was on my way Until her daddy pulled up in a Chevrolet And so I ran I jumped out the back window But her daddy he was waitin' with a two-by-four Oh, he beat me to the left He beat me to the right The motherfucker whooped my ass all night But I ain't mad at her prejudiced dad That's the best damn pussy I ever had Got a bag of weed and a bottle of wine I'm gonna fuck that bitch just one more time [Hook] Said colt 45 and two zigzags baby thats all we need We can go to the park, after dark Smoke that tumbleweed As the marijuana burn we can take our turn Singin' them dirty rap songs Stop and hit the bong like Cheech and Chong And sell tapes from here to Hong Kong So roll, roll, roll my joint, pick out the seeds and stems Feelin' high as hell flyin' through Palmdale Skatin' on Dayton rims So roll, roll, the '83 Cadillac Coupe Deville If my tapes and my cds just don't sell, I bet my Caddy will [Verse 2] I met this lady in Hollywood She had green hair but damn she looked good I took her to my house because she was fine But she whooped out a dick that was bigger than mine I met this lady from Japan Never made love with an African I fucked her once, I fucked her twice I ate that pussy like shrimp-fried rice Don't be amazed at the stories I tell ya (tell ya) I met a woman in the heart of Australia Had a big butt and big titties too So I hopped in her ass like Kangaroo See I met this woman from Hawaii Stuck it in her ass and she said Lips was breakfast, pussy was lunch Then her titties busted open with Hawaiian Punch I met Colonel Sanders wife in the state of Kentucky She said I'd fry some chicken if you'd just fuck me I came in her mouth, it was a crisis I gave her my secret blend of Herbs' n' Spices [Hook] Said colt 45 and two zigzags baby thats all we need We can go to the park, after dark Smoke that tumbleweed As the marijuana burn we can take our turn Singin' them dirty rap songs Stop and hit the bong like Cheech and Chong And sell tapes from here to Hong Kong [Verse 3] I met Dolly Parton in Tennessee Her titties were filled with Hennessy That country music really drove me crazy But I rode that ass and said yes Miss Daisy Met this lady in Oklahoma Put that pussy in a coma Met this lady in Michigan I can't wait 'til I fuck that bitch again Met a real black girl down in South Carolina Fucked her until she turned into a white albino Fucked this hooker in Iowa I fucked her on credit, so I owe her Fucked this girl down in Georgia Came in her mouth, man I thought I told ya Met this beautiful sexy ho She just ran across the border of Mexico Fine young thing said her name's Maria I wrapped her up just like a hot tortilla I wanna get married but I can't afford it I know I'm'a cry when she get deported [Hook] Colt 45 and two zigzags baby thats all we need We can go to the park, after dark Smoke that tumbleweed As the marijuana burn we can take our turn Singin' them dirty rap songs Stop and hit the bong like Cheech and Chong And sell tapes from here to Hong Kong [Verse 4] Have you ever went over a girl's house to fuck But the pussy just ain't no good I mean you gettin' upset because you can't get her wet Plus you in the wrong neighborhood So you try to play it off and eat the pussy But it take her so long to cum Then a dude walk in, that's her big boyfriend And he asks you where you from So you wipe your mouth and you try to explain You start talking real fast But he already mad cause you fucking his woman So he start beating on you ass Now your clothes all muddy Your nose all bloody Your dick was hard but now it's soft You thought you had a girl to rock your world Now you still gotta go jack off [Hook] Said colt 45 and two zigzags baby thats all we need We can go to the park, after dark Smoke that tumbleweed ");
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
    padding: 50,
    paddingBottom: 0,
    backgroundColor: 'rgba(147, 195, 234, 1.0)',
  },

  hello: {
    padding: 10,
    fontSize: 35,
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

// App registration and rendering

AppRegistry.registerComponent('Torchbearer', () => Torchbearer);
