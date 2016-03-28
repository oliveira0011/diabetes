angular.module('app.controllers', [])
  /**
   *
   * APPLICATION CONTROLLER
   */
  .controller('AppCtrl', function ($scope, $state, FirebaseService, MessageService) {
    $scope.logout = function () {
      FirebaseService.getDBConnection().unauth();
      FirebaseService.logoutCurrentUser();
      $state.go('login');
    };
    $scope.$on('logoutUser', function () {
      $scope.logout();
    });
    $scope.$on('newNotification', function (e, value) {
      $state.go('app.messages');
    });
    $scope.newNotificationsNumber = 0;
    $scope.$on('new_notification', function (e, value) {
      $scope.newNotificationsNumber++;
    });
    MessageService.registerNewNotificationsListener();
    MessageService.getMessages(function (messages) {
      $scope.newNotificationsNumber = messages.length;
      MessageService.registerNewNotificationsListener();
    });
  })
  .controller('MainCtrl', function ($scope, $timeout, $window, $state, $cordovaDeviceMotion, $ionicPlatform, FirebaseService, $http, TimerService) {
    $scope.$on('deviceUpdated', function (e, deviceId) {
      console.log(deviceId);
      $scope.deviceToken = deviceId;
    });
    FirebaseService.getDBConnection().child("users").child("e97c6bd0-47ac-47db-95df-b3134be52859").child("deviceToken").on('value', function (snap) {
      $scope.remoteDeviceToken = snap.val();
    });
    $scope.options = [
      {name: "Eventos", color: "positive", icon: "ion-android-walk", link: "#/app/events"},
      {name: "Amigos", color: "positive", icon: "ion-person-stalker", link: "#/app/search"},
      {name: "Atividade Física", color: "positive", icon: "ion-ios-pulse", link: "#/app/search"},
      {name: "Definições", color: "positive", icon: "ion-gear-a", link: "#/app/search"}
    ];

    $scope.redirect = function () {
      $state.go('app.search');
    };


    $scope.chartSpeed = {
      options: {
        responsive: true,
        bezierCurve: false,
        animation: false,
        pointDot: false
      },
      labels: [],
      //data: [records],
      data: [[]],
      series: ['Speed (Km/h)'],
      colours: [{
        fillColor: "#FAA43A",
        strokeColor: "#FF8C00",
        pointColor: "#FF4500",
        pointStrokeColor: "#FF4500"
      }]
    };

    $scope.attrs = {
      bgcolor: "FFFFFF",
      animation: "0",
      showalternatehgridcolor: "0",
      divlinecolor: "CCCCCC",
      showvalues: "0",
      showcanvasborder: "0",
      legendshadow: "0",
      legendborderalpha: "0",
      showborder: "0",
      anchorAlpha: '0'
    };

    $scope.categories = [{
      category: []
    }];

    $scope.dataset = [{
      "seriesname": "",
      "data": []
    }];

    $scope.data = {
      refreshRate: 500
    };

    $scope.options = {
      frequency: $scope.data.refreshRate // Measure every 100ms
      //deviation: 25  // We'll use deviation to determine the shake event, best values in the range between 25 and 30
    };

    $scope.threshold = 10;
    $scope.numSteps = 0;
    $scope.currentY = 0;
    $scope.previousY = 0;

    $scope.deviceToken = FirebaseService.getDeviceToken();


    $scope.$watch('data.refreshRate', function (val) {
      //console.log(1);
      //$scope.stopWatch();
      //$scope.startWatch();
    });

    $scope.meanSpeed = 0;
    $scope.topSpeed = 0;
    $scope.readsCount = 0;
    $scope.vx = 0;
    $scope.vy = 0;
    $scope.vz = 0;
    $scope.speed = 0;
    $scope.timeElapsed = 0;
    $scope.startTimestamp = 0;
    $scope.clearData = function () {
      $scope.meanSpeed = 0;
      $scope.topSpeed = 0;
      $scope.readsCount = 0;
      $scope.numSteps = 0;
      $scope.vx = 0;
      $scope.vy = 0;
      $scope.vz = 0;
      $scope.speed = 0;
      //$scope.chartSpeed.data[0] = [];
      //$scope.chartSpeed.labels = [];
      $scope.categories[0].category = [];
      $scope.dataset[0].data = [];
      $scope.timeElapsed = 0;
      $scope.startTimestamp = 0;
    };
    $scope.startWatch = function () {
      if (!$scope.active) {
        $scope.startWatching();
        $scope.active = true;
      }
    };
    $scope.stopWatch = function () {
      if ($scope.active) {
        $scope.stopWatching();
      }
    };
    $scope.getFormattedDate = function (timestamp) {
      var date = new Date(timestamp);
      var day = date.getDate();
      var month = date.getMonth() + 1;
      month = month < 10 ? '0' + month : month;
      day = day < 10 ? '0' + day : day;
      var year = date.getFullYear();
      return day + "-" + month + '-' + year;
    };
    $scope.getFormattedTimerDate = function () {
      var millis = $scope.timeElapsed;
      var minutes = Math.floor(millis / 60000);
      var seconds = ((millis % 60000) / 1000).toFixed(0);
      return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    };

    $scope.cancelListeners = function () {
      FirebaseService.getDBConnection().child('physical_activity').child(FirebaseService.getCurrentUserUid()).child($scope.getFormattedDate(new Date().getTime()))
        .orderByChild('timestamp').startAt($scope.startTimestamp).off('child_added', function () {
        console.log("off");
      });
      //$scope.chartSpeed.data[0] = [];
      //$scope.chartSpeed.labels = [];
      $scope.categories[0].category = [];
      $scope.dataset[0].data = [];
    };
    $scope.registerListeners = function () {
      FirebaseService.getDBConnection().child('physical_activity').child(FirebaseService.getCurrentUserUid()).child($scope.getFormattedDate(new Date().getTime()))
        .orderByChild('timestamp').startAt($scope.startTimestamp).once('value', function (snap) {
        var items = snap.val();
        if (!items || items == null) {
          items = [];
        }
        for (var i = 0; i < items.length; i++) {
          var obj = items[i];
          //$scope.chartSpeed.data[0].push(obj.speed);
          //$scope.chartSpeed.labels.push('');
          $scope.dataset[0].data.push({value: obj.speed});
          $scope.categories[0].category.push({'label': $scope.getFormattedTimerDate()});
        }
      });
      FirebaseService.getDBConnection().child('physical_activity').child(FirebaseService.getCurrentUserUid()).child($scope.getFormattedDate(new Date().getTime()))
        .orderByChild('timestamp').startAt($scope.startTimestamp).on('child_added', function (snap) {
        var item = snap.val();
        //$scope.chartSpeed.data[0].push(item.speed);
        //$scope.chartSpeed.labels.push('');
        $scope.dataset[0].data.push({value: item.speed});
        $scope.categories[0].category.push({'label': $scope.getFormattedTimerDate()});
      });
      $scope.stopWatching = function () {
        if ($scope.watch) {
          $scope.watch.clearWatch();
          $scope.active = false;
        }
      };
    };


    $scope.startWatching = function () {
      if (!$cordovaDeviceMotion) {
        return;
      }
      $scope.clearData();
      // Device motion configuration
      $scope.watch = $cordovaDeviceMotion.watchAcceleration($scope.options);
      $scope.active = true;
      // Device motion initilaization
      //$scope.counter = 0;

      $scope.currentIterationTimestamp = new Date().getTime();
      $scope.currentIterationSpeed = 0;
      $scope.timeElapsed = 0;
      $scope.startTimestamp = new Date().getTime();

      $scope.iteration = 0;

      $scope.watch.then(null, function (error) {
        console.log('Error');
      }, function (result) {

        $scope.timeElapsed = result.timestamp - $scope.startTimestamp;

        var x = result.x;
        var y = result.y;
        var z = result.z;

        $scope.currentY = y;

        if (Math.abs($scope.currentY - $scope.previousY) > $scope.threshold) {
          $scope.numSteps++;
        }

        $scope.x = x;
        $scope.y = y;
        $scope.z = z;
        $scope.previousY = $scope.currentY;
        $scope.timestamp = result.timestamp;

        $scope.vx += $scope.x * ($scope.options.frequency / 1000);
        $scope.vy += $scope.y * ($scope.options.frequency / 1000);
        $scope.vz += $scope.z * ($scope.options.frequency / 1000);

        var stoppedSpeed = (Math.sqrt((9.81 * 9.81)) * ($scope.options.frequency / 1000));
        var aux = (Math.sqrt(($scope.x * $scope.x) + ($scope.y * $scope.y) + ($scope.z * $scope.z)) * ($scope.options.frequency / 1000));

        aux -= stoppedSpeed;

        /*
         * NORMALIZE DATA
         */
        if (aux - 0.3 < 0) {
          aux = 0;
        }
        $scope.speed = $scope.speed + aux;
        var kmPerHSpeed = 3.6 * aux;

        $scope.speed = aux;
        $scope.speedKm = kmPerHSpeed;
        //$scope.speedKm = aux;

        //sqrt((ax*ax)+(ay*ay)+(az*az)) * deltaT
        $scope.counter++;


        $scope.meanSpeed = ($scope.meanSpeed + $scope.speedKm) / 2;


        //if($scope.counter == 5){
        //  $scope.counter = 0;
        //  $scope.chartSpeed.data[0].push($scope.meanSpeed);
        //  $scope.chartSpeed.labels.push('');
        //}

        $scope.currentIterationSpeed = ($scope.currentIterationSpeed + $scope.speedKm) / 2;

        $scope.timestampAux = ($scope.timestamp - $scope.currentIterationTimestamp) / 1000;
        if (($scope.timestamp - $scope.currentIterationTimestamp) / 1000 > 5) {
          FirebaseService.getDBConnection().child('physical_activity').child(FirebaseService.getCurrentUserUid()).child($scope.getFormattedDate(new Date().getTime())).push().set({
            timestamp: $scope.timestamp,
            x: $scope.x,
            y: $scope.y,
            z: $scope.z,
            speed: $scope.currentIterationSpeed
          });
          $scope.currentIterationTimestamp = $scope.timestamp;
          $scope.currentIterationSpeed = 0;
        }
        $scope.topSpeed = $scope.topSpeed < $scope.speedKm ? $scope.speedKm : $scope.topSpeed;
        $scope.readsCount++;
      });
      $scope.registerListeners();
    };
    $ionicPlatform.ready(function () {
      $scope.startWatching();
    });

    $scope.$on('$ionicView.beforeLeave', function () {
      if ($scope.watch !== undefined) {
        $cordovaDeviceMotion.clearWatch($scope.watch); // Turn off motion detection watcher
      }
    });
  })
  .
  controller('LoginCtrl', function ($scope, $state, $stateParams, FirebaseService, $ionicPopup, $ionicLoading) {
    console.log(FirebaseService.isUserLogged());
    if (FirebaseService.isUserLogged()) {
      FirebaseService.checkDeviceToken();
      $state.go('app.main');
    }
    $scope.loginData = {
      username: 'oliveira_011@hotmail.com',
      password: 'xptoxpto',
    };
    $scope.doLogin = function (form) {
      delete $scope.errorMessage;
      //console.log(form.$valid);
      if (form.$valid) {
        $ionicLoading.show({template: 'A autenticar...'});
        console.log($scope.loginData);
        var dbConnection = FirebaseService.getDBConnection();

        function authHandler(error, authData) {
          if (error) {
            console.log("Login Failed!", error);
          } else {
            console.log("Authenticated successfully with payload:", authData);
            FirebaseService.setCurrentUserUid(authData.uid);
            if (authData.password.isTemporaryPassword) {
              $ionicLoading.hide();
              var tempPass = $scope.loginData.password;
              $scope.data = {};
              var myPopup = $ionicPopup.show({
                template: '<input type="password" ng-model="data.newPassword">',
                title: 'Nova Palavra-Passe',
                subTitle: 'A palavra-passe introduzida, apesar de válida, é uma palavra-passe temporária, por favor introduza uma nova palavra passe. Esta passará a ser a sua palavra-chave de autenticação na plataforma',
                scope: $scope,
                buttons: [
                  {text: 'Cancelar'},
                  {
                    text: '<b>Gravar</b>',
                    type: 'button-positive',
                    onTap: function (e) {
                      console.log(!$scope.data.newPassword);
                      if (!$scope.data.newPassword) {
                        e.preventDefault();
                      } else {
                        return $scope.data.newPassword;
                      }
                    }
                  }
                ]
              });

              myPopup.then(function (res) {
                console.log(res);
                delete $scope.data;
                dbConnection.changePassword({
                  email: $scope.loginData.username,
                  newPassword: res,
                  oldPassword: tempPass
                }, function (error) {
                  if (error) {
                    switch (error.code) {
                      case "INVALID_PASSWORD":
                        console.log("The specified user account password is incorrect.");
                        break;
                      case "INVALID_USER":
                        console.log("The specified user account does not exist.");
                        break;
                      default:
                        console.log("Error changing password:", error);
                    }
                  } else {
                    console.log("User password changed successfully!");

                    dbConnection.authWithPassword({
                      email: $scope.loginData.username,
                      password: res
                    }, authHandler);

                  }
                });
              });
              return;
            }
            FirebaseService.checkDeviceToken();
            $state.go('app.main');
            $scope.loginData = {};
            form.$setPristine(false);
          }
          $ionicLoading.hide();
        }

        dbConnection.authWithPassword({
          email: $scope.loginData.username,
          password: $scope.loginData.password
        }, authHandler);

      }
      return false;
      //if($scope.loginData.username.trim().length == 0){
      //
      //}
    };

    $scope.resetPassword = function () {
      $scope.data = {};
      var myPopup = $ionicPopup.show({
        template: '<input type="email" ng-model="data.email">',
        title: 'Recuperar Palavra-Passe',
        subTitle: 'Introduza o seu email de acesso à plataforma. Ser-lhe-à enviado um email com uma palavra-passe temporária.',
        scope: $scope,
        buttons: [
          {text: 'Cancelar'},
          {
            text: '<b>Gravar</b>',
            type: 'button-positive',
            onTap: function (e) {
              console.log(!$scope.data.email);
              if (!$scope.data.email) {
                e.preventDefault();
              } else {
                return $scope.data.email;
              }
            }
          }
        ]
      });

      myPopup.then(function (res) {
        $ionicLoading.show({
          template: "A enviar email de reposição de palavra-passe..."
        });
        console.log(res);
        FirebaseService.getDBConnection().resetPassword({
          email: res
        }, function (error) {
          if (error === null) {
            console.log("Password reset email sent successfully");
            $scope.infoMessages = ["Email de recuperação de palavra-passe enviado com sucesso"];
          } else {
            console.log("Error sending password reset email:", error);
            $scope.errorMessages =
              ["Lamentamos mas não foi possível enviar o email de recuperação de palavra-passe.",
                "Por favor, verifique se o email introduzido é válido e/ou tente mais tarde."];
            $scope.$apply();
          }
          delete $scope.data;
          $ionicLoading.hide();
        });
      });
    };
  })
  .controller('PlaylistCtrl', function ($scope, $stateParams) {
  })
  .controller('EventsCtrl', function (EventsService, $scope, $ionicLoading, $compile) {
    EventsService.getAllEvents(function (events) {
      $scope.events = events;
      for (var i = 0; i < $scope.events.length; i++) {
        var obj = $scope.events[i];
        $scope.events[i].friendsNumber = 0;
        for (var property in obj.friends) {
          if (obj.friends.hasOwnProperty(property) && obj.friends[property].participate) {
            $scope.events[i].friendsNumber++;
          }
        }
      }
    }, function () {
      if (!$scope.events) {
        return;
      }
      for (var i = 0; i < $scope.events.length; i++) {
        var obj = $scope.events[i];
        $scope.events[i].friendsNumber = 0;
        for (var property in obj.friends) {
          if (obj.friends.hasOwnProperty(property) && obj.friends[property].participate) {
            $scope.events[i].friendsNumber++;
          }
        }
      }
      if (!$scope.$$phase) {
        $scope.$apply();
      }
    });

    $scope.getFormattedDate = function (timestamp) {
      var date = new Date(timestamp);
      var day = date.getDate();
      var month = date.getMonth() + 1;
      var hour = date.getHours();
      var minute = date.getMinutes();
      var second = date.getSeconds();
      month = month < 10 ? '0' + month : month;
      day = day < 10 ? '0' + day : day;
      hour = hour < 10 ? '0' + hour : hour;
      minute = minute < 10 ? '0' + minute : minute;
      second = second < 10 ? '0' + second : second;
      var year = date.getFullYear();
      return day + "-" + month + '-' + year + ' ' + hour + ':' + minute + ':' + second;
    };

  })
  .controller('EventCtrl', function (Friend, Event, EventsService, $scope, $ionicLoading, $compile, $state, $stateParams, $ionicModal, FriendsService) {
    if ($stateParams.id) {
      $scope.event = EventsService.events[$stateParams.id];
      $scope.newEvent = false;
    } else {
      $scope.event = new Event();
      $scope.event.date = new Date();
      $scope.newEvent = true;
    }
    $scope.minDate = new Date();

    //<editor-fold desc="Modal Friends">
    FriendsService.getFriends(function (friends) {
      $scope.friends = friends;
      $scope.selectAll = $scope.selectedFriends.length == 0 || $scope.selectedFriends.length == $scope.friends.length;
    });
    $scope.friends = [];
    $scope.selectedFriends = [];
    $scope.selectAll = $scope.selectedFriends.length == 0 || $scope.selectedFriends.length == $scope.friends.length;

    $scope.toggleAll = function () {
      if (!$scope.selectAll) {
        $scope.selectedFriends = [];
        angular.forEach($scope.friends, function (friend) {
          friend.selected = false;
        });
      } else {
        angular.forEach($scope.friends, function (friend) {
          if (friend instanceof Friend) {
            friend.selected = true;
            $scope.selectedFriends[friend.id] = friend;
          }
        });
      }
    };
    $scope.toggleFriend = function (friend) {
      if (friend.selected) {
        $scope.selectedFriends[friend.id] = friend;
      } else {
        delete $scope.selectedFriends[friend.id];
      }
    };
    $scope.closeModal = function () {
      $scope.event.friends = [];
      for (var selectedFriend in $scope.selectedFriends) {
        if ($scope.selectedFriends.hasOwnProperty(selectedFriend)) {
          $scope.event.friends.push($scope.selectedFriends[selectedFriend]);
        }
      }
      $scope.modal.hide();
    };
    $scope.openModalFriends = function () {
      $ionicModal.fromTemplateUrl('/templates/friends-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modal = modal;
        console.log("modal:")
        console.log($scope.modal)
        $scope.modal.show();
      });
    };

    $scope.saveEvent = function (form) {
      if ($scope.event.date != null) {
        form.date.$setValidity('required', true);
      }
      if ($scope.event.friends.length == 0) {
        return;
      }
      if (form.$invalid) {
        console.log(form);
        return;
      } else if ($scope.event.date == null) {
        form.date.$setValidity('required', false);
        return;
      }
      $ionicLoading.show({template: "A gravar Evento..."});

      var handler = function () {
        $ionicLoading.hide();
        $state.go('app.events');
      };
      if ($scope.newEvent) {
        EventsService.addEvent($scope.event, handler);
      } else {
        EventsService.editEvent($stateParams.id, $scope.event, handler);
      }
    };
    $scope.getFormattedDate = function (timestamp) {
      var date = new Date(timestamp);
      var day = date.getDate();
      var month = date.getMonth() + 1;
      var hour = date.getHours();
      var minute = date.getMinutes();
      var second = date.getSeconds();
      month = month < 10 ? '0' + month : month;
      day = day < 10 ? '0' + day : day;
      hour = hour < 10 ? '0' + hour : hour;
      minute = minute < 10 ? '0' + minute : minute;
      second = second < 10 ? '0' + second : second;
      var year = date.getFullYear();
      console.log(day + "-" + month + '-' + year + ' ' + hour + ':' + minute + ':' + second);
      return day + "-" + month + '-' + year + ' ' + hour + ':' + minute + ':' + second;
    };

    //</editor-fold>

    function initialize() {
      var myLatlng = new google.maps.LatLng(39.7375278, -8.813522, 17);

      var mapOptions = {
        center: myLatlng,
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.HYBRID
      };
      var map = new google.maps.Map(document.getElementById("map"), mapOptions);

      var marker = new google.maps.Marker({
        position: myLatlng,
        map: map
      });

      function placeMarker(location) {
        marker.setMap(null);
        marker = new google.maps.Marker({
          position: location,
          map: map,
          animation: google.maps.Animation.DROP
        });
        var geocoder = new google.maps.Geocoder;
        geocoder.geocode({'location': location}, function (results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            console.log(results);
            if (results[0]) {
              $scope.event.location = results[0].formatted_address;
            } else {
              $scope.event.location = "Lat: " + event.latLng.lat() + "\nLng: " + event.latLng.lng();
            }
          } else {
            console.log('Geocoder failed due to: ' + status);
            $scope.event.location = "Lat: " + event.latLng.lat() + "\nLng: " + event.latLng.lng();
          }
          $scope.$apply();
        });
      }

      google.maps.event.addListener(map, 'click', function (event) {
        placeMarker(event.latLng);
        $scope.event.geoLocation = event.latLng;
      });


      $scope.map = map;
    }

    $scope.marker = {};
    ionic.Platform.ready(initialize);

    $scope.clearLocation = function () {
      delete $scope.event.location;
      delete $scope.event.geoLocation;
    }
  })
  .controller('EventFindCtrl', function ($scope, $ionicLoading, $compile, $state, $stateParams, EventsService, FirebaseService) {
    function initialize(lat, lng) {
      var myLatlng = new google.maps.LatLng(lat, lng);
      var mapOptions = {
        center: myLatlng,
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.HYBRID
      };

      if (!$scope.map) {
        var map = new google.maps.Map(document.getElementById("map"), mapOptions);
        $scope.map = map;
        $scope.marker = new google.maps.Marker({
          position: myLatlng,
          map: map
        });
      } else {
        $scope.marker.setPosition(myLatlng);
      }
    }

    $scope.participate = false;
    EventsService.getEvent($stateParams.id, function (event) {
      $scope.event = event;
      $scope.canEditParticipation = (event.owner !== FirebaseService.getCurrentUserUid());

      initialize(event.geoLocation.lat, event.geoLocation.lng);
      $scope.participate = false;
      for (var i = 0; i < $scope.event.friends.length; i++) {
        var obj = $scope.event.friends[i];
        if (obj.id == FirebaseService.getCurrentUserUid()) {
          $scope.participate = true;
        }
      }
    }, function () {
      for (var i = 0; i < $scope.event.friends.length; i++) {
        var obj = $scope.event.friends[i];
        if (obj.id == FirebaseService.getCurrentUserUid()) {
          $scope.participate = true;
        }
      }
      if (!$scope.$$phase) {
        $scope.$apply();
      }
    });

    $scope.editParticipation = function () {
      if ($scope.participate == false) {
        $scope.participate = true;
      } else {
        $scope.participate = false;
      }
      //$scope.participate = participate;
      EventsService.editParticipation($stateParams.id, $scope.participate, function () {
        console.log("DONE");
      })
    };

    $scope.getFormattedDate = function (timestamp) {
      var date = new Date(timestamp);
      var day = date.getDate();
      var month = date.getMonth() + 1;
      var hour = date.getHours();
      var minute = date.getMinutes();
      var second = date.getSeconds();
      month = month < 10 ? '0' + month : month;
      day = day < 10 ? '0' + day : day;
      hour = hour < 10 ? '0' + hour : hour;
      minute = minute < 10 ? '0' + minute : minute;
      second = second < 10 ? '0' + second : second;
      var year = date.getFullYear();
      return day + "-" + month + '-' + year + ' ' + hour + ':' + minute + ':' + second;
    };
  })
  .
  controller('ProfileCtrl', function ($scope, UserFormFactory, FirebaseService, $stateParams, $rootScope, $ionicLoading, $ionicPopup, $state) {
    //$scope.user = {firstName:1,lastName:1,address:1,oldPassword:1};
    $scope.user = {};
    var dbConnection = FirebaseService.getDBConnection();
    //If you want to use URL attributes before the website is loaded
    $scope.init = function () {
      //$scope.user = UserFormFactory.getUserStructure(false);
      angular.forEach($scope.retrievedUser, function (retrievedUserValue, retrievedUserKey) {
        $scope.user[retrievedUserKey] = retrievedUserValue;
      });
      if ($scope.retrievedUser && $scope.retrievedUser.id && $scope.retrievedUser.id !== '') {
        dbConnection.child("profileImages").child($scope.retrievedUser.id).once('value', function (data) {
          if (data.val() != null) {
            $scope.user.profileImage = data.val().image;
            if (!$scope.$$phase) {
              $scope.$apply();
            }
          }
        });
      }
    };
    if (FirebaseService.isUserLogged()) {
      dbConnection.child('users').child(FirebaseService.getCurrentUserUid()).once('value', function (user) {
        $scope.retrievedUser = user.val();
        $scope.retrievedUser.id = FirebaseService.getCurrentUserUid();
        $scope.init();
        console.log(1);
      });
    } else {
      $state.go('login');
    }
  })
  .controller('BiomedicCtrl', function ($scope, BiomedicService, BiomedicType) {
    $scope.hemoglobinRecords = [];
    $scope.bloodPressureRecords = [];
    $scope.cholesterolRecords = [];
    $scope.weightRecords = [];
    function getFormattedDate(timestamp) {
      var date = new Date(timestamp);
      var month = date.getMonth() + 1;
      month = month < 10 ? '0' + month : month;
      var year = date.getFullYear();
      return month + '-' + year;
    }

    var handler = function (type, retrievedRecords) {
      if (!retrievedRecords) {
        return;
      }
      var arr = Object.keys(retrievedRecords).map(function (k) {
        return retrievedRecords[k]
      });
      if (arr.length == 0) {
        return;
      }
      var records = [];
      var colors = {};
      var labels = [];
      switch (type) {
        case BiomedicType.HEMOGLOBIN:
          console.log($scope.hemoglobinRecords);
          colors = {
            fillColor: "#F15854",
            strokeColor: "#B22222",
            pointColor: "#800000",
            pointStrokeColor: "#800000",
          };
          records = $scope.hemoglobinRecords;
          break;
        case BiomedicType.BLOOD_PRESSURE:
          console.log('qweqweqweqwe');
          console.log(retrievedRecords);
          records = [[], []];
          labels = [];
          var minRecords = Object.keys(retrievedRecords[0]).map(function (k) {
            return retrievedRecords[0][k]
          });
          var maxRecords = Object.keys(retrievedRecords[1]).map(function (k) {
            return retrievedRecords[1][k]
          });

          var rec = minRecords.concat(maxRecords);
          rec.sort(function (a, b) {
            return parseFloat(a.biomedicDate) - parseFloat(b.biomedicDate);
          });
          console.log(rec);

          var cMax = 0;
          var cMin = 0;
          for (var i = 0; i < rec.length; i++) {
            var record = rec[i];
            var isNew = true;
            var date = getFormattedDate(record.biomedicDate);
            var nextRecord;
            var nextDate;
            if (labels.indexOf(date) == -1) {
              if (record.type == BiomedicType.MIN_BLOOD_PRESSURE) {
                nextRecord = rec[cMin + 1];
              } else if (record.type == BiomedicType.MAX_BLOOD_PRESSURE) {
                nextRecord = rec[cMax + 1];
              }
              labels.push(date);
              if (nextRecord) {
                nextDate = getFormattedDate(nextRecord.biomedicDate);
                if (nextDate == date) {
                  isNew = false;
                  if (nextRecord.type == BiomedicType.MIN_BLOOD_PRESSURE) {
                    console.log(1);
                    records[1].push(nextRecord.value);
                    i++;
                  } else if (nextRecord.type == BiomedicType.MAX_BLOOD_PRESSURE) {
                    console.log(2);
                    records[0].push(nextRecord.value);
                    i++;
                  }
                  cMin++;
                  cMax++;
                } else {
                  nextRecord = undefined;
                  if (record.type == BiomedicType.MIN_BLOOD_PRESSURE) {
                    console.log(3);
                    records[0].push(0);
                    cMin++;
                  } else if (record.type == BiomedicType.MAX_BLOOD_PRESSURE) {
                    console.log(4);
                    records[1].push(0);
                    cMax++;
                  }
                }
              }
            }
            cMin++;
            cMax++;


            if (record.type == BiomedicType.MIN_BLOOD_PRESSURE) {
              records[1].push(record.value);
            } else if (record.type == BiomedicType.MAX_BLOOD_PRESSURE) {
              records[0].push(record.value);
            }
            console.log("[NOW]:" + date + " -> " + record.value + " -> " + record.type);
            console.log("[NEXT]:" + nextDate + " -> " + (!nextRecord ? '' : nextRecord.value) + " -> " + (!nextRecord ? '' : nextRecord.type));
          }
          console.log(records);
          colors = {
            fillColor: "#FAA43A",
            strokeColor: "#FF8C00",
            pointColor: "#FF4500",
            pointStrokeColor: "#FF4500"
          };
          break;
        case BiomedicType.CHOLESTEROL:
          colors = {
            fillColor: "#F17CB0",
            strokeColor: "#F08080",
            pointColor: "#CD5C5C",
            pointStrokeColor: "#CD5C5C"
          };
          records = $scope.cholesterolRecords;
          break;
        case BiomedicType.WEIGHT:
          colors = {
            fillColor: "#F17CB0",
            strokeColor: "#F08080",
            pointColor: "#CD5C5C",
            pointStrokeColor: "#CD5C5C"
          };
          records = $scope.weightRecords;
          break;
      }
      if (records.length == 0) {


        arr.sort(function (a, b) {
          return parseFloat(a.biomedicDate) - parseFloat(b.biomedicDate);
        });
        angular.forEach(arr, function (record) {
          records.push(record.value);
          labels.push(getFormattedDate(record.biomedicDate));
        });

      }
      switch (type) {
        case BiomedicType.HEMOGLOBIN:
          $scope.chartHemoglobin = {
            options: {
              bezierCurve: false
            },
            labels: labels,
            data: [records],
            series: ['Hemoglobina'],
            colours: [colors]
          };
          break;
        case BiomedicType.BLOOD_PRESSURE:
          $scope.chartBloodPressure = {
            options: {
              bezierCurve: false
            },
            labels: labels,
            data: records,
            series: ['Tensão Arterial Máxima', 'Tensão Arterial Mínima'],
            colours: [colors]
          };
          break;
        case BiomedicType.CHOLESTEROL:
          $scope.chartCholesterol = {
            options: {
              bezierCurve: false
            },
            labels: labels,
            data: [records],
            series: ['Colesterol'],
            colours: [colors]
          };
          break;
        case BiomedicType.WEIGHT:
          var imc = [];
          for (var i = 0; i < records.length; i++) {//IMC calculation
            imc[i] = (records[i] / (1.71 * 1.71)).toFixed(2);
          }
          $scope.chartWeight = {
            options: {
              bezierCurve: false
            },
            labels: labels,
            data: [records, imc],
            series: ['Peso', 'IMC'],
            colours: [colors]
          };
          break;
      }
      if (!$scope.$$phase) {
        $scope.$apply();
      }
    };


    var init = function () {
      BiomedicService.getHemoglobinRecords(handler);
      BiomedicService.getBloodPressureRecords(handler);
      BiomedicService.getCholesterolRecords(handler);
      BiomedicService.getWeightRecords(handler);
    };

    init();
  })
  .controller('BiomedicRegistryCtrl', function ($scope, BiomedicService, Hemoglobin, MinBloodPressure, MaxBloodPressure, Cholesterol, Weight, BiomedicType, $ionicLoading, $state) {
    $scope.maxDate = new Date();
    $scope.maxDate.setDate($scope.maxDate.getDate() + 1);
    $scope.biomedic = {};
    $scope.biomedic.type = 'blood-pressure';
    $scope.setType = function (type) {
      $scope.biomedic = {
        biomedicDate: new Date(),
        type: type
      };
    };
    $scope.setType('hemoglobin');
    $scope.isActive = function (type) {
      return type === $scope.biomedic.type;
    };

    $scope.saveBiomedic = function (form) {
      console.log(form);
      if ($scope.biomedic.biomedicDate != null) {
        form.biomedicDate.$setValidity('required', true);
      }
      if (form.$invalid) {
        console.log(form);
        return;
      } else if ($scope.biomedic.biomedicDate == null) {
        form.biomedicDate.$setValidity('required', false);
        return;
      }
      var label = "";
      switch ($scope.biomedic.type) {
        case BiomedicType.HEMOGLOBIN:
          label = "Hemoglobina";
          break;
        case BiomedicType.MAX_BLOOD_PRESSURE:
          label = "Tensão Arterial Mínima";
          break;
        case BiomedicType.MIN_BLOOD_PRESSURE:
          label = "Tensão Arterial Máxima";
          break;
        case BiomedicType.CHOLESTEROL:
          label = "Colesterol";
          break;
        case BiomedicType.WEIGHT:
          label = "Peso";
          break;

      }
      $ionicLoading.show({template: "A gravar " + label + "..."});


      var handler = function () {
        $ionicLoading.hide();
        $state.go('app.biomedic');
      };
      switch ($scope.biomedic.type) {
        case BiomedicType.HEMOGLOBIN:
          BiomedicService.addHemoglobinRecord(new Hemoglobin($scope.biomedic.biomedicDate, $scope.biomedic.value), handler);
          break;
        case BiomedicType.MIN_BLOOD_PRESSURE:
          BiomedicService.addMinBloodPressureRecord(new MinBloodPressure($scope.biomedic.biomedicDate, $scope.biomedic.value), handler);
          break;
        case BiomedicType.MAX_BLOOD_PRESSURE:
          BiomedicService.addMaxBloodPressureRecord(new MaxBloodPressure($scope.biomedic.biomedicDate, $scope.biomedic.value), handler);
          break;
        case BiomedicType.CHOLESTEROL:
          BiomedicService.addCholesterolRecord(new Cholesterol($scope.biomedic.biomedicDate, $scope.biomedic.value), handler);
          break;
        case BiomedicType.WEIGHT:
          BiomedicService.addWeightRecord(new Weight($scope.biomedic.biomedicDate, $scope.biomedic.value), handler);
          break;
      }
    }
  })
  .controller('MessagesCtrl', function ($scope, MessageService) {
    $scope.notifications = [];
    $scope.$on('new_notification', function (e, value) {
      $scope.notifications.unshift(value);
      if (!$scope.$$phase) {
        $scope.$apply();
      }
    });
    $scope.getFormattedDate = function (timestamp) {
      var date = new Date(timestamp);
      var day = date.getDate();
      var month = date.getMonth() + 1;
      var hour = date.getHours();
      var minute = date.getMinutes();
      var second = date.getSeconds();
      month = month < 10 ? '0' + month : month;
      day = day < 10 ? '0' + day : day;
      hour = hour < 10 ? '0' + hour : hour;
      minute = minute < 10 ? '0' + minute : minute;
      second = second < 10 ? '0' + second : second;
      var year = date.getFullYear();
      return day + "-" + month + '-' + year + ' ' + hour + ':' + minute + ':' + second;
    };
    MessageService.getMessages(function (messages) {
      $scope.messages = messages;
      console.log($scope.messages);
      if (!$scope.$$phase) {
        $scope.$apply();
      }
    });
  });
