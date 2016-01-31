angular.module('app.controllers', [])
  /**
   *
   * APPLICATION CONTROLLER
   */
  .controller('AppCtrl', function ($scope, $state, FirebaseFactory) {
    $scope.logout = function () {
      FirebaseFactory.getDBConnetion().unauth();
      $state.go('login');
    }
  })
  .controller('MainCtrl', function ($scope, $timeout, $window, $state, $cordovaDeviceMotion, $ionicPlatform) {
    $scope.options = [
      {name: "Eventos", color: "positive", icon: "ion-android-walk", link: "#/app/events"},
      {name: "Amigos", color: "positive", icon: "ion-person-stalker", link: "#/app/search"},
      {name: "Atividade Física", color: "positive", icon: "ion-ios-pulse", link: "#/app/search"},
      {name: "Definições", color: "positive", icon: "ion-gear-a", link: "#/app/search"}
    ];

    $scope.redirect = function () {
      $state.go('app.search');
    };

    $scope.options = {
      frequency: 500, // Measure every 100ms
      deviation: 25  // We'll use deviation to determine the shake event, best values in the range between 25 and 30
    };

    $scope.threshold = 10;
    $scope.numSteps = 0;
    $scope.currentY = 0;
    $scope.previousY = 0;
    $scope.startWatching = function () {
      if ($cordovaDeviceMotion !== undefined) {
        return;
      }
      // Device motion configuration
      $scope.watch = $cordovaDeviceMotion.watchAcceleration($scope.options);

      // Device motion initilaization
      $scope.watch.then(null, function (error) {
        console.log('Error');
      }, function (result) {

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


      });
    };
    $scope.stopWatching = function () {
      if($scope.watch !== undefined){
        $scope.watch.clearWatch();
      }
    };
    $ionicPlatform.ready(function () {
      $scope.startWatching();
    });


    $scope.$on('$ionicView.beforeLeave', function () {
      if($scope.watch !== undefined){
        $scope.watch.clearWatch(); // Turn off motion detection watcher
      }
    });
  })
  .controller('LoginCtrl', function ($scope, $state, $stateParams, FirebaseFactory, $ionicPopup, $ionicLoading) {
    $scope.loginData = {};
    $scope.doLogin = function (form) {
      delete $scope.errorMessage;
      //console.log(form.$valid);
      if (form.$valid) {
        $ionicLoading.show({template: 'A autenticar...'});
        console.log($scope.loginData);
        var dbConnection = FirebaseFactory.getDBConnetion();

        function authHandler(error, authData) {
          if (error) {
            console.log("Login Failed!", error);
          } else {
            console.log("Authenticated successfully with payload:", authData);
            FirebaseFactory.setCurrentUserUid(authData.uid);
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
        FirebaseFactory.getDBConnetion().resetPassword({
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
    $scope.events = EventsService.events;
  })
  .controller('EventCtrl', function (Friend, Event, EventsService, $scope, $ionicLoading, $compile, $stateParams, $ionicModal, FriendsService) {
    if ($stateParams.id) {
      $scope.event = EventsService.events[$stateParams.id];
      $scope.newEvent = false;
    } else {
      $scope.event = new Event();
      $scope.newEvent = true;
    }

    //<editor-fold desc="Modal Friends">
    $scope.friends = FriendsService.friends;
    $scope.selectedFriends = {};

    angular.copy($scope.event.friends, $scope.selectedFriends);
    angular.forEach($scope.selectedFriends, function (friend) {
      friend.selected = true;
    });
    $scope.selectAll = $scope.selectedFriends.length == $scope.friends.length;

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
      angular.copy($scope.selectedFriends, $scope.event.friends);
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
    //</editor-fold>


    function initialize() {
      var myLatlng = new google.maps.LatLng(43.07493, -89.381388);

      var mapOptions = {
        center: myLatlng,
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      var map = new google.maps.Map(document.getElementById("map"),
        mapOptions);

      //Marker + infowindow + angularjs compiled ng-click
      var contentString = "<div><a ng-click='clickTest()'>Click me!</a></div>";
      var compiled = $compile(contentString)($scope);

      var infowindow = new google.maps.InfoWindow({
        content: compiled[0]
      });

      var marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        title: 'Uluru (Ayers Rock)'
      });

      google.maps.event.addListener(marker, 'click', function () {
        infowindow.open(map, marker);
      });

      $scope.map = map;
    }

    google.maps.event.addDomListener(window, 'load', initialize);

    $scope.centerOnMe = function () {
      if (!$scope.map) {
        return;
      }

      $scope.loading = $ionicLoading.show({
        content: 'Getting current location...',
        showBackdrop: false
      });

      navigator.geolocation.getCurrentPosition(function (pos) {
        $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
        $scope.loading.hide();
      }, function (error) {
        alert('Unable to get location: ' + error.message);
      });
    };

    $scope.clickTest = function () {
      alert('Example of infowindow with ng-click')
    };

  })
  .controller('EventFindCtrl', function ($scope, $ionicLoading, $compile, $stateParams, EventsService) {

    $scope.event = EventsService.events[$stateParams.id];
    $scope.participate = true;

    function initialize() {
      var myLatlng = new google.maps.LatLng(43.07493, -89.381388);

      var mapOptions = {
        center: myLatlng,
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      var map = new google.maps.Map(document.getElementById("map"),
        mapOptions);

      //Marker + infowindow + angularjs compiled ng-click
      var contentString = "<div><a ng-click='clickTest()'>Click me!</a></div>";
      var compiled = $compile(contentString)($scope);

      var infowindow = new google.maps.InfoWindow({
        content: compiled[0]
      });

      var marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        title: 'Uluru (Ayers Rock)'
      });

      google.maps.event.addListener(marker, 'click', function () {
        infowindow.open(map, marker);
      });

      $scope.map = map;
    }

    google.maps.event.addDomListener(window, 'load', initialize);

    $scope.centerOnMe = function () {
      if (!$scope.map) {
        return;
      }

      $scope.loading = $ionicLoading.show({
        content: 'Getting current location...',
        showBackdrop: false
      });

      navigator.geolocation.getCurrentPosition(function (pos) {
        $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
        $scope.loading.hide();
      }, function (error) {
        alert('Unable to get location: ' + error.message);
      });
    };

    $scope.clickTest = function () {
      alert('Example of infowindow with ng-click')
    };

  })
  .controller('ProfileCtrl', function ($scope, UserFormFactory, FirebaseFactory, $stateParams, $rootScope, $ionicLoading, $ionicPopup, $state) {
    //$scope.user = {firstName:1,lastName:1,address:1,oldPassword:1};
    $scope.user = {};
    var dbConnection = FirebaseFactory.getDBConnetion();
    //If you want to use URL attributes before the website is loaded
    $scope.init = function () {
      //$scope.user = UserFormFactory.getUserStructure(false);
      angular.forEach($scope.retrievedUser, function (retrievedUserValue, retrievedUserKey) {
        $scope.user[retrievedUserKey] = retrievedUserValue;
      });
      console.log($scope.user);

      if ($scope.retrievedUser && $scope.retrievedUser.id && $scope.retrievedUser.id !== '') {
        dbConnection.child("profileImages").child($scope.retrievedUser.id).once('value', function (data) {
          if (data.val() != null) {
            $scope.user.profileImage = data.val().image;
            //console.log($scope.user.profileImage.value);
            console.log($scope.user);
            if (!$scope.$$phase) {
              $scope.$apply();
            }
          }
        });
      }
    };
    if (FirebaseFactory.currentUserUid !== undefined) {
      dbConnection.child('users').child(FirebaseFactory.currentUserUid).once('value', function (user) {
        $scope.retrievedUser = user.val();
        $scope.retrievedUser.id = FirebaseFactory.currentUserUid;
        $scope.init();
        console.log(1);
      });
    } else {
      $state.go('login');
    }
  })
  .controller('HemoGlobinCtrl', function ($scope) {
  })
  .controller('HemoGlobinRegistryCtrl', function ($scope) {
  });
