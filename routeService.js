import React from 'react';
import * as Constants from './constants';
import * as Utils from './utils';
import Tts from 'react-native-tts';
import {retrieveLandmarkForExecutionPoint} from './api';
import {NativeModules, NativeEventEmitter} from 'react-native';
import {findIndex} from 'lodash';

let route = [];
let pipeline;
let nextPointIdx = 0;
let locationWatchId;
let deviationDistance = 0;
const {TBNavigator} = NativeModules;
const tbNavigatorEmitter = new NativeEventEmitter(TBNavigator);
let routeAlertSubscription, routeProgressSubscription, rerouteNeededSubscription;
let distanceChangedCallback, rerouteNeededCallback;

Tts.setDucking(true);
Tts.addEventListener('tts-start', (event) => console.log("Tts start", event));
Tts.addEventListener('tts-finish', (event) => console.log("Tts finish", event));
Tts.addEventListener('tts-cancel', (event) => console.log("Tts cancel", event));

export async function registerRoute(_route, waypoints, accuracy, _pipeline) {
    route = _route;
    nextPointIdx = 0;
    callback = Function;
    pipeline = _pipeline;

    await TBNavigator.registerRoute(_route, waypoints, accuracy);
}

export const start = (_onDistanceChanged, _onRerouteNeeded) => {
    distanceChangedCallback = _onDistanceChanged;
    rerouteNeededCallback = _onRerouteNeeded;

    routeAlertSubscription = tbNavigatorEmitter.addListener(
        'RouteAlert',
        handleRouteAlert
    );

    routeProgressSubscription = tbNavigatorEmitter.addListener(
        'RouteProgress',
        handleProgressUpdate
    );

    rerouteNeededSubscription = tbNavigatorEmitter.addListener(
        'RerouteNeeded',
        rerouteNeededCallback
    );

    TBNavigator.startNavigation();
};

export async function stop()  {
    route = [];
    await TBNavigator.stopNavigation();
    routeAlertSubscription && routeAlertSubscription.remove();
    routeProgressSubscription && routeProgressSubscription.remove();
    rerouteNeededSubscription && rerouteNeededSubscription.remove();

    routeAlertSubscription = routeProgressSubscription = rerouteNeededSubscription = null;
}

const handleRouteAlert = (alert) => {
    const {epId, distanceString, action} = alert;
    const step = getRouteStepByEpId(epId);
    const landmark = step.maneuver.landmark;

    // If description of landmark contains duplicate words at end, trim.
    // This can happen if landmark category is included at end of landmark name.
    let description = (landmark && landmark.computedDescription) || '';
    const descriptionWords = description.split(' ');
    if (descriptionWords.length > 1 &&
        descriptionWords[descriptionWords.length - 1] === descriptionWords[descriptionWords.length - 2]) {
        description = descriptionWords.slice(0, -1).join(' ');
    }

    let instruction = "";

    if (distanceString)
        instruction += `in ${distanceString}, `;

    instruction += `${action}`;

    if (description.length) {
        const positionSpecifier = Constants.LANDMARK_POSITIONS[landmark.position];
        instruction = `at the ${description}, `;
    }

    instruction += ".";

    Tts.speak(instruction);
};

const handleProgressUpdate = (event) => {
    const {distanceRemaining, upcomingEpId} = event;

    distanceChangedCallback();

    // If we're within a mile of turn, see if we need to try and grab landmark info again
    if (distanceRemaining <= 1600) {
        const step = getRouteStepByEpId(upcomingEpId);

        if (!step.descriptionCheck) {
            // Mark this step as having been checked for landmark description
            setDescriptionChecked(upcomingEpId, true);

            // If we don't have the landamrk or its description, request from route manager
            if (!step.maneuver.landmark || !step.maneuver.landmark.computedDescription) {
                retrieveLandmarkForExecutionPoint(upcomingEpId, pipeline)
                    .then(landmark => {
                        if (landmark) {
                            route[stepIndex].maneuver.landmark = landmark;
                        }
                    })
                    .catch((e) => {
                        if (e.reason === 'NOT_FOUND') {
                            // Indicate that this step can be checked again for landmark description
                            setDescriptionChecked(upcomingEpId, false);
                        }
                    })
            }
        }
    }
};

const getRouteStepByEpId = (epId) => {
    const stepIndex = findIndex(route.legs[0].steps, step => step.executionPointId === epId);
    const step = route.legs[0].steps[stepIndex];

    return step
};

const setDescriptionChecked = (epId, checked = true) => {
    const stepIndex = findIndex(route.legs[0].steps, step => step.executionPointId === epId);
    route.legs[0].steps[stepIndex].descriptionCheck = checked;
};