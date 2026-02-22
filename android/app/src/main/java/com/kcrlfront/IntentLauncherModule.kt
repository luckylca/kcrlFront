package com.kcrlfront

import android.content.Intent
import android.content.ComponentName
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class IntentLauncherModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "IntentLauncher"

    @ReactMethod
    fun openAutoStartActivity(promise: Promise) {
        try {
            val intent = Intent()
            intent.component = ComponentName(
                "com.idlike.kctrl.service",
                "com.idlike.kctrl.service.AutoStartActivity"
            )
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR_OPEN_ACTIVITY", e.message)
        }
    }
}