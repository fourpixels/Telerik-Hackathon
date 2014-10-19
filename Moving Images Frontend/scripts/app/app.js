pictureToUpload = '';

var app = (function (win) {
    'use strict';
	
	var fs;
	var fsReady = false;
	var localImages;
	var buildStarted;

    // Global error handling
    var showAlert = function(message, title, callback, throwStack) {
		try {
			navigator.notification.alert(message, callback || function () {}, title, 'OK');
		} catch (err) {
			console.log(' >>> ', message);
			alert(message);
			
			if (throwStack === true) {
				console.log(err.stack);
			}
		}
    };
	
	var divDebug = function(message) {
		$('#debugDiv').append('<p>' + message + '</p>');
	};

    var showError = function(message) {
        showAlert(message, 'Error occured', null, true);
    };

    win.addEventListener('error', function (e) {
        e.preventDefault();

        var message = e.message + "' from " + e.filename + ":" + e.lineno;

        showAlert(message, 'Error occured');

        return true;
    });

    // Global confirm dialog
    var showConfirm = function(message, title, callback) {
        navigator.notification.confirm(message, callback || function () {
        }, title, ['OK', 'Cancel']);
    };

    var isNullOrEmpty = function (value) {
        return typeof value === 'undefined' || value === null || value === '';
    };

    var isKeySet = function (key) {
        var regEx = /^\$[A-Z_]+\$$/;
        return !isNullOrEmpty(key) && !regEx.test(key);
    };

    var fixViewResize = function () {
        if (device.platform === 'iOS') {
            setTimeout(function() {
                $(document.body).height(window.innerHeight);
            }, 10);
        }
    };

    // Handle device back button tap
    var onBackKeyDown = function(e) {
        e.preventDefault();

        navigator.notification.confirm('Do you really want to exit?', function (confirmed) {
            var exit = function () {
                navigator.app.exitApp();
            };

            if (confirmed === true || confirmed === 1) {
                // Stop EQATEC analytics monitor on app exit
                if (analytics.isAnalytics()) {
                    analytics.Stop();
                }
                AppHelper.logout().then(exit, exit);
            }
        }, 'Exit', ['OK', 'Cancel']);
    };

    var onDeviceReady = function() {
        // Handle "backbutton" event
        document.addEventListener('backbutton', onBackKeyDown, false);
		
		if (device.platform === 'iOS' && parseFloat(device.version) >= 7.0) {
			document.body.style.marginTop = "20px";
		}

        navigator.splashscreen.hide();
        fixViewResize();

        if (analytics.isAnalytics()) {
            analytics.Start();
        }
        
        // Initialize AppFeedback
        if (app.isKeySet(appSettings.feedback.apiKey)) {
            try {
                feedback.initialize(appSettings.feedback.apiKey);
            } catch (err) {
                console.log('Something went wrong:');
                console.log(err);
            }
        } else {
            console.log('Telerik AppFeedback API key is not set. You cannot use feedback service.');
        }
		
		//fixViewPort();
		
		fs = filesys();
		fs.getSystem(fsReadyCallback);
		
		console.log('currentUser:', app.Users.currentUser);
    };
	
	
	function fixViewPort() {
		        var orgWidth; 
        var orgHeight; 
    if(window.localStorage.getItem('orgWidth')==null){ 
            orgWidth=screen.width; 
            orgHeight=screen.height; 
            window.localStorage.setItem('orgWidth',orgWidth) 
            window.localStorage.setItem('orgHeight',orgHeight) 
    }else { 
            orgWidth=parseInt(window.localStorage.getItem('orgWidth')); 
            orgHeight=parseInt(window.localStorage.getItem('orgHeight')); 
            if(orgWidth<screen.width){ 
                      orgWidth=screen.width; 
                      orgHeight=screen.height; 
                      window.localStorage.setItem('orgWidth',orgWidth) 
                      window.localStorage.setItem('orgHeight',orgHeight) 
            } 
    } 

  var nScale=orgWidth/320; 
  if(orgHeight/480<nScale)nScale=orgHeight/480; 
  var transx=((orgWidth-320)/2)/nScale; 
  var transy=((orgHeight-480)/2)/nScale; 
  if(orgHeight/nScale-480>0){ 
          transy=transy-(orgHeight/nScale-480)/2 
  } 
  if(nScale!=1){ 
        document.body.style.webkitTransform="scale("+nScale+","+nScale+") translate("+transx+"px, "+transy+"px)"; 
        document.body.style.width="320px"; 
        document.body.style.height="480px"; 
  } 

	}
	
	
	function fsReadyCallback(path) {
		fsReady = true;
		
		/*if (path)
			createGif();
		
		var paths = fs.generateImagesArray(appSettings.config.numberOfImagesToSave);
		if (!paths)
			divDebug('paths is NULL FUCK U BITCH!');
		
		divDebug('paths.length:' + paths.length);
		for (var i = 0; i < paths.length; i++) {
			divDebug(paths[i]);
		}*/
	}
	
	
	var createGif = function() {
		alert('app :: createGif');
		if (!fsReady) {
			showAlert('app :: createGif -> file sys is not ready!');
			return;
		}
		
		buildStarted = false;
		
		var numImages = appSettings.config.numberOfImagesToSave;
		localImages = new Array();
		
		for (var i = 0; i < numImages; i++) {
			var img = new Image();
			img.onload = checkImagesLoaded;
			localImages.push(img);
		}
		
		for (var i = 0; i < numImages; i++) {
			localImages[i].src = fs.getImageFilePath(i);//"styles/images/gifjs/anim" + (i + 1) + ".jpg";
		}
	}
	
	function checkImagesLoaded() {
		
		var numImages = appSettings.config.numberOfImagesToSave;
		
		for (var i = 0; i < numImages; i++) {
			if (!localImages[i].complete) {
				console.log('still loading', i);
				console.log(localImages);
				return;
			}
		}
		
		//console.log('all images loaded');
		if (buildStarted) {
			return;
		}
			
		buildStarted = true;
		
		console.log('build started', localImages);
		showAlert('build started');
		
		var isLandscape = localImages[0].clientWidth > localImages[0].clientHeight;
		var iWidth = isLandscape ? 1920 : 1088;
		var iHeight = isLandscape ? 1088 : 1920;
		var newWidth = 310;
		var scaleFactor = iWidth / newWidth;
		iWidth = newWidth;
		iHeight = iHeight / scaleFactor;
		
		var gif = new GIF({
			workers: 4,
			quality: 5,
			width: iWidth,
			height: iHeight
		});
		
		
		
		for (var i = 0; i < numImages; i++) {
			gif.addFrame(localImages[i], { delay: i == Math.round(numImages / 2) ? 1500 : 100 });
		}
		
		
		
		gif.on('finished', function(blob) {
			console.log('on gifjs finished');
			showAlert('build finished');
			//$('#gifjs1').attr('src', URL.createObjectURL(blob));
			pictureToUpload = blob; // save the image so it can be uploaded later
			
			app.AddActivity.publicSaveActivity(pictureToUpload, onActivityPublished, 'test text');
			
			//window.open(URL.createObjectURL(blob));
		});
		
		gif.render();
	}
	
	function onActivityPublished() {
		console.log('YES MADAFAKA');
		showAlert('YES MADAFAKA');
	}
	
	
	function fileSystem() {
		return fs;
	}

    // Handle "deviceready" event
    document.addEventListener('deviceready', onDeviceReady, false);
    // Handle "orientationchange" event
    document.addEventListener('orientationchange', fixViewResize);

    // Initialize Everlive SDK
    var el = new Everlive({
                              apiKey: appSettings.everlive.apiKey,
                              scheme: appSettings.everlive.scheme
                          });

    var emptyGuid = '00000000-0000-0000-0000-000000000000';

    var AppHelper = {

        // Return user profile picture url
        resolveProfilePictureUrl: function (id) {
            if (id && id !== emptyGuid) {
                return el.Files.getDownloadUrl(id);
            } else {
                return 'styles/images/avatar.png';
            }
        },

        // Return current activity picture url
        resolvePictureUrl: function (id) {
            if (id && id !== emptyGuid) {
                return el.Files.getDownloadUrl(id);
            } else {
                return '';
            }
        },

        // Date formatter. Return date in d.m.yyyy format
        formatDate: function (dateString) {
            return kendo.toString(new Date(dateString), 'MMM d, yyyy');
        },

        // Current user logout
        logout: function () {
            return el.Users.logout();
        }
    };

    var os = kendo.support.mobileOS,
        statusBarStyle = os.ios && os.flatVersion >= 700 ? 'black-translucent' : 'black';

    // Initialize KendoUI mobile application
    var mobileApp = new kendo.mobile.Application(document.body, {
                                                     transition: 'slide',
                                                     //statusBarStyle: statusBarStyle, // this Holly Grail doesn't seem to work! Margin-hack works better (puke)
                                                     skin: 'flat'
                                                 });

    var getYear = (function () {
        return new Date().getFullYear();
    }());

    return {
		divDebug: divDebug,
		createGif: createGif,
		fileSystem: fileSystem,
        showAlert: showAlert,
        showError: showError,
        showConfirm: showConfirm,
        isKeySet: isKeySet,
        mobileApp: mobileApp,
        helper: AppHelper,
        everlive: el,
        getYear: getYear
    };
}(window));

hackMePlenty = window.hackMePlenty = app;