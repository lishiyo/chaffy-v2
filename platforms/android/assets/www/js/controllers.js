//var jGlob;

//for the map drag interval below for map
//var cInt;

angular.module('chatRoom.controllers', ['chatRoom.services', 'OtdDirectives'])

.controller('LoadingCtrl', function($scope, $ionicLoading) {
  connieDrag= false;
  $scope.show = function() {
    $ionicLoading.show({
      template: 'Loading...'
    });
  };
  $scope.hide = function(){
    $ionicLoading.hide();
  }})


.controller('AppCtrl', function($scope, $location) {
  //for chaffy to work with map not dragging all over
  connieDrag= false;
  //clearInterval(cInt);

//  create or retrieve users in users
  var usersRef = new Firebase('https://chaffy.firebaseio.com/users');  

// check if already has localUserID (i.e. launched before)
if (localStorage.getItem('localUserID') != null) {
  /** do nothing
  var userID = localStorage.getItem('localUserID');
  var thisUser = usersRef.child(userID);

  thisUser.on('value', function(snapshot) {
    var profile = snapshot.val();
    console.log("\n\n username in AppCtrl: " + profile.username);
    console.log("\n\n myRooms in AppCtrl: " + profile.myRooms);
  });
 **/
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

 //console.log("\n\n new user created: " + userID);
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

  connieDrag= false;
  // real user position
  /**
  console.log("\n\n $scope.map center is " + userPosition[0] + ", " + userPosition[1]);
  console.log("\n\n $scope.circle radius: " + localStorage.getItem('localNewRadius'));
  console.log("\n\n $scope.circle radius lat: " + localStorage.getItem('lat') + " " + localStorage.getItem('lon'));
  **/

  // set localNewRadius whenever switch view to MainCtrl - below doesn't work, however
  // localStorage.setItem('localNewRadius', (parseFloat(angular.element(document.getElementById('firstElem')).scope().circle.radius) / 1609));

//clearInterval(cInt);

 $scope.radius = parseFloat(localStorage.getItem('localNewRadius'));
 
  //$scope.rooms = [];
  var ref = new Firebase('https://chaffy.firebaseio.com/open_rooms');  
  var promise = $firebase(ref);
  $scope.rooms = promise.$asArray();

  //$scope.currentLocation=userPosition;

  $scope.booyah= function(){
    return 2;
  }

// now in services
/**
  $scope.getUserLocation = function(){
    //return [parseFloat(localStorage.getItem('lat')), parseFloat(localStorage.getItem('lon'))]; 
    return DistanceCalc.getUserLocation();
  }

  $scope.currentLocation = $scope.getUserLocation();
**/
  $scope.goToIt = function(theUrl){
    window.location=theUrl;
  }
 
$scope.distanceFromHere = function (_item, _startPoint) {
  return DistanceCalc.distanceFromHere(_item);
} //distanceFromHere

// distance between chat and real user position
$scope.actualDistanceFromHere = function(_item, _startPoint) {
  return DistanceCalc.actualDistanceFromHere(_item);
} //actualDistanceFromHere

//jGlob = $scope; 

$scope.onRefresh = function() { 
  var stop = $timeout(function() {            
    $scope.$broadcast('scroll.refreshComplete');
  }, 1000);
}; //onRefresh



$scope.init = function(room){
  calcHotorActive(room);
  allUsersRooms();
}

//my_rooms view

function allUsersRooms() {

  var usersRef = new Firebase('https://chaffy.firebaseio.com/users/');  
  var userID = localStorage.getItem('localUserID');
  $scope.thisUser = usersRef.child(userID);

  $scope.thisUser.child("myRooms").once("value", function (snapshot) {
    $scope.myRooms = snapshot.val(); //current myRooms
    // console.log("allUsersRooms ran!");
 
  }, function (errorObject) {
    // console.log(errorObject);
  });

} //allUsersRooms


$scope.userHasRoom = function(room) {

  for (var idx in $scope.myRooms) { //loop through all of users' rooms
  var roomId = $scope.myRooms[idx]; 
  if ($scope.room.id == roomId) {
    //console.log("found room: " + roomId);
    return true; //room found among users rooms
  }
}
return false; //room wasn't found in users' rooms
} //userHasRoom


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

obj.$loaded().then(function(){

  //console.log(Object.keys(obj[obj.length-1]));

  var firstOfLast = obj[0];
  var lastIndex = (obj.length - 1);
  var lastOfLast = obj[lastIndex];
  $scope.room.lastMessage = lastOfLast.content;
  $scope.room.lastMessageTime = lastOfLast.created_at;

  $scope.firstCreated = parseFloat(firstOfLast.created_at);
  $scope.lastCreated = parseFloat(lastOfLast.created_at);

  //console.log("first and last message created bt: " + $scope.firstCreated + " to " + $scope.lastCreated);

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


}; //calcHotorActive


}) //MainCtrl

.controller('NewRoomCtrl', function($scope, $location, $firebase, UserAddRoom) {      
  
  connieDrag= false;

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
      //location: userPosition,
      longitude: userPosition[1],
      latitude: userPosition[0],
      description: $scope.newRoomDescription,
      created_at: Firebase.ServerValue.TIMESTAMP,
      created_by: localStorage.getItem('localusername')
    }).then(function(ref) {

       //var roomUIDref = ref.name();
       $scope.roomRef.child($scope.roomId).setWithPriority({}, Firebase.ServerValue.TIMESTAMP);
       /**
       $firebase(new Firebase('https://blistering-fire-5269.firebaseio.com/open_rooms/' + roomUIDref)).$update({uid: roomUIDref});
       console.log("ref updated as: " + ref + " with id: " + roomUIDref);
**/
    
    localStorage.setItem("lastRoomAdded", $scope.roomId);
    
    UserAddRoom.addMyRoom($scope.roomId); //run UserAddRoom service

    $location.path('/home');

    })

   
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
/**
 $(".scroll").css('-webkit-transform','translate3d(0px, -'+(parseInt($('.scroll').css('height'))-250)+"px"+', 0px)');
**/
// for android only: move up scroll for keyboard
var ua = navigator.userAgent.toLowerCase();
var isAndroid = ua.indexOf("android") > -1; //&& ua.indexOf("mobile");
if(isAndroid) {
  
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
  
    //for users who don't input a name
      if(typeof this.username =="undefined"){
        this.username = 'Chaffer ' + Math.floor(Math.random() * 501);
      }
      //for legacy users to get update
      if(this.username =="undefined"){
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

$timeout(function(){
  $('#mainInput').trigger('autosize.destroy');
  $('#mainInput').blur();
}, 10);

// run service CheckUserHasRoom, which then runs UserAddRoom if hasRoom is false
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
  connieDrag= false;
})


.controller('LaunchCtrl', function($scope, $location, $rootScope, $timeout) {

  connieDrag=true;

$scope.checkAlias = function(){
  if (localStorage.getItem('localusername')==null) {
    return;
  } else {
    return localStorage.getItem('localusername');
  }
}

$scope.checkGender = function(){
  if (localStorage.getItem('localuserGender')==null) {
    return;
  } else {
    return localStorage.getItem('localuserGender');
  }
}

$scope.checkAge = function(){
  if (localStorage.getItem('localuserAge')==null) {
    return;
  } else {
    return localStorage.getItem('localuserAge');
  }
}

$scope.blurKeyboard = function() {
  $('#userAlias').blur();
}

$scope.blurOnEnter = function(keyEvent) {
  if (keyEvent.which === 13) {
    $('#userAlias').blur();
    $('#address').blur();
  }
}

$scope.doNothing = function(event) {
  event.preventDefault();
  return;
}

$scope.userPro = {
  username: $scope.checkAlias(),
  gender: $scope.checkGender(),
  age: $scope.checkAge()
}

// keyboard press submit should blur out keyboard
/**
$('#userAlias').keydown(function(event) {
  if (event.keyCode == 13) {
    event.preventDefault();
    $('#userAlias').blur();
  }
});
**/

  $scope.findChats = function() {

   //for users who don't input a name

// set localNewRadius when user clicks GO
    
    if ($scope.circle==null) {
      var newRadius = 3000;
      var lat = 40.777225004040009;
      var lon = -73.95218489597806;
    } else {
      var newRadius = $scope.circle.getRadius();
      var lat = $scope.circle.getCenter().lat();
      var lon = $scope.circle.getCenter().lng();
    }
      
  localStorage.setItem('localNewRadius', (parseFloat(newRadius / 1609)));
  
  console.log("\n lat: " + localStorage.getItem('lat') + " lon: " + localStorage.getItem('lon'));

// console.log("\n\n\n\n findChats says " + localStorage.getItem('localNewRadius'));

// reset localStorage lat, lon and userPosition to circle center on GO

   // userPosition[0] = parseFloat(lat);
   // userPosition[1] = parseFloat(lon);
    localStorage.setItem('lat', lat);
    localStorage.setItem('lon', lon);

    // $scope.username = 'User' + Math.floor(Math.random() * 501);
    // $scope.username = $scope.userAlias;

    $scope.setUserName = function(){
      if ($scope.userPro.username==undefined || $scope.userPro.username=="") {
        return 'chaffer' + Math.floor(Math.random() * 999);
      } else {
        return $scope.userPro.username;
      }
    }
    localStorage.setItem("localusername", $scope.setUserName());
    
    $scope.setUserGender = function(){
      if ($scope.userPro.gender =='male' || $scope.userPro.gender =='female') {
        //console.log("user gender is: " + $scope.userPro.gender);
        return $scope.userPro.gender;
      } else {
        return 'anon';
      }
    }
    localStorage.setItem("localuserGender", $scope.setUserGender());

    $scope.setUserAge = function(){
      if ($scope.userPro.age == '18-29'|| $scope.userPro.age == '30-49' || $scope.userPro.age == '49+') {
        //console.log("user age is: " + $scope.userPro.age);
        return $scope.userPro.age;

      } else {
        return 'anon';
      }
    }
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

//console.log("\n\n" + "current userID is " + thisUser.name());

//$location.path('/swipe');
//unbind geocode

$location.path('/home');

}; // findChats()

$scope.$watch('address', function() {
    //console.log('hey, address has changed!');
    $('#google_places_ac').bind('geocode:result');
});

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


$scope.map=null;
$scope.circle=null;
$scope.loadedMap = false;
$scope.address = "";
//$scope.location = "";


document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() { 
  navigator.geolocation.getCurrentPosition(onSuccess, onError);
}

//navigator.geolocation.getCurrentPosition(onSuccess, onError);


function onSuccess(position) {

  userPosition=[position.coords.latitude, position.coords.longitude];
  localStorage.setItem("lat", userPosition[0]);
  localStorage.setItem("lon", userPosition[1]);

  initializeMap();
}

function onError(error) {
  userPosition = [40.777225004040009, -73.95218489597806];
  localStorage.setItem("lat", userPosition[0]);
  localStorage.setItem("lon", userPosition[1]);

  alert("Oops, we couldn't get your location! (Try visiting your phone's settings, find this app in Location, and turn it on.)\n Right now we'll default you to the Upper East Side of Manhattan in NYC, USA.");

  initializeMap();
}
  
function initializeMap() {
  //var geocoder;
  
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
    
// instantiate map, hide the loading paragraph - mapLoaded now true!
$scope.map = new google.maps.Map(document.getElementById('map-canvas'), mapOpts);

// Try HTML5 geolocation
/**
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(function (position) {
    userPosition = [position.coords.latitude, position.coords.longitude];
    pos = new google.maps.LatLng(userPosition[0], userPosition[1]);
    localStorage.setItem("lat", userPosition[0]);
    localStorage.setItem("lon", userPosition[1]);

    $scope.map.setCenter(pos); 

    startCircle();
  }, // error getting current position
  function() {
    userPosition = [40.777225004040009, -73.95218489597806];
    pos = new google.maps.LatLng(userPosition[0], userPosition[1]); 
    localStorage.setItem("lat", userPosition[0]);
    localStorage.setItem("lon", userPosition[1]);

    $scope.map.setCenter(pos);
    alert("Your device supports geolocation, but you have it disabled; please go to your app settings and under Chaffy, enable location. We'll default you to the UWS of NYC, USA.");

    startCircle();
  }); // getCurrentPosition
} else {
  userPosition = [40.777225004040009, -73.95218489597806];
  pos = new google.maps.LatLng(userPosition[0], userPosition[1]); 
  localStorage.setItem("lat", userPosition[0]);
  localStorage.setItem("lon", userPosition[1]);

  $scope.map.setCenter(pos);  
  alert("Your device isn't supporting geolocation - we'll default you to the UWS of NYC, USA.");

  startCircle();
}
**/

if ($scope.map!=null) {
  $scope.$apply(function() {
    $scope.loadedMap = true;
  });

  startCircle();
}

function startCircle() {

      // if ($scope.map != null) {
       
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

        $scope.circle = new google.maps.Circle(circleOpts); 
        $scope.circle.setMap($scope.map);
        //$scope.circle.setCenter(pos);
       
        var newRadius = $scope.circle.getRadius();
        localStorage.setItem('localNewRadius', (parseFloat(newRadius / 1609)));
/** already set from map
        var lat = $scope.circle.getCenter().lat();
        var lon = $scope.circle.getCenter().lng();
        localStorage.setItem('lat', lat);
        localStorage.setItem('lon', lon);
**/
google.maps.event.addListener($scope.circle, 'radius_changed', function() {
  var newRadius = $scope.circle.getRadius();
  $scope.circle.radius = newRadius;
  localStorage.setItem('localNewRadius', (parseFloat(newRadius / 1609)));

  //console.log("\n new radius! " + $scope.circle.radius + " feet");
});

google.maps.event.addListener($scope.circle, 'dragend', function() {
  var lat = $scope.circle.getCenter().lat();
  var lon = $scope.circle.getCenter().lng();
  localStorage.setItem('lat', lat);
  localStorage.setItem('lon', lon);
  
 // console.log("\n lat: " + localStorage.getItem('lat') + " and lon: " + localStorage.getItem('lon'));
});

startGeoComplete();

//} map not null

} //startCircle

// geocomplete (original)
function startGeoComplete() {
  $("#google_places_ac").val($scope.address);

  alert("called startGeoComplete with val: " + $("#google_places_ac").val());
   $("#google_places_ac").unbind('geocode:result');

   $("#google_places_ac").geocomplete({
      map: $scope.map,
      autoselect: true
     }).bind("geocode:result", function(event, result){
    
    $scope.$apply(function() {
   
     $scope.map.setCenter(result.geometry.location);
     $scope.circle.setCenter(result.geometry.location);
     $scope.map.fitBounds($scope.circle.getBounds());

//store new lat, lon, and radius even without pressing findChats
     var lat = $scope.circle.getCenter().lat();
     var lon = $scope.circle.getCenter().lng();
     localStorage.setItem('lat', lat);
     localStorage.setItem('lon', lon);

     var newRadius = $scope.circle.getRadius();
     $scope.circle.radius = newRadius;
     localStorage.setItem('localNewRadius', (parseFloat(newRadius / 1609)));
  
var id;
var markers = {};


     $scope.marker = new google.maps.Marker({
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

     id = $scope.marker.__gm_id;
     markers[id] = $scope.marker;

      google.maps.event.addListener($scope.marker, 'dblclick', function(){
          
          this.setMap(null);
          $scope.$apply();
                          
      });



     var iw = new google.maps.InfoWindow({
       content: $scope.marker.title
     });

     google.maps.event.addListener($scope.marker, "click", function (e) { iw.open($scope.map, this); });

     //markers.push($scope.marker);

     $scope.address = "";

   }); // .bind


    });

$scope.address = "";
} //startGeocomplete


$scope.blurOnEnterAddress = function(keyEvent) {
  if (keyEvent.which === 13) {
    //$("#google_places_ac").trigger("geocode");
    //startGeoComplete();
    //$("input#address").blur();
    // var autocomplete = new google.maps.places.Autocomplete($("#google_places_ac")[0], {});
    // getPlace(autocomplete);
    
    $("#google_places_ac").blur();
  }
}

/**
 $("input#address").keyup(function (e) {
    if (e.keyCode == 13) {
       $("input#address").trigger("geocode");
       $("input#address").blur();
    }
  });
**/
 

} //initializeMap


//google.maps.event.addDomListener(window, 'load', initialize);



// directive
function startGeoCompleteAng () {
  console.log("startGeoCompleteAng");
  var autocomplete = new google.maps.places.Autocomplete($("#google_places_ac")[0], {});

  google.maps.event.addListener(autocomplete, 'place_changed', function() {

    getPlace(autocomplete);

    });

}

function getPlace(autocomplete) {

              var place = autocomplete.getPlace();

              $scope.location = place.geometry.location.lat() + ',' + place.geometry.location.lng();
              
              $scope.map.setCenter(place.geometry.location);
              $scope.circle.setCenter(place.geometry.location);
              $scope.map.fitBounds($scope.circle.getBounds());

//store new lat, lon, and radius even without pressing findChats
     var lat = $scope.circle.getCenter().lat();
     var lon = $scope.circle.getCenter().lng();
     localStorage.setItem('lat', lat);
     localStorage.setItem('lon', lon);
lat
     var newRadius = $scope.circle.getRadius();
     $scope.circle.radius = newRadius;
     localStorage.setItem('localNewRadius', (parseFloat(newRadius / 1609)));
  
  $scope.marker = new google.maps.Marker({
          map: $scope.map,
          title: place.formatted_address,
          position: place.geometry.location
          /**
          labelContent: result.formatted_address,
          labelAnchor: new google.maps.Point(22, 0),
          labelClass: "labels", // the CSS class for the label
          labelStyle: {opacity: 0.75}
          **/
      });


      google.maps.event.addListener($scope.marker, 'dblclick', function(){
          // console.log("clicked markers! " + marker.title);
          this.setMap(null);             
      });

     var iw = new google.maps.InfoWindow({
       content: $scope.marker.title
     });

     google.maps.event.addListener($scope.marker, "click", function (e) { iw.open($scope.map, this); });

     markers.push($scope.marker);

     //$("input#address").val("");
     
     $scope.$apply();
}


})


.controller('CardsCtrl', function($scope, $ionicSwipeCardDelegate, $firebase, DistanceCalc) {

connieDrag=false;

$scope.radius = parseFloat(localStorage.getItem('localNewRadius'));

$scope.radiusInMi = $scope.radius.toFixed(2);

$scope.missingCard = false;
 //console.log("\n\n radius in swipe is " + $scope.radius);

  $scope.chatCards = [];
  var chatCards = [];
  var chatsRef = new Firebase('https://chaffy.firebaseio.com/open_rooms');  
  var promise = $firebase(chatsRef).$asArray();
  //var arr = promise.$asArray();


promise.$loaded().then(function(data) {
  
  var theCards = data;
  
  for (var i=0; i < theCards.length; ++i) {
    var newCard = {
      title: theCards[i].title,
      //image: 'img/pic.png', 
      id: theCards[i].id,
      description: theCards[i].description,
      latitude: theCards[i].latitude,
      longitude: theCards[i].longitude,
    };

    //console.log('\n new Card with desc: ' + theCards[i].description);
    chatCards.push(newCard);
  }

}, function (errorObject) {
  console.log('The read failed: ' + errorObject.code);
});


$scope.chatCards = Array.prototype.slice.call(chatCards, 0, 0);

$scope.noCards = function() {
//check whether there's at least one within the radius
  var passed = chatCards.some(atLeastOne);
  
  var allFailed = !passed;

  //console.log("allfailed is: " + allFailed);
  return allFailed;
}

function atLeastOne(element, index, array) {
  //console.log("element is: " + element + " in array: " + array);
  return ($scope.distanceFromHere(element) < $scope.radius);
}
// distance between chat and selected circle center (lat, lon) - for checking within radius
/**
$scope.getUserLocation = function(){
  return [parseFloat(localStorage.getItem('lat')), parseFloat(localStorage.getItem('lon'))]; 
  }

//$scope.currentLocation=$scope.getUserLocation();
**/

$scope.distanceFromHere = function (_item, _startPoint) {
  //console.log("distanceFromhere: " + DistanceCalc.distanceFromHere(_item));
  return DistanceCalc.distanceFromHere(_item);
  
} //distanceFromHere

// distance between chat and real user position
$scope.actualDistanceFromHere = function (_item, _startPoint) {
  return DistanceCalc.actualDistanceFromHere(_item);
  
} //actualDistanceFromHere


  $scope.cardSwiped = function(index) {
    $scope.addCard();
  };

  $scope.cardDestroyed = function(index) {
    // $scope.cards.splice(index, 1);
    $scope.chatCards.splice(index, 1);
  };

  $scope.addCard = function() {
    var newCard = chatCards[Math.floor(Math.random() * chatCards.length)];
    //console.log("adding card: " + newCard.title + " chatcards: " + chatCards.length);
    if ($scope.distanceFromHere(newCard) <= $scope.radius) {
      //console.log("pushing card! " + $scope.distanceFromHere(newCard));
      $scope.chatCards.push(angular.extend({}, newCard));
    } else {
      //console.log("skipping card! " + $scope.distanceFromHere(newCard));
      $scope.addCard();
    }
    
  }
})

.controller('CardCtrl', function($scope, $ionicSwipeCardDelegate) {

  connieDrag=false;

  $scope.goToIt = function(theUrl){
    window.location=theUrl;
  };

  $scope.goAway = function() {
    var card = $ionicSwipeCardDelegate.getSwipebleCard($scope);
    card.swipe();
  };
});


angular.module('OtdDirectives', [])
.directive('googlePlaces', function(){
   return {
    restrict:'E',
    replace:true,
    scope: {location:'='},
    template: '<input id="google_places_ac" name="google_places_ac" type="text" class="input-block-level"/>',
    link: function($scope, elm, attrs){
      /**
            var autocomplete = new google.maps.places.Autocomplete($("#google_places_ac")[0], {});

            google.maps.event.addListener(autocomplete, 'place_changed', function() {

              var place = autocomplete.getPlace();

              $scope.location = place.geometry.location.lat() + ',' + place.geometry.location.lng();
              
              $scope.map.setCenter(place.geometry.location);
              $scope.circle.setCenter(place.geometry.location);
              $scope.map.fitBounds($scope.circle.getBounds());

//store new lat, lon, and radius even without pressing findChats
     var lat = $scope.circle.getCenter().lat();
     var lon = $scope.circle.getCenter().lng();
     localStorage.setItem('lat', lat);
     localStorage.setItem('lon', lon);

     var newRadius = $scope.circle.getRadius();
     $scope.circle.radius = newRadius;
     localStorage.setItem('localNewRadius', (parseFloat(newRadius / 1609)));
  

              $scope.$apply();
            });
**/
         } //link
    } //return
});