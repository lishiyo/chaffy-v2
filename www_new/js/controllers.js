angular.module('chatRoom.controllers', ['chatRoom.services', 'ion-google-place'])

.controller('LoadingCtrl', function($scope, $ionicLoading) {
	// janky way to avoid map dragging all over - change with new ionic
  connieDrag = false;
	
  $scope.show = function() {
    $ionicLoading.show({
      template: 'Loading...'
    });
  };
	
  $scope.hide = function(){
    $ionicLoading.hide();
  };
})

.controller('AppCtrl', function($scope, $location) {
  connieDrag= false;

	// create or retrieve users in users
  var usersRef = new Firebase('https://chaffy.firebaseio.com/users');  

	// check if already has localUserID (i.e. launched before)
	if (localStorage.getItem('localUserID') != null) {
	} else { // totally new user, push userId to Firebase

		// everything initialized as empty
		var newUserRef = usersRef.push({
				username: "",
				gender: "",
				age: "",
				myRooms: ""
			});

	 var userID = newUserRef.name(); //user's unique ID
	 localStorage.setItem('localUserID', userID);
	}
 
  $scope.goToNewRoom = function() {
    $location.path('/rooms/new');
    $scope.toggleSideMenu();
  };

  $scope.goToNewRoomDirect = function() {
    $location.path('/rooms/new');
  };
  
  $scope.goToAbout = function() {
    $location.path('/about');
    $scope.toggleSideMenu();
  };
  
  $scope.goToHome = function() {
    $location.path('/home');
  };  

  $scope.goToLaunch = function() {
    $location.path('/launch');
    $scope.toggleSideMenu();
  }; 

  $scope.goToCards = function() {
    $location.path('/swipe');
    $scope.toggleSideMenu();
  }; 

  $scope.goToMyRooms = function() {
    $location.path('/myrooms');
    $scope.toggleSideMenu();
  }; 

  $scope.updateMap = function() {
    $location.path('/launch');
  }; 
    
  $scope.toggleSideMenu = function() {
    $scope.sideMenuController.toggleLeft();
  };

})

.controller('MainCtrl', function($scope, $timeout, $firebase, DistanceCalc, CheckUserHasRoom) {

  connieDrag = false;

//   console.log("\n\n $scope.map center is " + userPosition[0] + ", " + userPosition[1]);
//   console.log("\n\n $scope.circle radius: " + localStorage.getItem('localNewRadius'));
//   console.log("\n\n $scope.circle radius lat: " + localStorage.getItem('lat') + " " + localStorage.getItem('lon'));

 	$scope.radius = parseFloat(localStorage.getItem('localNewRadius'));
 
  var ref = new Firebase('https://chaffy.firebaseio.com/open_rooms');  
  var promise = $firebase(ref);
  $scope.rooms = promise.$asArray();

  $scope.goToIt = function(theUrl){
    window.location = theUrl;
  }
 
	$scope.distanceFromHere = function (_item, _startPoint) {
		return DistanceCalc.distanceFromHere(_item);
	} 

	// distance between chat and real user position
	$scope.actualDistanceFromHere = function(_item, _startPoint) {
		return DistanceCalc.actualDistanceFromHere(_item);
	} 

	$scope.onRefresh = function() { 
		var stop = $timeout(function() {            
			$scope.$broadcast('scroll.refreshComplete');
		}, 1000);
	}; 

	$scope.init = function(room){
		calcHotorActive(room);
		allUsersRooms();
	}

	// my_rooms view
	function allUsersRooms() {

		var usersRef = new Firebase('https://chaffy.firebaseio.com/users/');  
		var userID = localStorage.getItem('localUserID');
		$scope.thisUser = usersRef.child(userID);

		$scope.thisUser.child("myRooms").once("value", function (snapshot) {
			$scope.myRooms = snapshot.val(); //current myRooms
			//console.log("allUsersRooms ran!");

		}, function (errorObject) {
			console.log(errorObject);
		});

	} // allUsersRooms

	$scope.userHasRoom = function(room) {
		for (var idx in $scope.myRooms) { //loop through all of users' rooms
			var roomId = $scope.myRooms[idx]; 
			if ($scope.room.id == roomId) {
				return true; //room found among users rooms
			}
		}
		return false; //room wasn't found in users' rooms
	};

	function calcTimes() {
		var day = new Date();
		var dayBefore = new Date().setDate(day.getDate() - 1);

		$scope.endTime = day.getTime(); // right now
		$scope.startTime = dayBefore; // yesterday
		$scope.startTimeSec = (parseFloat($scope.endTime) - 60000) //60 sec ago
	}

	function calcHotorActive(room) {
		calcTimes();

		var ref = new Firebase('https://chaffy.firebaseio.com/rooms/').child(room.id);
		var sync = $firebase(ref.endAt().limit(10));
		var obj = sync.$asArray();

		obj.$loaded()
			.then(function(){
				var firstOfLast = obj[0];
				var lastIndex = (obj.length - 1);
				var lastOfLast = obj[lastIndex];
				$scope.room.lastMessage = lastOfLast.content;
				$scope.room.lastMessageTime = lastOfLast.created_at;

				$scope.firstCreated = parseFloat(firstOfLast.created_at);
				$scope.lastCreated = parseFloat(lastOfLast.created_at);

			}) // first then

			.then(function() {
			// room is Hot refers to at least 10 posts since yesterday
				if ($scope.firstCreated > $scope.startTime) {
						$scope.room.isHot = true;
					} else {
						$scope.room.isHot = false;
				}

			// room is Active means a message within last 60 seconds 
				if ($scope.lastCreated > $scope.startTimeSec) {
						//console.log("room is active, show icon!");
						$scope.room.isActive = true;
					} else {
						//console.log("room isn't active!");
						$scope.room.isActive = false;
				}

			// room is Popular refers to total messages being more than X; we should flush rooms every week
				if ($scope.totalMessages > 25) {
					$scope.room.isPopular = true;
				} else {
					$scope.room.isPopular = false;
				}

			});

	}; // calcHotorActive

}) // MainCtrl

.controller('NewRoomCtrl', function($scope, $location, $firebase, UserAddRoom) {      
  
  connieDrag = false;

  var ref = new Firebase('https://chaffy.firebaseio.com/open_rooms');  
  var promise = $firebase(ref);
  $scope.rooms = promise.$asObject();
  $scope.roomRef = new Firebase('https://chaffy.firebaseio.com/rooms');

  $scope.newRoomName = "";
  $scope.newRoomNameId = "";
  $scope.newRoomDescription = "";
  $scope.setNewRoomNameId = function() {
    this.newRoomNameId = this.newRoomName.toLowerCase().replace(/\s/g,"-").replace(/[^a-z0-9\-]/g, '');
  };
  
  $scope.createRoom = function() {
    $scope.roomId = Math.floor(Math.random() * 50000001);
    var promiseRoom = $firebase(new Firebase('https://chaffy.firebaseio.com/open_rooms/' + $scope.roomId));

    promiseRoom.$set({
      id: $scope.roomId,
      title: $scope.newRoomName,
      slug: $scope.newRoomNameId, 
      longitude: userPosition[1],
      latitude: userPosition[0],
      description: $scope.newRoomDescription,
      created_at: Firebase.ServerValue.TIMESTAMP,
      created_by: localStorage.getItem('localusername')
    }).then(function(ref) {
			$scope.roomRef.child($scope.roomId).setWithPriority({}, Firebase.ServerValue.TIMESTAMP);
			localStorage.setItem("lastRoomAdded", $scope.roomId);
			UserAddRoom.addMyRoom($scope.roomId); //run UserAddRoom service
			$location.path('/home');
		});

  }; // createRoom()

})

.controller('RoomCtrl', function($scope, $routeParams, $timeout, $firebase, CheckUserHasRoom) {
  connieDrag = false;
  $scope.newMessage = "";
  $scope.messages = [];
  $scope.roomRef = new Firebase('https://chaffy.firebaseio.com/rooms/' + $routeParams.roomId);  
  var promise = $firebase($scope.roomRef);
  $scope.messages = promise.$asObject();
	
  $scope.messages.$loaded().then(function() {
	// for android only: move up scroll for keyboard
		var ua = navigator.userAgent.toLowerCase();
		var isAndroid = ua.indexOf("android") > -1; //&& ua.indexOf("mobile");
		if (isAndroid) {
			$('#mainInput').on('focus', function(){
				 $("#mainScroll .scroll").css('-webkit-transform','translate3d(0px, -'+(parseInt($('.scroll').css('height'))-190)+"px"+', 0px)');
			});
		}
  }); // room's messages loaded
  
  $scope.username = localStorage.getItem("localusername");
  $scope.userGender = localStorage.getItem("localuserGender");
  $scope.userAge = localStorage.getItem("localuserAge");
  $scope.localUserID = localStorage.getItem('localUserID');

  $scope.submitAddMessage = function() {
		// for users who don't input a name
		if (typeof this.username === "undefined") {
			this.username = 'Chaffer ' + Math.floor(Math.random() * 501);
		}
		// for legacy users to get updates
		if (this.username === "undefined") {
			this.username = 'Chaffer ' + Math.floor(Math.random() * 501);
		}

		// setWithPriority is important if we want to flush messages before a certain time
		$scope.roomRef.push().setWithPriority({
					userID: $scope.localUserID,
					created_by: this.username,
					content: this.newMessage,
					created_at: new Date().getTime(),
					userGender: this.userGender,
					userAge: this.userAge
		}, Firebase.ServerValue.TIMESTAMP);

		this.newMessage = "";

		setTimeout(function(){
			$('#mainInput').trigger('autosize.destroy');
			$('#mainInput').blur();
		}, 10);

		// run service CheckUserHasRoom, which runs UserAddRoom if hasRoom is false
		var userHasRoom = function() {
				CheckUserHasRoom.hasRoom($routeParams.roomId);
		}

		userHasRoom();

	}; //submitAddMessage

	$scope.onRefresh = function() {
		var stop = $timeout(function() {
			$scope.$broadcast('scroll.refreshComplete');
		}, 1000);
	};

	$('#mainInput').focus(function(){
			$(this).autosize();   
	});

}) // RoomCtrl

.controller('AboutCtrl', function($scope) {
  connieDrag = false;
})

.controller('LaunchCtrl', function($scope, $location, $rootScope, $timeout) {

  connieDrag =true;

	$scope.checkAlias = function(){
		if (localStorage.getItem('localusername')==null) {
			return;
		} else {
			return localStorage.getItem('localusername');
		}
	};

	$scope.checkGender = function(){
		if (localStorage.getItem('localuserGender')==null) {
			return;
		} else {
			return localStorage.getItem('localuserGender');
		}
	};

	$scope.checkAge = function(){
		if (localStorage.getItem('localuserAge')==null) {
			return;
		} else {
			return localStorage.getItem('localuserAge');
		}
	};

	$scope.blurKeyboard = function() {
		$('#userAlias').blur();
	};

	$scope.blurOnEnter = function(keyEvent) {
		if (keyEvent.which === 13) {
			$('#userAlias').blur();
			$('#address').blur();
		}
	};

	$scope.doNothing = function(event) {
		event.preventDefault();
		return;
	};

	$scope.userPro = {
		username: $scope.checkAlias(),
		gender: $scope.checkGender(),
		age: $scope.checkAge()
	};

  $scope.findChats = function() {
		// set localNewRadius when user clicks GO
    var newRadius = $scope.circle.getRadius();
    localStorage.setItem('localNewRadius', (parseFloat(newRadius / 1609)));

		// reset localStorage lat, lon and userPosition to circle center on GO
		var lat = $scope.circle.getCenter().lat();
		var lon = $scope.circle.getCenter().lng();

    localStorage.setItem('lat', lat);
    localStorage.setItem('lon', lon);

    $scope.setUserName = function(){
      if ($scope.userPro.username==undefined || $scope.userPro.username=="") {
        return 'chaffer' + Math.floor(Math.random() * 999);
      } else {
        return $scope.userPro.username;
      }
    };
		
    localStorage.setItem("localusername", $scope.setUserName());
    
    $scope.setUserGender = function(){
      if ($scope.userPro.gender =='male' || $scope.userPro.gender =='female') {
        //console.log("user gender is: " + $scope.userPro.gender);
        return $scope.userPro.gender;
      } else {
        return 'anon';
      }
    };
		
    localStorage.setItem("localuserGender", $scope.setUserGender());

    $scope.setUserAge = function(){
      if ($scope.userPro.age == '18-29'|| $scope.userPro.age == '30-49' || $scope.userPro.age == '49+') {
        //console.log("user age is: " + $scope.userPro.age);
        return $scope.userPro.age;

      } else {
        return 'anon';
      }
    };
		
    localStorage.setItem("localuserAge", $scope.setUserAge());

		//  retrieve Firebase 'users' and update
		var usersRef = new Firebase('https://chaffy.firebaseio.com/users'); 
		var userID = localStorage.getItem('localUserID');
		var thisUser = usersRef.child(userID);

		thisUser.update({
			username: localStorage.getItem("localusername"),
			gender: $scope.setUserGender(),
			age: $scope.setUserAge()
		});

	$location.path('/home');

}; // findChats()


/** Firebase anonymous login
var myRef = new Firebase("https://blistering-fire-5269.firebaseio.com");
var isNewUser = true;
var auth = new FirebaseSimpleLogin(myRef, function(error, user) {
  if (error) {
    alert('sorry, an error occurred');
  } else if (user) {
    // save new user's profile into Firebase, list by uid
    if( isNewUser ) { 

      var userRooms = [];

      myRef.child('userProfiles').child(user.uid).set({
        //displayName: user.displayName,
        username: localStorage.getItem("localusername"),
        gender: $scope.setUserGender(),
        age: $scope.setUserAge(),
        provider: user.provider,
        provider_id: user.id,
        userRooms: userRooms
      });
    }
  } else { 
    // something else
    alert('sorry, please try again');
  }
} //FirebaseSimpleLogin

// set token for 30 days rather than one session
auth.login('anonymous', {
  rememberMe: true,
});
**/


/** map **/  
/**
$scope.map = {
    center: {
      latitude: userPosition[0],
      longitude: userPosition[1]
    },
    zoom: 9,
    refresh:false,
    events: {
      click: function() {

         $timeout(function() {            
          $('#userAlias').blur();
        }, 10);
        
      }
      /**
      drag: function(){
        //$scope.map.center = {latitude: userPosition[0], longitude: userPosition[1]};
        $scope.map.center = $scope.circle.center;
      }
      **/
//    }
//};

// $scope.map.isReady = false;

/**
$scope.circle = {
  center: {
      latitude: userPosition[0],
      longitude: userPosition[1]
    },
  fill: {
    color: "#FF2A58",
    opacity: 0.40
  },
  stroke: {
    weight: 2,
    color: "#FF2A58",
    opacity: 1
  },
  radius: 10000,
  geodesic: true,
  events: {
               dragend: function (marker) {
                  $rootScope.$apply(function () {
                    /**
                     console.log(marker.position.lat());
                     console.log(marker.position.lng());
                     **/
                    
                  //   var lat = $scope.circle.center.latitude;
                  //   var lon = $scope.circle.center.longitude;

                     /**
                     userPosition[0] = parseFloat(lat);
                     userPosition[1] = parseFloat(lon);
                     **/
                 //    localStorage.setItem('lat', lat);
                 //    localStorage.setItem('lon', lon);

                    //$scope.map.center = $scope.circle.center;
/**
                  });
               },
               radius_changed: function() {
                localStorage.setItem('localNewRadius', (parseFloat($scope.circle.radius / 1609)));
                //console.log("\n\n\n" + localStorage.getItem('localNewRadius'));
               }
            } //events
};

$scope.circle.isReady = false;
$scope.map.isReady = true;
$scope.circle.isReady = true;
**/

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
   navigator.geolocation.getCurrentPosition(onSuccess, onError);
 }

function onSuccess(position) {
  userPosition=[position.coords.latitude, position.coords.longitude];
  initializeMap();
}

function onError(error) {
  userPosition =[40.777225004040009, -73.95218489597806];
  alert("geolocation failed! defaulting to: " + userPosition[0] + " " + userPosition[1]);
  initializeMap();
}
   
function initializeMap() {
	var geocoder;
	var markers = [];
	$scope.circle = null;
	$scope.map = null;

	var mapOpts = {
			zoom: 12,
			zoomControl: true,
			zoomControlOptions: {
				style: google.maps.ZoomControlStyle.LARGE,
				position: google.maps.ControlPosition.LEFT_CENTER
			},
			center: new google.maps.LatLng(userPosition[0], userPosition[1]),
			panControl: true,
			panControlOptions: {
				position: google.maps.ControlPosition.TOP_RIGHT
			},
			scaleControl: true,
			overviewMapControl: true,
			overviewMapControlOptions: {
				opened: true,
				position: google.maps.ControlPosition.RIGHT_BOTTOM
			}
	};

	var circleOpts = {
		//map: $scope.map,
		strokeColor: '#FF0000',
		strokeOpacity: 0.8,
		strokeWeight: 2,
		fillColor: '#fff',
		fillOpacity: 0.35,
		center: new google.maps.LatLng(userPosition[0], userPosition[1]),         
		radius: 3000,
		editable: true,
		draggable: true
	};

	$scope.map = new google.maps.Map(document.getElementById('map-canvas'), mapOpts);
   
	$timeout(function(){

		if ($scope.map != null) {
			$scope.circle = new google.maps.Circle(circleOpts); 
			$scope.circle.setMap($scope.map);

			var newRadius = $scope.circle.getRadius();
			localStorage.setItem('localNewRadius', (parseFloat(newRadius / 1609)));
			var lat = $scope.circle.getCenter().lat();
			var lon = $scope.circle.getCenter().lng();
			//should be userposition[0] and [1]
			localStorage.setItem('lat', lat);
			localStorage.setItem('lon', lon);

			google.maps.event.addListener($scope.circle, 'radius_changed', function() {
				newRadius = $scope.circle.getRadius();
				$scope.circle.radius = newRadius;
				localStorage.setItem('localNewRadius', (parseFloat(newRadius / 1609)));
			});

			google.maps.event.addListener($scope.circle, 'dragend', function() {
				lat = $scope.circle.getCenter().lat();
				lon = $scope.circle.getCenter().lng();
				localStorage.setItem('lat', lat);
				localStorage.setItem('lon', lon);
			});
			startGeocomplete();
		}

	}, 10); // timeout


	// geocomplete
	function startGeocomplete () {

		 $("input#address").geocomplete({
				map: $scope.map
			 }).bind("geocode:result", function(event, result) {

				 $scope.map.setCenter(result.geometry.location);
				 $scope.circle.setCenter(result.geometry.location);
				 $scope.map.fitBounds($scope.circle.getBounds());

				//store new lat, lon, and radius even without pressing findChats
				 lat = $scope.circle.getCenter().lat();
				 lon = $scope.circle.getCenter().lng();
				 localStorage.setItem('lat', lat);
				 localStorage.setItem('lon', lon);
				 newRadius = $scope.circle.getRadius();
				 $scope.circle.radius = newRadius;
				 localStorage.setItem('localNewRadius', (parseFloat(newRadius / 1609)));

				 var marker = new google.maps.Marker({
							map: $scope.map,
							title: result.formatted_address,
							position: result.geometry.location
							/**
							labelContent: result.formatted_address,
							labelAnchor: new google.maps.Point(22, 0),
							labelClass: "labels", // the CSS class for the label
							labelStyle: {opacity: 0.75}
							**/
					});

				 var iw = new google.maps.InfoWindow({
					 content: marker.title
				 });
				google.maps.event.addListener(marker, "click", function (e) { iw.open($scope.map, this); });

				markers.push(marker);

				$timeout(function() {
					google.maps.event.addListener(marker, 'dblclick', function(){
							this.setMap(null);                   
					});

				}, 10);


		 }); // geocomplete

	} //startGeocomplete

	$scope.blurOnEnterAddress = function(keyEvent) {
		if (keyEvent.which === 13) {
			$("input#address").trigger("geocode");
			$("input#address").blur();
		}
	}

} //initializeMap


})

.controller('MapCtrl', function($scope, $location, $rootScope, $timeout, $ionicLoading, $compile) {

	$scope.loading = $ionicLoading.show({
		content: 'Getting current location...',
		showBackdrop: false
	});

  navigator.geolocation.getCurrentPosition(function(pos) {
		userPosition = [pos.coords.latitude, pos.coords.longitude]
		myLatlng = new google.maps.LatLng(userPosition[0], userPosition[1]);
		localStorage.setItem("lat", userPosition[0]);
		localStorage.setItem("lon", userPosition[1]);

		$scope.loading.hide();
		console.log("userPosition at: " + userPosition);

		initialize();
	}, function(error) {
		userPosition = [40.777225004040009, -73.95218489597806];
		myLatlng = new google.maps.LatLng(userPosition[0], userPosition[1]);
		localStorage.setItem("lat", userPosition[0]);
		localStorage.setItem("lon", userPosition[1]);

		$scope.loading.hide();
		alert('Unable to get location: ' + error.message);

		initialize();
  });


  function initialize() {    
		var mapOptions = {
			center: myLatlng,
			zoom: 12,
			mapTypeId: google.maps.MapTypeId.ROADMAP
			/**
			overviewMapControl: true,
			overviewMapControlOptions: {
				opened: true,
				position: google.maps.ControlPosition.RIGHT_BOTTOM
			}
			**/
		};

		var map = new google.maps.Map(document.getElementById("map"),
				mapOptions);

		var marker = new google.maps.Marker({
			position: myLatlng,
			map: map,
			title: 'my location',
			icon: 'http://i.imgur.com/Gwss3fJ.png'
		});

		var contentString = "<div style='text-align:center;'>My Location<br /><a ng-click='clickTest()'>Save this Search</a></div>";
		var compiled = $compile(contentString)($scope);

		var infowindow = new google.maps.InfoWindow({
			content: compiled[0]
		});

		google.maps.event.addListener(marker, 'click', function() {
			infowindow.open(map,marker);
		});

		$scope.map = map;

		//with map initialized, init the circle
		startCircle();

	} // initialize map

	function startCircle() {  
		var circleOpts = {
			//map: $scope.map,
			strokeColor: '#6EC3FF',
			strokeOpacity: 0.35,
			strokeWeight: 2,
			fillColor: '#6EC3FF',
			fillOpacity: 0.35,
			center: myLatlng,         
			radius: 3000,
			editable: true,
			draggable: true
		};

		$scope.circle = new google.maps.Circle(circleOpts); 
		$scope.circle.setMap($scope.map);

		var newRadius = $scope.circle.getRadius();
		localStorage.setItem('localNewRadius', (parseFloat(newRadius / 1609)));
		$scope.circle.radiusInMi = parseFloat(newRadius / 1609).toFixed(2);

		google.maps.event.addListener($scope.circle, 'radius_changed', function() {
			var newRadius = $scope.circle.getRadius();
			$scope.circle.radius = newRadius;
			localStorage.setItem('localNewRadius', (parseFloat(newRadius / 1609)));
		});

		google.maps.event.addListener($scope.circle, 'dragend', function() {
			var lat = $scope.circle.getCenter().lat();
			var lon = $scope.circle.getCenter().lng();
			localStorage.setItem('lat', lat);
			localStorage.setItem('lon', lon);
		});

	} //startCircle

	$scope.centerOnMe = function() {
		if(!$scope.map) {
			return;
		}

		$scope.loading = $ionicLoading.show({
			content: 'Getting current location...',
			showBackdrop: false
		});

		navigator.geolocation.getCurrentPosition(function(pos) {
			$scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
			$scope.loading.hide();
		}, function(error) {
			alert('Unable to get location: ' + error.message);
		});
	};

	$scope.clickTest = function() {
		alert('Example of infowindow with ng-click')
	};

	$scope.blurOnEnterAddress = function(keyEvent) {
		if (keyEvent.which === 13) {
			$(".ion-google-place").blur();
		}
	}

})

.controller('CardsCtrl', function($scope, $ionicSwipeCardDelegate, $firebase, DistanceCalc) {

	connieDrag = false;

	$scope.radius = parseFloat(localStorage.getItem('localNewRadius'));
	$scope.radiusInMi = $scope.radius.toFixed(2);
	$scope.missingCard = false;
	$scope.chatCards = [];
	var chatCards = [];
	var chatsRef = new Firebase('https://chaffy.firebaseio.com/open_rooms');  
	var promise = $firebase(chatsRef).$asArray();


	promise.$loaded().then(function(data) {
		var theCards = data;
		for (var i=0; i < theCards.length; ++i) {
			var newCard = {
				title: theCards[i].title,
				id: theCards[i].id,
				description: theCards[i].description,
				latitude: theCards[i].latitude,
				longitude: theCards[i].longitude,
			};

			chatCards.push(newCard);
		}

	}, function (errorObject) {
		console.log('The read failed: ' + errorObject.code);
	});


	$scope.chatCards = Array.prototype.slice.call(chatCards, 0, 0);

	$scope.noCards = function() {
		// check whether there's at least one within the radius
		var passed = chatCards.some(atLeastOne);

		var allFailed = !passed;
		return allFailed;
	};

	function atLeastOne(element, index, array) {
		// console.log("element is: " + element + " in array: " + array);
		return ($scope.distanceFromHere(element) < $scope.radius);
	};

	$scope.distanceFromHere = function (_item, _startPoint) {
		return DistanceCalc.distanceFromHere(_item);
	};

	// distance between chat and real user position
	$scope.actualDistanceFromHere = function (_item, _startPoint) {
		return DistanceCalc.actualDistanceFromHere(_item);
	};

  $scope.cardSwiped = function(index) {
    $scope.addCard();
  };

  $scope.cardDestroyed = function(index) {
    $scope.chatCards.splice(index, 1);
  };

  $scope.addCard = function() {
    var newCard = chatCards[Math.floor(Math.random() * chatCards.length)];
    if ($scope.distanceFromHere(newCard) <= $scope.radius) {
      $scope.chatCards.push(angular.extend({}, newCard));
    } else {
      $scope.addCard();
    }
  }
})

.controller('CardCtrl', function($scope, $ionicSwipeCardDelegate) {
  connieDrag = false;

  $scope.goToIt = function(theUrl){
    window.location=theUrl;
  };

  $scope.goAway = function() {
    var card = $ionicSwipeCardDelegate.getSwipebleCard($scope);
    card.swipe();
  };
});
