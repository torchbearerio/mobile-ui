#import "TBNavigator.h"

@implementation TBNavigator

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"RouteProgress", @"RouteAlert", @"RerouteNeeded"];
}


- (void)resumeNotifications {
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(alertLevelDidChange:) name:MBRouteControllerAlertLevelDidChange object:self.navigation];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(progressDidChange:) name:MBRouteControllerNotificationProgressDidChange object:self.navigation];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(rerouteNeeded:) name:MBRouteControllerShouldReroute object:self.navigation];
  
  [self.navigation resume];
}

- (void)suspendNotifications {
  [[NSNotificationCenter defaultCenter] removeObserver:self name:MBRouteControllerAlertLevelDidChange object:self.navigation];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:MBRouteControllerNotificationProgressDidChange object:self.navigation];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:MBRouteControllerShouldReroute object:self.navigation];
  
  [self.navigation suspendLocationUpdates];
}

- (void)alertLevelDidChange:(NSNotification *)notification {
  MBRouteProgress *routeProgress = (MBRouteProgress *)notification.userInfo[MBRouteControllerAlertLevelDidChangeNotificationRouteProgressKey];
  MBRouteStep *upcomingStep = routeProgress.currentLegProgress.upComingStep;
  
  NSString *instruction = nil;
  NSString *distance = nil;
  NSNumber *executionPointId = nil;
  
  if (upcomingStep) {
    MBAlertLevel alertLevel = routeProgress.currentLegProgress.alertUserLevel;
    instruction = upcomingStep.instructions;
    executionPointId = [NSNumber numberWithLong:upcomingStep.executionPointId];

    if (alertLevel == MBAlertLevelHigh) {
      // Set distance to 0, as in this case we're right at the maneuver point
      distance = @"";
    } else {
      distance = [self.lengthFormatter stringFromMeters:routeProgress.currentLegProgress.currentStepProgress.distanceRemaining];
    }
  } else {
    instruction = routeProgress.currentLegProgress.currentStep.instructions;
    executionPointId = [NSNumber numberWithLong:routeProgress.currentLegProgress.currentStep.executionPointId];
    distance = [self.lengthFormatter stringFromMeters:routeProgress.currentLegProgress.currentStepProgress.distanceRemaining];
  }
  
  [self sendEventWithName:@"RouteAlert" body:@{@"epId": executionPointId, @"action": instruction, @"distanceString": distance}];
}

- (void)progressDidChange:(NSNotification *)notification {
  // If you are using MapboxCoreNavigation,
  // this would be a good time to update UI elements.
  // You can grab the current routeProgress like:
  // let routeProgress = notification.userInfo![RouteControllerAlertLevelDidChangeNotificationRouteProgressKey] as! RouteProgress
  MBRouteProgress *routeProgress = (MBRouteProgress *)notification.userInfo[MBRouteControllerProgressDidChangeNotificationProgressKey];
  NSNumber * distanceRemaining = [[NSNumber alloc] initWithDouble:routeProgress.currentLegProgress.currentStepProgress.distanceRemaining];
  NSNumber *upcomingEpId = [NSNumber numberWithLong:routeProgress.currentLegProgress.currentStep.executionPointId];
  [self sendEventWithName:@"RouteProgress" body:@{@"distanceRemaining": distanceRemaining, @"upcomingEpId": upcomingEpId}];
}

- (void)rerouteNeeded:(NSNotification *)notification {
  [self sendEventWithName:@"RerouteNeeded" body:nil];
}

RCT_EXPORT_METHOD(registerRoute:(NSDictionary *)json waypoints: (NSDictionary *)waypoints accuracy:(float)accuracy resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
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
  
  [self setupLengthFormatter];
  
  resolve(nil);
}

RCT_EXPORT_METHOD(startNavigation) {
  // MBRouteController must be initialized on main queue, as it creates the underlying NSLocationManager
  dispatch_async(dispatch_get_main_queue(), ^{
    self.navigation = [[MBRouteController alloc] initWithRoute:self.route];
    [self resumeNotifications];
  });
}

RCT_EXPORT_METHOD(stopNavigation) {
  [self suspendNotifications];
}

-(void)setupLengthFormatter {
  NSNumberFormatter *formatter = [NSNumberFormatter new];
  [formatter setMaximumFractionDigits:0];
  [formatter setGeneratesDecimalNumbers:NO];
  
  self.lengthFormatter = [NSLengthFormatter new];
  self.lengthFormatter.unitStyle = NSFormattingUnitStyleLong;
  self.lengthFormatter.numberFormatter = formatter;
}

@end
