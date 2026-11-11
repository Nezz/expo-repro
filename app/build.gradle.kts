plugins {
    id("com.android.application")
}

android {
    namespace = "com.example.spotifynobrowser"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.example.spotifynobrowser"
        minSdk = 24
        targetSdk = 36
    }
}

dependencies {
    implementation("com.spotify.android:auth:5.0.0")
}
