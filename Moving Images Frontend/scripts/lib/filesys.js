var filesys = function() { 
	
	var folderName = 'testbtch';//"telerik/moving/images";
	var fileName = "imageX.jpg";    
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
			paths.push(folderPath + fileName.replace("X", i));
		}
		
		return paths;
	}
	
	function getImageFilePath(index) {
		return folderPath + fileName.replace("X", index);
	}
		
	function getSystem(callback) {
		readyCallback = callback;
		getFilesystem(
			function(fileSystem) {
				console.log("gotFS");
				console.log('platform:', device.platform);
				
				if (device.platform === "Android") {
					getFolder(fileSystem, folderName, function(folder) {
						folderPath = folder.toURL();
						console.log('got folder:', folderPath);
						readyCallback(folderPath);
					}, function() {
						console.log("failed to get folder");
						readyCallback();
					});
				} else {
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
				readyCallback();
			}
		);
	}
	
	return {
		getSystem: getSystem,
		folderPath: folderPath,
		getImageFilePath: getImageFilePath,
		generateImagesArray: generateImagesArray
	}
}