// Minimal repro: after UMP's consent form is dismissed, its web view stays in the key window's accessibility tree.
// Requests consent info as in the EEA (debug geography) and presents the form if required. The screen behind it has
// one label, "App screen", and a status label.
#import <UIKit/UIKit.h>
#import <UserMessagingPlatform/UserMessagingPlatform.h>

@interface ViewController : UIViewController
@property(nonatomic, strong) UILabel *status;
@end

@implementation ViewController
- (void)viewDidLoad {
  [super viewDidLoad];
  self.view.backgroundColor = UIColor.whiteColor;
  UILabel *title = [[UILabel alloc] initWithFrame:CGRectMake(20, 200, 340, 50)];
  title.text = @"App screen";
  [self.view addSubview:title];
  self.status = [[UILabel alloc] initWithFrame:CGRectMake(20, 260, 340, 50)];
  self.status.text = @"requesting";
  [self.view addSubview:self.status];
}
- (void)viewDidAppear:(BOOL)animated {
  [super viewDidAppear:animated];
  UMPRequestParameters *parameters = [UMPRequestParameters new];
  UMPDebugSettings *debug = [UMPDebugSettings new];
  debug.geography = UMPDebugGeographyEEA;
  parameters.debugSettings = debug;
  [UMPConsentInformation.sharedInstance reset];
  [UMPConsentInformation.sharedInstance
      requestConsentInfoUpdateWithParameters:parameters
                           completionHandler:^(NSError *error) {
                             if (error) {
                               self.status.text = error.localizedDescription;
                               return;
                             }
                             [UMPConsentForm loadAndPresentIfRequiredFromViewController:self
                                                                      completionHandler:^(NSError *formError) {
                                                                        self.status.text =
                                                                            formError ? formError.localizedDescription
                                                                                      : @"form closed";
                                                                      }];
                           }];
}
@end

@interface AppDelegate : UIResponder <UIApplicationDelegate>
@property(nonatomic, strong) UIWindow *window;
@end

@implementation AppDelegate
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)options {
  self.window = [[UIWindow alloc] initWithFrame:UIScreen.mainScreen.bounds];
  self.window.rootViewController = [ViewController new];
  [self.window makeKeyAndVisible];
  return YES;
}
@end

int main(int argc, char *argv[]) {
  @autoreleasepool {
    return UIApplicationMain(argc, argv, nil, NSStringFromClass(AppDelegate.class));
  }
}
