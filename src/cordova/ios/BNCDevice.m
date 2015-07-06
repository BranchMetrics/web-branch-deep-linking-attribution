#include <sys/utsname.h>
#import "BNCDevice.h"
#import <UIKit/UIDevice.h>
#import <UIKit/UIScreen.h>
#import <SystemConfiguration/SystemConfiguration.h>

@implementation BNCDevice

static NSString *link_click_identifier = nil;

- (void)pluginInitialize {
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(handleOpenUrl:) name:CDVPluginHandleOpenURLNotification object:nil];
}

- (void)handleOpenUrl:(NSNotification *)notification {
    NSURL *url = [notification object];
    if (url) {
        NSString *query = [url fragment];
        if (!query) {
            query = [url query];
        }
        NSDictionary *params = [self parseURLParams:query];
        if ([params objectForKey:@"link_click_id"]) {
            link_click_identifier = [params objectForKey:@"link_click_id"];
        }
    }
}

- (NSDictionary*)parseURLParams:(NSString *)query {
    NSArray *pairs = [query componentsSeparatedByString:@"&"];
    NSMutableDictionary *params = [[NSMutableDictionary alloc] init];
    for (NSString *pair in pairs) {
        NSArray *kv = [pair componentsSeparatedByString:@"="];
        if (kv.count > 1) {
            NSString *val = [[kv objectAtIndex:1]
                             stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
            [params setObject:val forKey:[kv objectAtIndex:0]];
        }
    }
    return params;
}

- (void)getInstallData:(CDVInvokedUrlCommand *)command {
    BOOL debug = [[command argumentAtIndex:0 withDefault:[NSNumber numberWithBool:NO]] boolValue];
    int isReferrable = [[command argumentAtIndex:0 withDefault:[NSNumber numberWithInt:-1]] intValue];

    NSMutableDictionary *post = [[NSMutableDictionary alloc] init];
    BOOL isRealHardwareId;
    NSString *hardwareId = [BNCDevice getUniqueHardwareId:&isRealHardwareId andIsDebug:debug];
    if (hardwareId) {
        [post setObject:hardwareId forKey:@"hardware_id"];
        [post setObject:[NSNumber numberWithBool:isRealHardwareId] forKey:@"is_hardware_id_real"];
    }
    NSString *appVersion = [BNCDevice getAppVersion];
    if (appVersion) [post setObject:appVersion forKey:@"app_version"];
    NSString *carrier = [BNCDevice getCarrier];
    if (carrier) [post setObject:carrier forKey:@"carrier"];
    if ([BNCDevice getBrand]) [post setObject:[BNCDevice getBrand] forKey:@"brand"];
    NSString *model = [BNCDevice getModel];
    if (model) [post setObject:model forKey:@"model"];
    if ([BNCDevice getOS]) [post setObject:[BNCDevice getOS] forKey:@"os"];
    NSString *osVersion = [BNCDevice getOSVersion];
    if (osVersion) [post setObject:osVersion forKey:@"os_version"];
    NSNumber *screenWidth = [BNCDevice getScreenWidth];
    if (screenWidth) [post setObject:screenWidth forKey:@"screen_width"];
    NSNumber *screenHeight = [BNCDevice getScreenHeight];
    if (screenHeight) [post setObject:screenHeight forKey:@"screen_height"];
    NSString *uriScheme = [BNCDevice getURIScheme];
    if (uriScheme) [post setObject:uriScheme forKey:@"uri_scheme"];
    NSNumber *updateState = [BNCDevice getUpdateState:YES];
    if (updateState) {
        [post setObject:updateState forKeyedSubscript:@"update"];
    }
    if (link_click_identifier) [post setObject:link_click_identifier forKey:@"link_identifier"];
    [post setObject:[NSNumber numberWithBool:[BNCDevice adTrackingSafe]] forKey:@"ad_tracking_enabled"];
    if (isReferrable < 0) {
        [post setObject:[NSNumber numberWithInteger:(updateState == nil)?1:0] forKey:@"is_referrable"];
    } else {
        [post setObject:[NSNumber numberWithInt:isReferrable] forKey:@"is_referrable"];
    }

    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:post];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void)getOpenData:(CDVInvokedUrlCommand *)command {
    int isReferrable = [[command argumentAtIndex:0 withDefault:[NSNumber numberWithInt:-1]] intValue];

    NSMutableDictionary *post = [[NSMutableDictionary alloc] init];

    NSString *appVersion = [BNCDevice getAppVersion];
    if (appVersion) [post setObject:appVersion forKey:@"app_version"];
    if ([BNCDevice getOS]) [post setObject:[BNCDevice getOS] forKey:@"os"];
    NSString *osVersion = [BNCDevice getOSVersion];
    if (osVersion) [post setObject:osVersion forKey:@"os_version"];
    NSString *uriScheme = [BNCDevice getURIScheme];
    if (uriScheme) [post setObject:uriScheme forKey:@"uri_scheme"];
    [post setObject:[NSNumber numberWithBool:[BNCDevice adTrackingSafe]] forKey:@"ad_tracking_enabled"];
    if (isReferrable < 0) {
        [post setObject:[NSNumber numberWithInteger:0] forKey:@"is_referrable"];
    } else {
        [post setObject:[NSNumber numberWithInt:isReferrable] forKey:@"is_referrable"];
    }
    if (link_click_identifier) [post setObject:link_click_identifier forKey:@"link_identifier"];

    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:post];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}


+ (NSString *)getUniqueHardwareId:(BOOL *)isReal andIsDebug:(BOOL)debug {
    NSString *uid = nil;
    *isReal = YES;

    Class ASIdentifierManagerClass = NSClassFromString(@"ASIdentifierManager");
    if (ASIdentifierManagerClass && !debug) {
        SEL sharedManagerSelector = NSSelectorFromString(@"sharedManager");
        id sharedManager = ((id (*)(id, SEL))[ASIdentifierManagerClass methodForSelector:sharedManagerSelector])(ASIdentifierManagerClass, sharedManagerSelector);
        SEL advertisingIdentifierSelector = NSSelectorFromString(@"advertisingIdentifier");
        NSUUID *uuid = ((NSUUID* (*)(id, SEL))[sharedManager methodForSelector:advertisingIdentifierSelector])(sharedManager, advertisingIdentifierSelector);
        uid = [uuid UUIDString];
    }

    if (!uid && NSClassFromString(@"UIDevice")) {
        uid = [[UIDevice currentDevice].identifierForVendor UUIDString];
    }

    if (!uid) {
        uid = [[NSUUID UUID] UUIDString];
        *isReal = NO;
    }

    return uid;
}

+ (BOOL)adTrackingSafe {
    Class ASIdentifierManagerClass = NSClassFromString(@"ASIdentifierManager");
    if (ASIdentifierManagerClass) {
        SEL sharedManagerSelector = NSSelectorFromString(@"sharedManager");
        id sharedManager = ((id (*)(id, SEL))[ASIdentifierManagerClass methodForSelector:sharedManagerSelector])(ASIdentifierManagerClass, sharedManagerSelector);
        SEL advertisingEnabledSelector = NSSelectorFromString(@"isAdvertisingTrackingEnabled");
        BOOL enabled = ((BOOL (*)(id, SEL))[sharedManager methodForSelector:advertisingEnabledSelector])(sharedManager, advertisingEnabledSelector);
        return enabled;
    }
    return YES;
}

+ (NSString *)getURIScheme {
    NSArray *urlTypes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleURLTypes"];
    if (urlTypes) {
        for (NSDictionary *urlType in urlTypes) {
            NSArray *urlSchemes = [urlType objectForKey:@"CFBundleURLSchemes"];
            if (urlSchemes) {
                for (NSString *urlScheme in urlSchemes) {
                    if (![[urlScheme substringWithRange:NSMakeRange(0, 2)] isEqualToString:@"fb"] &&
                        ![[urlScheme substringWithRange:NSMakeRange(0, 2)] isEqualToString:@"db"] &&
                        ![[urlScheme substringWithRange:NSMakeRange(0, 3)] isEqualToString:@"pin"]) {
                        return urlScheme;
                    }
                }
            }
        }
    }
    return nil;
}

+ (NSString *)getAppVersion {
    return [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleShortVersionString"];
}

+ (NSString *)getCarrier {
    NSString *carrierName = nil;

    Class CTTelephonyNetworkInfoClass = NSClassFromString(@"CTTelephonyNetworkInfo");
    if (CTTelephonyNetworkInfoClass) {
        id networkInfo = [[CTTelephonyNetworkInfoClass alloc] init];
        SEL subscriberCellularProviderSelector = NSSelectorFromString(@"subscriberCellularProvider");

        id carrier = ((id (*)(id, SEL))[networkInfo methodForSelector:subscriberCellularProviderSelector])(networkInfo, subscriberCellularProviderSelector);
        if (carrier) {
            SEL carrierNameSelector = NSSelectorFromString(@"carrierName");
            carrierName = ((NSString* (*)(id, SEL))[carrier methodForSelector:carrierNameSelector])(carrier, carrierNameSelector);
        }
    }

    return carrierName;
}

+ (NSString *)getBrand {
    return @"Apple";
}

+ (NSString *)getModel {
    struct utsname systemInfo;
    uname(&systemInfo);

    return [NSString stringWithCString:systemInfo.machine encoding:NSUTF8StringEncoding];
}

+ (BOOL)isSimulator {
    UIDevice *currentDevice = [UIDevice currentDevice];
    return [currentDevice.model rangeOfString:@"Simulator"].location != NSNotFound;
}

+ (NSString *)getDeviceName {
    if ([BNCDevice isSimulator]) {
        struct utsname name;
        uname(&name);
        return [NSString stringWithFormat:@"%@ %s", [[UIDevice currentDevice] name], name.nodename];
    } else {
        return [[UIDevice currentDevice] name];
    }
}

+ (NSNumber *)getUpdateState:(BOOL)updateState {
    NSUserDefaults *defs = [NSUserDefaults standardUserDefaults];
    NSString *storedAppVersion = [defs objectForKey:@"bnc_app_version"];
    NSString *currentAppVersion = [BNCDevice getAppVersion];
    NSFileManager *manager = [NSFileManager defaultManager];

    // for creation date
    NSURL *documentsDirRoot = [[[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask] lastObject];
    NSDictionary *documentsDirAttributes = [manager attributesOfItemAtPath:documentsDirRoot.path error:nil];
    int appCreationDay = (int)([[documentsDirAttributes fileCreationDate] timeIntervalSince1970]/(60*60*24));

    // for modification date
    NSString *bundleRoot = [[NSBundle mainBundle] bundlePath];
    NSDictionary *bundleAttributes = [manager attributesOfItemAtPath:bundleRoot error:nil];
    int appModificationDay = (int)([[bundleAttributes fileModificationDate] timeIntervalSince1970]/(60*60*24));

    if (!storedAppVersion) {
        if (updateState) {
            [defs setValue:currentAppVersion forKey:@"bnc_app_version"];
        }
        if ([documentsDirAttributes fileCreationDate] && [bundleAttributes fileModificationDate] && (appCreationDay != appModificationDay)) {
            return [NSNumber numberWithInt:2];
        }
        return nil;
    } else if (![storedAppVersion isEqualToString:currentAppVersion]) {
        if (updateState) {
            [defs setValue:currentAppVersion forKey:@"bnc_app_version"];
        }
        return [NSNumber numberWithInt:2];
    } else {
        return [NSNumber numberWithInt:1];
    }
}

+ (NSString *)getOS {
    return @"iOS";
}

+ (NSString *)getOSVersion {
    UIDevice *device = [UIDevice currentDevice];
    return [device systemVersion];
}

+ (NSNumber *)getScreenWidth {
    UIScreen *mainScreen = [UIScreen mainScreen];
    float scaleFactor = mainScreen.scale;
    CGFloat width = mainScreen.bounds.size.width * scaleFactor;
    return [NSNumber numberWithInteger:(NSInteger)width];
}

+ (NSNumber *)getScreenHeight {
    UIScreen *mainScreen = [UIScreen mainScreen];
    float scaleFactor = mainScreen.scale;
    CGFloat height = mainScreen.bounds.size.height * scaleFactor;
    return [NSNumber numberWithInteger:(NSInteger)height];
}

@end
