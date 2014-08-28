//var jGlob;

//for the map drag interval below for map
//var cInt;

angular.module('chatRoom.controllers', ['chatRoom.services'])

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

 console.log("\n\n new user created: " + userID);
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

.controller('MainCtrl', function($scope, $timeout, $firebase) {

  connieDrag= false;
  console.log("\n\n $scope.map center is " + userPosition[0] + ", " + userPosition[1]);
  console.log("\n\n $scope.circle " + userPosition[0] + ", " + userPosition[1]);

  // set localNewRadius whenever switch view to MainCtrl
  // localStorage.setItem('localNewRadius', (parseFloat(angular.element(document.getElementById('firstElem')).scope().circle.radius) / 1609));

//clearInterval(cInt);

 $scope.radius = parseFloat(localStorage.getItem('localNewRadius'));
 
  //$scope.rooms = [];
  var ref = new Firebase('https://chaffy.firebaseio.com/open_rooms');  
  var promise = $firebase(ref);
  $scope.rooms = promise.$asArray();

  $scope.currentLocation=userPosition;

  $scope.booyah= function(){
    return 2;
  }

  $scope.getUserLocation = function(){
  return [parseFloat(localStorage.getItem('lat')), parseFloat(localStorage.getItem('lon'))]; 
  }

  $scope.currentLocation=$scope.getUserLocation();
  

  $scope.goToIt = function(theUrl){
    window.location=theUrl;
  }
 
$scope.distanceFromHere = function (_item, _startPoint) {

lat2 = $scope.getUserLocation()[0];
lon2 = $scope.getUserLocation()[1];
lat1 =_item.latitude;
lon1 = _item.longitude;
// console.log(lon1);
var R = 6371; // Radius of the earth in km
   var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1);  
   var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return (d* 0.621371).toFixed(2);
  } //distanceFromHere

// distance between chat and real user position
$scope.actualDistanceFromHere = function (_item, _startPoint) {
lat2 = userPosition[0];
lon2 = userPosition[1];
lat1 =_item.latitude;
lon1 = _item.longitude;
// console.log(lon1);
var R = 6371; // Radius of the earth in km
   var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1);  
   var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return (d* 0.621371).toFixed(2);
  
  } //actualDistanceFromHere

//jGlob = $scope; 

$scope.onRefresh = function() { 
  var stop = $timeout(function() {            
    $scope.$broadcast('scroll.refreshComplete');
  }, 1000);
}; //onRefresh

//myrooms view
$scope.userHasRoom = function(room) {

var usersRef = new Firebase('https://chaffy.firebaseio.com/users/');  
var userID = localStorage.getItem('localUserID');
$scope.thisUser = usersRef.child(userID);

$scope.thisUser.child("myRooms").once("value", function (snapshot) {
  $scope.myRooms = snapshot.val(); //current myRooms
 
}, function (errorObject) {
  console.log(errorObject);
});

for (var idx in $scope.myRooms) { //loop through all of users' rooms
  var roomId = $scope.myRooms[idx]; 
  if ($scope.room.id == roomId) {
    return true; //room found among users rooms
  }
}
return false; //room wasn't found in users' rooms
} //userHasRoom

// roomHotness refers to how many posts in certain time period

$scope.init = function(room){
  calcHotorActive(room);
}

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

  var firstOfLast = obj[0];
  var lastIndex = (obj.length - 1);
  var lastOfLast = obj[lastIndex];
  $scope.room.lastMessage = lastOfLast.content;

  $scope.firstCreated = parseFloat(firstOfLast.created_at);
  $scope.lastCreated = parseFloat(lastOfLast.created_at);

  console.log("first and last message created bt: " + $scope.firstCreated + " to " + $scope.lastCreated);


}) // first then

.then(function() {

  if ($scope.firstCreated > $scope.startTime) {
      $scope.room.isHot = true;
    } else {
      $scope.room.isHot = false;
  }

  if ($scope.lastCreated > $scope.startTimeSec) {
      //console.log("room is active, show icon!");
      $scope.room.isActive = true;
    } else {
      //console.log("room isn't active!");
      $scope.room.isActive = false;
  }

  if ($scope.totalMessages > 25) {
    $scope.room.isPopular = true;
  } else {
    $scope.room.isPopular = false;
  }


});


}; //calcHotorActive


}) //MainCtrl

.controller('NewRoomCtrl', function($scope, $location, $firebase) {      
  
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
       $scope.addMyRoom();

    $location.path('/home');

    })

   
  }; // createRoom()

$scope.addMyRoom = function() {
    // add to myRooms for thisUser 
  var usersRef = new Firebase('https://chaffy.firebaseio.com/users');  
  var userID = localStorage.getItem('localUserID');
  $scope.thisUser = usersRef.child(userID);
  
  $scope.roomToAdd = parseFloat(localStorage.getItem('lastRoomAdded'));
  console.log("\n\n roomToAdd: " + $scope.roomToAdd);

  //var promise = angularFire(myRooms, $scope, "myRooms");

//retrieve current rooms
var isReady = false;
$scope.thisUser.child("myRooms").once("value", function (snapshot) {
  $scope.myRooms = snapshot.val(); //current myRooms
  isReady = true;
}, function (errorObject) {
  console.log(errorObject);
});

//update thisUser's myRooms node with new upon data retrieval
if (isReady) {
  if ($scope.myRooms==""){ //oldRooms empty
    var roomsArray = [];
    roomsArray.push($scope.roomToAdd);
    $scope.thisUser.update({
      myRooms: roomsArray
    });
  } else { //has rooms already 
    $scope.roomsArray = [];
    for (var idx in $scope.myRooms) { //loop through all of users' rooms
      var roomId = $scope.myRooms[idx]; 
      $scope.roomsArray.push(roomId);
    }

    $scope.roomsArray.push($scope.roomToAdd);

    $scope.thisUser.update({
      myRooms: $scope.roomsArray
    });

    console.log("myRooms is now: " + $scope.roomsArray);

  } // else
  
} // isReady


}; // addMyRoom()


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
// connie
  $('#mainInput').on('focus', function(){
     $("#mainScroll .scroll").css('-webkit-transform','translate3d(0px, -'+(parseInt($('.scroll').css('height'))-190)+"px"+', 0px)');
  });


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
  $('#mainInput').blur();
  //$('#mainInput').off('focus');
}, 10);

// add to thisUser's myRooms if not already in myRooms

var userHasRoom = function() {
    CheckUserHasRoom.hasRoom($routeParams.roomId);
    console.log("ran CheckUserHasRoom!");
}
/**
var userHasRoom = function() {

$scope.usersRef = new Firebase('https://chaffy.firebaseio.com/users');
var userID = localStorage.getItem('localUserID');
$scope.thisUser = $scope.usersRef.child(userID);
var userPromise = $firebase($scope.thisUser.child("myRooms")).$asArray();

userPromise.$loaded().then(function(arr) {
  $scope.userHasRoom = true;
  for (idx=0; idx < arr.length; idx ++) {
    var roomId = arr[idx].$value;
    //console.log("roomId at " + idx + " is: " + roomId + " vs " + $routeParams.roomId);
    if ($routeParams.roomId == roomId) {
      console.log("found the room: " + roomId);
      return $scope.userHasRoom = false;
      break;
    }
  } // for
}).then(function() {
    if ($scope.userHasRoom==true) {
      console.log("running addMyRoom");
      addMyRoom();
    } else {
      console.log("not first message, didn't run addMyRoom");
    }
});

} //userHasRoom
**/

userHasRoom();

  }; //submitAddMessage

/**
function addMyRoom () {
  $scope.roomToAdd = parseFloat($routeParams.roomId);
  console.log("\n roomToAdd: " + $scope.roomToAdd);

//retrieve current rooms
$scope.usersRef = new Firebase('https://chaffy.firebaseio.com/users');
var userID = localStorage.getItem('localUserID');
$scope.thisUser = $scope.usersRef.child(userID);

$scope.thisUser.child("myRooms").once("value", function (snapshot) {
  $scope.myRooms = snapshot.val(); //current myRooms
  console.log("$scope.myRooms is:" + $scope.myRooms);
}, function (errorObject) {
  console.log(errorObject);
});

// callback after retrieving myRooms data
  if ($scope.myRooms==""){ //myRooms empty
    $scope.roomsArray = [];
    $scope.roomsArray.push($scope.roomToAdd);
    $scope.thisUser.update({
      myRooms: $scope.roomsArray
    });
    console.log("myRooms empty, init with: " + $scope.roomsArray);
  } else { //has rooms already 
    $scope.roomsArray = [];
    for (var idx in $scope.myRooms) { //loop through all of users' rooms
      var roomId = $scope.myRooms[idx]; 
      $scope.roomsArray.push(roomId);
    }
    $scope.roomsArray.push($scope.roomToAdd);

    $scope.thisUser.update({
      myRooms: $scope.roomsArray
    });

    console.log("myRooms updated to: " + $scope.roomsArray);
  } // else
}; // addMyRoom()
**/

$scope.onRefresh = function() {
    var stop = $timeout(function() {
      $scope.$broadcast('scroll.refreshComplete');
    }, 1000);
};

}) // RoomCtrl

.controller('AboutCtrl', function($scope) {

  connieDrag= false;
})

.controller('LaunchCtrl', function($scope, $location, $rootScope) {

  connieDrag=true;

$scope.checkAlias = function(){
  if (localStorage.getItem('localusername')==null) {
    //console.log("can't find localusername");
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
    console.log("can't find localuserAge");
    return;
  } else {
    return localStorage.getItem('localuserAge');
  }

}

$scope.userPro = {
  username: $scope.checkAlias(),
  gender: $scope.checkGender(),
  age: $scope.checkAge()
}

/**
$scope.userAlias = function(){
  console.log("userAlias changed!");
  localStorage.setItem("localusername", $scope.userProfile.username);
}
**/
  $scope.findChats = function() {

// set localNewRadius when user clicks GO
    var newRadius = parseFloat(($scope.circle.radius) / 1609);
    localStorage.setItem('localNewRadius', newRadius);
// console.log("\n\n\n\n findChats says " + localStorage.getItem('localNewRadius'));

// reset localStorage lat, lon and userPosition to circle center on GO
    var lat = $scope.circle.center.latitude;
    var lon = $scope.circle.center.longitude;
   // userPosition[0] = parseFloat(lat);
   // userPosition[1] = parseFloat(lon);
    localStorage.setItem('lat', lat);
    localStorage.setItem('lon', lon);

    // $scope.username = 'User' + Math.floor(Math.random() * 501);
    // $scope.username = $scope.userAlias;

    $scope.setUserName = function(){
      if ($scope.userPro.username==undefined) {
        return 'chaffer' + Math.floor(Math.random() * 999);
      } else {
        return $scope.userPro.username;
      }
    }
    localStorage.setItem("localusername", $scope.setUserName());
    
    $scope.setUserGender = function(){
      if ($scope.userPro.gender =='male' || $scope.userPro.gender =='female') {
        console.log("user gender is: " + $scope.userPro.gender);
        return $scope.userPro.gender;
      } else {
        return 'anon';
      }
    }
    localStorage.setItem("localuserGender", $scope.setUserGender());

    $scope.setUserAge = function(){
      if ($scope.userPro.age == '18-29'|| $scope.userPro.age == '30-49' || $scope.userPro.age == '49+') {

        console.log("user age is: " + $scope.userPro.age);
        return $scope.userPro.age;

      } else {
        return 'anon';
      }
    }
    localStorage.setItem("localuserAge", $scope.setUserAge());

//  retrieve Firebase 'users' 
  var usersRef = new Firebase('https://chaffy.firebaseio.com/users'); 
  var userID = localStorage.getItem('localUserID');
  var thisUser = usersRef.child(userID);
  // var promise = angularFire(userRef, $scope, "userRef");

thisUser.update({
  username: localStorage.getItem("localusername"),
  gender: $scope.setUserGender(),
  age: $scope.setUserAge()
});

console.log("\n\n" + "current userID is " + thisUser.name());

$location.path('/swipe');

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

$scope.map = {
    center: {
      latitude: userPosition[0],
      longitude: userPosition[1]
    },
    zoom: 9,
    refresh:false
};

$scope.map.isReady = false;
/**
$scope.mapevents = {
  drag: function(){
    //$scope.map.center = {latitude: userPosition[0], longitude: userPosition[1]};
    $scope.map.center = $scope.circle.center;
  }
}
**/
$scope.events = {
               dragend: function (marker) {
                  $rootScope.$apply(function () {
                    /**
                     console.log(marker.position.lat());
                     console.log(marker.position.lng());
                     **/
                    
                     var lat = $scope.circle.center.latitude;
                     var lon = $scope.circle.center.longitude;

                     /**
                     userPosition[0] = parseFloat(lat);
                     userPosition[1] = parseFloat(lon);
                     **/
                     localStorage.setItem('lat', lat);
                     localStorage.setItem('lon', lon);

                    //$scope.map.center = $scope.circle.center;

                  });
               },
               radius_changed: function() {
                localStorage.setItem('localNewRadius', (parseFloat($scope.circle.radius / 1609)));
                console.log("\n\n\n" + localStorage.getItem('localNewRadius'));
               }
            }

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
  geodesic: true
};

$scope.map.isReady = true;

})

.controller('CardsCtrl', function($scope, $ionicSwipeCardDelegate, $firebase) {

connieDrag=false;

$scope.radius = parseFloat(localStorage.getItem('localNewRadius'));

$scope.radiusInMi = $scope.radius.toFixed(2);

 //console.log("\n\n radius in swipe is " + $scope.radius);

  $scope.chatCards = [];
  var chatCards = [];
  var chatsRef = new Firebase('https://chaffy.firebaseio.com/open_rooms');  
  var promise = $firebase(chatsRef);
  var obj = promise.$asArray();


obj.$loaded().then(function(data) {
  
  var theCards = data;
  
  for (var i=0; i < theCards.length; ++i) {
    var newCard = {
      title: theCards[i].title,
      //image: 'img/pic.png', 
      id: theCards[i].id,
      description: theCards[i].description,
      latitude: theCards[i].latitude,
      longitude: theCards[i].longitude
    };

    //console.log('\n new Card with desc: ' + theCards[i].description);
    chatCards.push(newCard);
  }

}, function (errorObject) {
  console.log('The read failed: ' + errorObject.code);
});


$scope.chatCards = Array.prototype.slice.call(chatCards, 0, 0);

// distance between chat and selected circle center - for checking within radius
$scope.getUserLocation = function(){
  return [parseFloat(localStorage.getItem('lat')), parseFloat(localStorage.getItem('lon'))]; 
  }

//$scope.currentLocation=$scope.getUserLocation();

$scope.distanceFromHere = function (_item, _startPoint) {
lat2 = $scope.getUserLocation()[0];
lon2 = $scope.getUserLocation()[1];
lat1 =_item.latitude;
lon1 = _item.longitude;
// console.log(lon1);
var R = 6371; // Radius of the earth in km
   var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1);  
   var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return (d* 0.621371).toFixed(2);
  
  } //distanceFromHere

// distance between chat and real user position
$scope.actualDistanceFromHere = function (_item, _startPoint) {
lat2 = userPosition[0];
lon2 = userPosition[1];
lat1 =_item.latitude;
lon1 = _item.longitude;
// console.log(lon1);
var R = 6371; // Radius of the earth in km
   var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1);  
   var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return (d* 0.621371).toFixed(2);
  
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
    //console.log("adding card: " + newCard.title);
    $scope.chatCards.push(angular.extend({}, newCard));
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
