#import "TBNavigator.h"

@implementation TBNavigator

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"RouteProgress", @"RouteAlert"];
}


- (void)resumeNotifications {
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(alertLevelDidChange:) name:MBRouteControllerAlertLevelDidChange object:self.navigation];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(progressDidChange:) name:MBRouteControllerNotificationProgressDidChange object:self.navigation];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(rerouted:) name:MBRouteControllerShouldReroute object:self.navigation];
  
  [self.navigation resume];
}

- (void)suspendNotifications {
  [[NSNotificationCenter defaultCenter] removeObserver:self name:MBRouteControllerAlertLevelDidChange object:self.navigation];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:MBRouteControllerNotificationProgressDidChange object:self.navigation];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:MBRouteControllerShouldReroute object:self.navigation];
  
  [self.navigation suspendLocationUpdates];
}

- (void)alertLevelDidChange:(NSNotification *)notification {
  MBRouteProgress *routeProgress = (MBRouteProgress *)notification.userInfo[MBRouteControllerAlertLevelDidChange];
  MBRouteStep *upcomingStep = routeProgress.currentLegProgress.upComingStep;
  
  NSString *text = nil;
  if (upcomingStep) {
    MBAlertLevel alertLevel = routeProgress.currentLegProgress.alertUserLevel;
    if (alertLevel == MBAlertLevelHigh) {
      text = upcomingStep.instructions;
    } else {
      text = [NSString stringWithFormat:@"In %@ %@",
              [self.lengthFormatter stringFromMeters:routeProgress.currentLegProgress.currentStepProgress.distanceRemaining],
              upcomingStep.instructions];
    }
  } else {
    text = [NSString stringWithFormat:@"In %@ %@",
            [self.lengthFormatter stringFromMeters:routeProgress.currentLegProgress.currentStepProgress.distanceRemaining],
            routeProgress.currentLegProgress.currentStep.instructions];
  }
  
  [self sendEventWithName:@"RouteAlert" body:@{@"instruction": text}];
}

- (void)progressDidChange:(NSNotification *)notification {
  // If you are using MapboxCoreNavigation,
  // this would be a good time to update UI elements.
  // You can grab the current routeProgress like:
  // let routeProgress = notification.userInfo![RouteControllerAlertLevelDidChangeNotificationRouteProgressKey] as! RouteProgress
  MBRouteProgress *routeProgress = (MBRouteProgress *)notification.userInfo[MBRouteControllerNotificationProgressDidChange];
  NSNumber * distanceRemaining = [[NSNumber alloc] initWithDouble:routeProgress.currentLegProgress.currentStepProgress.distanceRemaining];
  [self sendEventWithName:@"RouteProgress" body:@{@"distanceRemaining": distanceRemaining}];
}

- (void)rerouted:(NSNotification *)notification {
  //[self getRoute];
}

RCT_EXPORT_METHOD(registerRoute:(NSDictionary *)json waypoints: (NSDictionary *)waypoints accuracy:(float)accuracy) {
  // Get coords of begin and end
  double originLat = [RCTConvert double:waypoints[@"originLat"]];
  double originLong = [RCTConvert double:waypoints[@"originLong"]];
  double destLat = [RCTConvert double:waypoints[@"destinationLat"]];
  double destLong = [RCTConvert double:waypoints[@"destinationLong"]];
  
  // Build start and end Waypoint
  CLLocationCoordinate2D originCoord = CLLocationCoordinate2DMake(originLat, originLong);
  CLLocationCoordinate2D destCoord = CLLocationCoordinate2DMake(destLat, destLong);
  
  MBWaypoint * wpOrigin = [[MBWaypoint alloc] initWithCoordinate:originCoord coordinateAccuracy:accuracy name:@"Origin"];
    MBWaypoint * wpDest = [[MBWaypoint alloc] initWithCoordinate:destCoord coordinateAccuracy:accuracy name:@"Destination"];
  
  self.route = [[MBRoute alloc] initWithJson:json waypoints: @[wpOrigin, wpDest] profileIdentifier: MBDirectionsProfileIdentifierAutomobile];
}

RCT_EXPORT_METHOD(startNavigation) {
  self.navigation = [[MBRouteController alloc] initWithRoute:self.route];
  [self resumeNotifications];
}

RCT_EXPORT_METHOD(stopNavigation) {
  [self suspendNotifications];
}

@end
