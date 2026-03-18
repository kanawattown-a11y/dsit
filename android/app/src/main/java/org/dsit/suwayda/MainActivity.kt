package org.dsit.suwayda

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.webkit.*
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var splashOverlay: android.view.View

    // For File Chooser / Camera
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var cameraPhotoPath: String? = null

    // URL to load
    private val dsitUrl = "https://dsit-suwayda.org"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        splashOverlay = findViewById(R.id.splashOverlay)

        requestPermissionsIfNeeded()
        setupWebView()
        
        if (savedInstanceState == null) {
            webView.loadUrl(dsitUrl)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings
        
        // General Settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.setSupportZoom(false)
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        
        // Media & Geolocation
        settings.mediaPlaybackRequiresUserGesture = false
        settings.setGeolocationEnabled(true)

        // Caching & Cookies (CRITICAL FOR 90-DAY SESSION PERSISTENCE)
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(webView, true)
        
        // Ensure cookies are saved to disk immediately (flushed)
        CookieManager.getInstance().flush()

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url.toString()
                if (url.startsWith(dsitUrl)) {
                    return false // Let WebView handle internal links
                }
                // Open external links in external browser
                val intent = Intent(Intent.ACTION_VIEW, request?.url)
                startActivity(intent)
                return true
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress == 100) {
                    if (splashOverlay.visibility == android.view.View.VISIBLE) {
                        splashOverlay.animate()
                            .alpha(0f)
                            .setDuration(500)
                            .withEndAction {
                                splashOverlay.visibility = android.view.View.GONE
                            }
                    }
                }
            }

            // Grant WebView permissions for Camera, Mic, Geolocation
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.grant(request.resources)
            }

            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                callback?.invoke(origin, true, false)
            }

            // Handle File Uploads & Camera (Selfie/ID photos)
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback

                // Check Camera Permissions before opening picker
                val hasCameraPerm = ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
                
                var takePictureIntent: Intent? = null
                if (hasCameraPerm) {
                    takePictureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
                    if (takePictureIntent.resolveActivity(packageManager) != null) {
                        var photoFile: File? = null
                        try {
                            photoFile = createImageFile()
                            takePictureIntent.putExtra("PhotoPath", cameraPhotoPath)
                        } catch (ex: IOException) {
                            // Error occurred while creating the File
                        }
                        if (photoFile != null) {
                            cameraPhotoPath = "file:" + photoFile.absolutePath
                            val photoURI = FileProvider.getUriForFile(
                                this@MainActivity,
                                "${applicationContext.packageName}.provider",
                                photoFile
                            )
                            takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI)
                        } else {
                            takePictureIntent = null
                        }
                    }
                } else {
                    // Trigger runtime permissions dynamically if previously denied
                    ActivityCompat.requestPermissions(this@MainActivity, arrayOf(Manifest.permission.CAMERA), 101)
                    // We don't block the file picker entirely (they might just want gallery)
                    // but we won't present the camera option this time until permission is granted.
                }

                val contentSelectionIntent = Intent(Intent.ACTION_GET_CONTENT)
                contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE)
                contentSelectionIntent.type = "image/*"

                val intentArray: Array<Intent> = if (takePictureIntent != null) {
                    arrayOf(takePictureIntent)
                } else {
                    emptyArray()
                }

                val chooserIntent = Intent(Intent.ACTION_CHOOSER)
                chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent)
                chooserIntent.putExtra(Intent.EXTRA_TITLE, "اختر صورة أو التقط سيلفي")
                chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, intentArray)

                try {
                    fileChooserLauncher.launch(chooserIntent)
                } catch (e: ActivityNotFoundException) {
                    this@MainActivity.filePathCallback = null
                    return false
                }
                return true
            }
        }
        
        // Ensure Service Workers can intercept Background Push Notifications
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            ServiceWorkerController.getInstance().serviceWorkerWebSettings.allowContentAccess = true
            ServiceWorkerController.getInstance().serviceWorkerWebSettings.allowFileAccess = true
        }
    }

    private val fileChooserLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        var results: Array<Uri>? = null
        if (result.resultCode == Activity.RESULT_OK) {
            if (result.data == null || result.data?.data == null) {
                // If there is no data, then we may have taken a photo
                if (cameraPhotoPath != null) {
                    results = arrayOf(Uri.parse(cameraPhotoPath))
                }
            } else {
                val dataString = result.data?.dataString
                if (dataString != null) {
                    results = arrayOf(Uri.parse(dataString))
                }
            }
        }
        filePathCallback?.onReceiveValue(results)
        filePathCallback = null
    }

    @Throws(IOException::class)
    private fun createImageFile(): File {
        val timeStamp: String = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.ENGLISH).format(Date())
        val imageFileName = "JPEG_" + timeStamp + "_"
        val storageDir: File? = getExternalFilesDir(Environment.DIRECTORY_PICTURES)
        return File.createTempFile(
            imageFileName,
            ".jpg",
            storageDir
        )
    }

    private fun requestPermissionsIfNeeded() {
        val permissions = mutableListOf<String>()

        // Notification Permission for Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        // Camera Permission
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.CAMERA)
        }

        if (permissions.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissions.toTypedArray(), 100)
        }
    }

    // Handle Back Press in WebView
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    // Save Restore state on rotate
    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onRestoreInstanceState(savedInstanceState: Bundle) {
        super.onRestoreInstanceState(savedInstanceState)
        webView.restoreState(savedInstanceState)
    }

    override fun onPause() {
        super.onPause()
        CookieManager.getInstance().flush()
    }

    override fun onDestroy() {
        CookieManager.getInstance().flush()
        super.onDestroy()
    }
}
