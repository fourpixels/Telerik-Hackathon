/**
 * AddActivity view model 
 */

var app = app || {};

app.AddActivity = (function () {
    'use strict'
	
	var activityPublishedCallback;

    var addActivityViewModel = (function () {
        
        var $newStatus;
        var validator;
        
        var init = function () {
            
            validator = $('#enterStatus').kendoValidator().data('kendoValidator');
            $newStatus = $('#newStatus');
        };
        
        var show = function () {
            
            // Clear field on view show
            $newStatus.val('');
            validator.hideMessages();
        };
        
        var saveActivity = function () {
            
            // Validating of the required fields
            if (validator.validate()) {
                
                // Adding new activity to Activities model
                var activities = app.Activities.activities;
                var activity = activities.add();
                
                activity.Text = $newStatus.val();
                activity.UserId = app.Users.currentUser.get('data').Id;
                
                activities.one('sync', function () {
                    app.mobileApp.navigate('#:back');
                });
                
                activities.sync();
            }
        };
		
		var publicSaveActivity = function(gif, callback, text) {
			activityPublishedCallback = callback;
			var reader = new FileReader();
			reader.onload = function(event){
				console.log('reader ready:', event.target.result);
				
				app.everlive.Files.create({
					Filename: Math.random().toString(36).substring(2, 15) + ".gif",
					ContentType: "image/gif",
					base64: event.target.result.substr(event.target.result.lastIndexOf('base64,') + 7)
				}).then(function(data) {
					console.log(' >>> everlive result:');
					console.log(data);
					
					var activities = app.Activities.activities;
					var activity = activities.add();
					
					activity.Text = text;
					activity.Picture = data.result.Id;
					activity.UserId = app.Users.currentUser.get('data').Id;
					
					activities.one('sync', function (e) {
						console.log(' >>> SYNC OK!');
						console.log(e);
					});
					
					activities.sync();
					
					activityPublishedCallback();
				});
			};
			reader.readAsDataURL(gif);
		}
        
        return {
            init: init,
            show: show,
            me: app.Users.currentUser,
            saveActivity: saveActivity,
			publicSaveActivity: publicSaveActivity
        };
        
    }());
    
    return addActivityViewModel;
    
}());
