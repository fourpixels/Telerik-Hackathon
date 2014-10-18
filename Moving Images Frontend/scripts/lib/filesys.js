var filesys = function() {
	
	var folderName = 'testbtch';//"telerik/moving/images";
	var fileName = "imageX.png";
	var folderPath = '';
	var readyCallback;
	
	function getFilesystem(success, fail) {
		console.log('getFilesystem');
		window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
		console.log(window.requestFileSystem);
		
		window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, success, fail);
	}

	function getFolder(fileSystem, folderName, success, fail) {
		fileSystem.root.getDirectory(folderName, {create: true, exclusive: false}, success, fail)
	}
	
	function generateImagesArray(numOfImages) {
		var paths = new Array();
		for (var i = 0; i < numOfImages; i++) {
			paths.push(folderPath + "\/" + fileName.replace("X", i));
		}
		
		return paths;
	}
		
	function getSystem(callback) {
		readyCallback = callback;
		getFilesystem(
			function(fileSystem) {
				console.log("gotFS");
				console.log('platform:', device.platform);
				app.showAlert('gotFS: ' + device.platform);
				app.divDebug('gotFS: ' + device.platform);
				
				if (device.platform === "Android") {
					getFolder(fileSystem, folderName, function(folder) {
						filePath = folder.toURL() + "\/" + fileName;
						folderPath = folder.toURL();
						console.log('got folder:', filePath);
						app.showAlert('got folder: ' + filePath);
						app.divDebug('got folder: ' + filePath);
						readyCallback(folderPath);
					}, function() {
						app.showAlert('2');
						app.divDebug('2');
						console.log("failed to get folder");
						readyCallback();
					});
				} else {
					app.showAlert('3');
					app.divDebug('3');
					var filePath;
					var urlPath = fileSystem.root.toURL();
					if (device.platform == "Win32NT") {
						urlPath = fileSystem.root.fullPath;
					}
					if (parseFloat(device.cordova) <= 3.2) {
						filePath = urlPath.substring(urlPath.indexOf("/var"));// + "\/" + fileName;
					} else {
						filePath = urlPath;// + "\/" + fileName;
					}
					
					folderPath = filePath;
					readyCallback(folderPath);
					console.log('got folder:', filePath);
				}
			},
			function(e) {
				console.log("failed to get filesystem");
				console.log(e);
				app.showAlert('failed to get filesys');
				app.divDebug('failed to get filesys');
				readyCallback();
			}
		);
	}
	
	return {
		getSystem: getSystem,
		generateImagesArray: generateImagesArray
	}
}