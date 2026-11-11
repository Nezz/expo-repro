package com.example.spotifynobrowser

import android.app.Activity
import android.os.Bundle
import com.spotify.sdk.android.auth.AuthorizationClient
import com.spotify.sdk.android.auth.AuthorizationRequest
import com.spotify.sdk.android.auth.AuthorizationResponse

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (savedInstanceState == null) {
            val request = AuthorizationRequest.Builder(
                "any-client-id",
                AuthorizationResponse.Type.CODE,
                "spotifynobrowser://callback",
            ).build()
            AuthorizationClient.openLoginActivity(this, 1, request)
        }
    }
}
