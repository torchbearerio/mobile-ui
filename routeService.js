import React from 'react';
import * as Constants from './constants';
import * as Utils from './utils';
import Tts from 'react-native-tts';
import {retrieveLandmarkForExecutionPoint} from './api';
import { NativeModules, NativeEventEmitter } from 'react-native';

let route = [];
let pipeline;
let nextPointIdx = 0;
let locationWatchId;
let deviationDistance = 0;
const {TBNavigator} = NativeModules;
const tbNavigatorEmitter = new NativeEventEmitter(TBNavigator);
let routeAlertSubscription, routeProgressSubscription;

Tts.setDucking(true);

export const registerRoute = (_route, waypoints, accuracy, _pipeline) => {
  route = _route;
  nextPointIdx = 0;
  callback = Function;
  pipeline = _pipeline;

  TBNavigator.registerRoute(_route, waypoints, accuracy);
};

export const start = (_callback) => {
  routeAlertSubscription = tbNavigatorEmitter.addListener(
    'RouteAlert',
    (reminder) => console.log(reminder.name)
  );

  routeProgressSubscription = tbNavigatorEmitter.addListener(
    'RouteProgress',
    (reminder) => console.log(reminder.name)
  );

  callback = _callback || Function;

  TBNavigator.startNavigation();
};

export const stop = () => {
  route = [];
  TBNavigator.stopNavigation();
  routeAlertSubscription.remove();
  routeProgressSubscription.remove();
};

/**
 * Updates
 * @param position
 */
const updatePosition = (position) => {
  const {latitude, longitude} = position.coords;
  const currentPosition = {lat: latitude, long: longitude};

  console.log(`Lat: ${currentPosition.lat}, Long: ${currentPosition.long}`);

  const nextTurn = route[nextPointIdx];

  if (!nextTurn || !nextTurn.radii.length) return;

  const nextCoords = {
    lat: nextTurn.executionPoint.lat,
    long: nextTurn.executionPoint.long
  };
  const distanceToTurn = Utils.distance(currentPosition, nextCoords);
  console.log(`DISTANCE: ${distanceToTurn}`);
  callback(distanceToTurn);

  updateRadii(nextPointIdx, distanceToTurn);

  const nextRadius = Utils.arrayMax(nextTurn.radii);

  if (distanceToTurn <= nextRadius) {

    console.log("RADIUS HIT!!!!!!!");

    if (nextRadius === 1320 && !nextTurn.instruction.landmark) {
      retrieveLandmarkForExecutionPoint(nextTurn.executionPoint.executionPointId, pipeline)
        .then(response => {
          route[nextPointIdx].instruction.landmark = response.landmark;
          Tts.speak(buildInstruction(nextTurn.instruction, nextRadius));
        })
    }

    else {
      Tts.speak(buildInstruction(nextTurn.instruction, nextRadius));
    }

    removeRadius(nextPointIdx, nextRadius);

    if (route[nextPointIdx].radii.length === 0) {
      nextPointIdx++;
    }
  }
};

const updateRadii = (turnIdx, distance) => {
  while (route[turnIdx].radii[1] && distance < route[turnIdx].radii[1]) {
    removeRadius(turnIdx, route[turnIdx].radii[0]);
  }
};

const removeRadius = (turnIdx, radius) => {
  route[turnIdx].radii = route[turnIdx].radii.filter(r => r != radius);
};

const buildInstruction = (instruction, distance) => {
  if (!Constants.INSTRUCTION_DISTANCES[distance]) {
    return instruction.action;
  }

  return `${Constants.INSTRUCTION_DISTANCES[distance]}, ${instruction.action}.`;
};

const onError = (e) => {
  console.warn(`RouteService: ${e.message}`);
};