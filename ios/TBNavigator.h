#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTConvert.h>

@import CoreLocation;
@import MapboxCoreNavigation;
@import MapboxDirections;

@interface TBNavigator : RCTEventEmitter <RCTBridgeModule>
  @property (nonatomic) MBDirections *directions;
  @property (nonatomic) MBRoute *route;
  @property (nonatomic) MBRouteController *navigation;
  @property (nonatomic) NSLengthFormatter *lengthFormatter;
@end
