package com.clippedsubviewsrepro

import android.app.Application
import android.util.Log
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlagsDefaults

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    if (BuildConfig.KEEP_MOUNT_ORDER) {
      // Control, built with -PkeepMountOrder=true: FabricMountingManager keeps mount items,
      // deletes included, in mutation order.
      ReactNativeFeatureFlags.dangerouslyForceOverride(
        object : ReactNativeNewArchitectureFeatureFlagsDefaults() {
          override fun disableMountItemReorderingAndroid(): Boolean = true
        },
      )
    }
    Log.i(
      "ClippedSubviewsRepro",
      "disableMountItemReorderingAndroid=${ReactNativeFeatureFlags.disableMountItemReorderingAndroid()}",
    )
  }
}
