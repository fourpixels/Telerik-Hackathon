package com.google.zxing;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.util.List;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Point;
import android.graphics.Rect;
import android.graphics.YuvImage;
import android.hardware.Camera;
import android.hardware.Camera.PreviewCallback;
import android.hardware.Camera.Size;
import android.os.Bundle;
import android.os.Environment;
import android.view.Display;
import android.view.KeyEvent;
import android.view.Surface;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.Toast;

import com.google.zxing.client.android.R;

/**
 * Telerik Hackathon 2014, team "2 wise men".
 * 
 * Saves a number of images from the camers preview view to specified locations.
 * 
 * @author Ilian Nikolov
 * @date 10/18/2014
 */
public class PreviewActivity extends Activity implements SurfaceHolder.Callback {

    private SurfaceView surfaceView;
    private SurfaceHolder surfaceHolder;
    private Button captureButton;

    private YuvImage yuvImage;
    private Camera camera;
    private Camera.Parameters cameraParams;

    private int displayHeight, displayWidth;

    private boolean takePictureRequest;

    private int picturesSaved = 0;

    private String[] imgPaths;
    private ProgressBar loading;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (getIntent().getExtras() != null && getIntent().getExtras().containsKey("imagePaths")) { //TODO separate in constants
           imgPaths = getIntent().getExtras().getStringArray("imagePaths");
        } else {
            setResult(RESULT_CANCELED, new Intent().putExtra("SCAN_RESULT", "Missing image paths"));
            finish();
        }

        setContentView(R.layout.activity_preview);

        Point size = new Point();
        Display display = getWindowManager().getDefaultDisplay();
        display.getSize(size);
        displayHeight = size.y;
        displayWidth = size.x;

        surfaceView = (SurfaceView) findViewById(R.id.cameraPreview);
        loading = (ProgressBar) findViewById(R.id.loading);

        captureButton = (Button) findViewById(R.id.captureButton);

        captureButton.setOnClickListener(new OnClickListener() {

            @Override
            public void onClick(View v) {
                takePictureRequest = true;
                loading.setVisibility(ProgressBar.VISIBLE);
            }
        });

        surfaceHolder = surfaceView.getHolder();
        surfaceHolder.addCallback(this);
    }

    @Override
    protected void onResume() {
        camera = Camera.open();
        previewCamera();
        super.onResume();
    }

    @Override
    protected void onPause() {
        camera.setPreviewCallback(null);
        camera.stopPreview();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (camera != null) {
            camera.release();
        }
        camera = null;
        super.onDestroy();
    }

    @Override
    public void surfaceChanged(SurfaceHolder holder, int format, int width, int height) {
        camera.stopPreview();
        previewCamera();
    }

    @Override
    public void surfaceCreated(SurfaceHolder holder) {
    }

    @Override
    public void surfaceDestroyed(SurfaceHolder holder) {
    }

    public void previewCamera() {
        try {
            updateCameraSettings();
            camera.setPreviewDisplay(surfaceHolder);
            camera.setPreviewCallback(onPreview);
            camera.startPreview();
        } catch (Exception e) {
            Toast.makeText(getApplicationContext(), "Error starting preview: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    public void updateCameraSettings() {
        // Initializing camera parameters
        cameraParams = camera.getParameters();

        Display display = getWindowManager().getDefaultDisplay();

        List<Size> supportedPreviewSizes = camera.getParameters().getSupportedPreviewSizes();
        Size biggestSupportedSize = getOptimalPreviewSize(supportedPreviewSizes, displayWidth, displayHeight);
        cameraParams.setPreviewSize(biggestSupportedSize.width, biggestSupportedSize.height);
        if (display.getRotation() == Surface.ROTATION_0) {
            camera.setDisplayOrientation(90);
        } else if (display.getRotation() == Surface.ROTATION_180) {
            camera.setDisplayOrientation(270);
        } else if (display.getRotation() == Surface.ROTATION_270) {
            camera.setDisplayOrientation(180);
        }
        camera.setParameters(cameraParams);
    }

    private Camera.Size getOptimalPreviewSize(List<Camera.Size> sizes, int w, int h) {
        final double ASPECT_TOLERANCE = 0.1;
        double targetRatio = (double) h / w;

        if (sizes == null)
            return null;

        Camera.Size optimalSize = null;
        double minDiff = Double.MAX_VALUE;

        int targetHeight = h;

        for (Camera.Size size : sizes) {
            double ratio = (double) size.width / size.height;
            if (Math.abs(ratio - targetRatio) > ASPECT_TOLERANCE)
                continue;
            if (Math.abs(size.height - targetHeight) < minDiff) {
                optimalSize = size;
                minDiff = Math.abs(size.height - targetHeight);
            }
        }

        if (optimalSize == null) {
            minDiff = Double.MAX_VALUE;
            for (Camera.Size size : sizes) {
                if (Math.abs(size.height - targetHeight) < minDiff) {
                    optimalSize = size;
                    minDiff = Math.abs(size.height - targetHeight);
                }
            }
        }
        return optimalSize;
    }

    private PreviewCallback onPreview = new PreviewCallback() {
        @Override
        public void onPreviewFrame(byte[] data, Camera camera) {
            if (takePictureRequest) {
                Size size = cameraParams.getPreviewSize();

                yuvImage = new YuvImage(data, cameraParams.getPreviewFormat(), size.width, size.height, null);
                File file = new File(Environment.getExternalStorageDirectory().getPath() + "/out" + picturesSaved + ".jpg"); //TODO use given paths, eg imgPaths[picturesSaved] 
                FileOutputStream filecon;
                try {
                    filecon = new FileOutputStream(file);
                    yuvImage.compressToJpeg(new Rect(0, 0, yuvImage.getWidth(), yuvImage.getHeight()), 90, filecon);
                    picturesSaved++;
                    if (picturesSaved > imgPaths.length) {
                        setResult(RESULT_OK, new Intent().putExtra("SCAN_RESULT", "Success."));
                        stopTakingPictures();
                    }
                } catch (FileNotFoundException e) {
                    Toast.makeText(getBaseContext(), e.getMessage(), Toast.LENGTH_LONG).show();
                    setResult(RESULT_CANCELED, new Intent().putExtra("SCAN_RESULT", "Error saving images"));
                    stopTakingPictures();
                    e.printStackTrace();
                }
            }
        }
    };

    private void stopTakingPictures() {
        takePictureRequest = false;
        picturesSaved = 0;
        loading.setVisibility(ProgressBar.INVISIBLE);
        finish();
    }
    
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        switch(keyCode){
        case KeyEvent.KEYCODE_BACK:
            setResult(RESULT_CANCELED, new Intent().putExtra("SCAN_RESULT", "Cancelled"));
            return false; //let the app continue
        }
        return super.onKeyDown(keyCode, event);
    }
}
