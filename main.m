// Minimal repro: GADCloseButton reads NotEnabled (accessibility) while its ad's close works. Shows Google's test
// interstitial 2 s after it loads.
#import <UIKit/UIKit.h>
#import <GoogleMobileAds/GoogleMobileAds.h>

@interface ViewController : UIViewController <GADFullScreenContentDelegate>
@property(nonatomic, strong) GADInterstitialAd *ad;
@property(nonatomic, strong) UILabel *status;
@end

@implementation ViewController
- (void)viewDidLoad {
  [super viewDidLoad];
  self.view.backgroundColor = UIColor.whiteColor;
  UIButton *show = [UIButton buttonWithType:UIButtonTypeSystem];
  [show setTitle:@"Show interstitial" forState:UIControlStateNormal];
  show.frame = CGRectMake(20, 200, 300, 50);
  [show addTarget:self action:@selector(showAd) forControlEvents:UIControlEventTouchUpInside];
  [self.view addSubview:show];
  self.status = [[UILabel alloc] initWithFrame:CGRectMake(20, 260, 340, 50)];
  self.status.text = @"loading";
  [self.view addSubview:self.status];
  [GADMobileAds.sharedInstance startWithCompletionHandler:nil];
  [GADInterstitialAd loadWithAdUnitID:@"ca-app-pub-3940256099942544/4411468910"
                              request:[GADRequest request]
                    completionHandler:^(GADInterstitialAd *ad, NSError *error) {
                      self.ad = ad;
                      ad.fullScreenContentDelegate = self;
                      self.status.text = error ? error.localizedDescription : @"loaded";
                      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 2 * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
                        [self showAd];
                      });
                    }];
}
- (void)showAd {
  [self.ad presentFromRootViewController:self];
}
- (void)adDidDismissFullScreenContent:(id<GADFullScreenPresentingAd>)ad {
  self.status.text = @"dismissed";
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
