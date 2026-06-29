package com.example

import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    setContent {
      MyApplicationTheme {
        Scaffold(
          modifier = Modifier.fillMaxSize(),
          contentWindowInsets = androidx.compose.foundation.layout.WindowInsets(0, 0, 0, 0) // zero insets for absolute full-screen bleed
        ) { innerPadding ->
          GameWebView(modifier = Modifier.fillMaxSize())
        }
      }
    }
  }
}

@Composable
fun GameWebView(modifier: Modifier = Modifier) {
  AndroidView(
    factory = { context ->
      WebView(context).apply {
        layoutParams = ViewGroup.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.MATCH_PARENT
        )
        
        // Performance & Feature Settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.databaseEnabled = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        
        // Immersive Full-Screen Viewport Configuration
        settings.mediaPlaybackRequiresUserGesture = false
        
        // Prevent background flicker/white flash before HTML styles are processed
        setBackgroundColor(android.graphics.Color.parseColor("#08080c"))
        setLayerType(View.LAYER_TYPE_HARDWARE, null)
        
        webViewClient = object : WebViewClient() {
          override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
            // Make WebView visible and fade in
            view?.visibility = View.VISIBLE
          }
        }
        webChromeClient = WebChromeClient()
        
        // Load the local HTML5 asset
        loadUrl("file:///android_asset/index.html")
      }
    },
    modifier = modifier
  )
}

