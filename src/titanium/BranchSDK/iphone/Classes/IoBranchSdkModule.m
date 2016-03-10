/**
 * BranchSDK
 *
 * Created by Your Name
 * Copyright (c) 2015 Your Company. All rights reserved.
 */

#import "IoBranchSdkModule.h"
#import "TiBase.h"
#import "TiHost.h"
#import "TiUtils.h"
#import "BNCDevice.h"

@implementation IoBranchSdkModule

#pragma mark Internal

// this is generated for your module, please do not change it
-(id)moduleGUID
{
	return @"90040444-98e6-4865-899f-3b8f3e020bae";
}

// this is generated for your module, please do not change it
-(NSString*)moduleId
{
	return @"io.branch.sdk";
}

#pragma mark Lifecycle

-(void)startup
{
	// this method is called when the module is first loaded
	// you *must* call the superclass
	[super startup];

	NSLog(@"[INFO] %@ loaded",self);
}

-(void)shutdown:(id)sender
{
	// this method is called when the module is being unloaded
	// typically this is during shutdown. make sure you don't do too
	// much processing here or the app will be quit forceably

	// you *must* call the superclass
	[super shutdown:sender];
}

#pragma mark Cleanup

-(void)dealloc
{
	// release any resources that have been retained by the module
	[super dealloc];
}

#pragma mark Internal Memory Management

-(void)didReceiveMemoryWarning:(NSNotification*)notification
{
	// optionally release any resources that can be dynamically
	// reloaded once memory is available - such as caches
	[super didReceiveMemoryWarning:notification];
}

#pragma mark Listener Notifications

-(void)_listenerAdded:(NSString *)type count:(int)count
{
	if (count == 1 && [type isEqualToString:@"my_event"])
	{
		// the first (of potentially many) listener is being added
		// for event named 'my_event'
	}
}

-(void)_listenerRemoved:(NSString *)type count:(int)count
{
	if (count == 0 && [type isEqualToString:@"my_event"])
	{
		// the last listener called for event named 'my_event' has
		// been removed, we can optionally clean up any resources
		// since no body is listening at this point for that event
	}
}

#pragma Public APIs

- (id)getInstallData:(id)args {
    NSArray *array = (NSArray *)args;
    NSLog(@"In getInstallData.  %d args.", array.count);
    BOOL debug = [TiUtils boolValue:[array objectAtIndex:0] def:NO];
    int isReferrable = [TiUtils intValue:[array objectAtIndex:1] def:-1];
    
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
//    if (link_click_identifier) [post setObject:link_click_identifier forKey:@"link_identifier"];
    [post setObject:[NSNumber numberWithBool:[BNCDevice adTrackingSafe]] forKey:@"ad_tracking_enabled"];
    if (isReferrable < 0) {
        [post setObject:[NSNumber numberWithInteger:(updateState == nil)?1:0] forKey:@"is_referrable"];
    } else {
        [post setObject:[NSNumber numberWithInt:isReferrable] forKey:@"is_referrable"];
    }
    
    return post;
}

- (id)getOpenData:(id)args {
    int isReferrable = [TiUtils intValue:[args objectAtIndex:0] def:-1];
    
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
//    if (link_click_identifier) [post setObject:link_click_identifier forKey:@"link_identifier"];
    
    return post;
}

@end
