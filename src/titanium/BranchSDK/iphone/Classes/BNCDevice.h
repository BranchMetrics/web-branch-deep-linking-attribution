//
//  BNCDevice.h
//  BranchSDK
//
//  Created by Robert Petit on 5/7/15.
//
//

#import <Foundation/Foundation.h>

@interface BNCDevice : NSObject

+ (NSString *)getUniqueHardwareId:(BOOL *)isReal andIsDebug:(BOOL)debug;
+ (NSString *)getURIScheme;
+ (NSString *)getAppVersion;
+ (NSString *)getCarrier;
+ (NSString *)getBrand;
+ (NSString *)getModel;
+ (NSString *)getOS;
+ (NSString *)getOSVersion;
+ (NSNumber *)getScreenWidth;
+ (NSNumber *)getScreenHeight;
+ (NSNumber *)getUpdateState:(BOOL)updateState;
+ (NSString *)getDeviceName;
+ (BOOL)isSimulator;
+ (BOOL)adTrackingSafe;

@end
