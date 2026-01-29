package com.schooltree.parentapp

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class BrandModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "BrandModule"

    override fun getConstants(): MutableMap<String, Any> {
        return hashMapOf(
            "BRAND_ID" to BuildConfig.BRAND_ID,
            "AUTH_TYPE" to BuildConfig.AUTH_TYPE,
            "DB_NAME" to BuildConfig.DB_NAME,
            "APPLICATION_ID" to BuildConfig.APPLICATION_ID,
            "FLAVOR" to BuildConfig.FLAVOR
        )
    }

    @ReactMethod
    fun getBrandId(promise: Promise) {
        promise.resolve(BuildConfig.BRAND_ID)
    }

    @ReactMethod
    fun getAuthType(promise: Promise) {
        promise.resolve(BuildConfig.AUTH_TYPE)
    }

    @ReactMethod
    fun getDbName(promise: Promise) {
        promise.resolve(BuildConfig.DB_NAME)
    }
}
