angular.module('app.controllers', [])
  /**
   *
   * APPLICATION CONTROLLER
   */
  .controller('AppCtrl', function ($scope, $state) {
  })
  .controller('MainCtrl', function ($scope, $timeout, $window, $state) {
    $scope.options = [
      {name: "Eventos", color: "positive", icon: "ion-android-walk", link: "#/app/events"},
      {name: "Amigos", color: "positive", icon: "ion-person-stalker", link: "#/app/search"},
      {name: "Atividade Física", color: "positive", icon: "ion-ios-pulse", link: "#/app/search"},
      {name: "Definições", color: "positive", icon: "ion-gear-a", link: "#/app/search"}
    ];

    $scope.redirect = function () {
      $state.go('app.search');
    };
  })
  .controller('BiometricosCtrl', function ($scope) {
    $scope.biometricos = [
      {title: 'Reggae', id: 1},
      {title: 'Chill', id: 2},
      {title: 'Dubstep', id: 3},
      {title: 'Indie', id: 4},
      {title: 'Rap', id: 5},
      {title: 'Cowbell', id: 6}
    ];
  })
  .controller('LoginCtrl', function ($scope, $state, $stateParams, FirebaseFactory, $ionicPopup, $ionicLoading) {
    $scope.loginData = {username: "email", password: "pass  "};
    $scope.doLogin = function (form) {
      delete $scope.errorMessage;
      //console.log(form.$valid);
      if (form.$valid) {
        $ionicLoading.show({template: 'A autenticar...'});
        $state.go('app.main');
        $scope.loginData = {};
        form.$setPristine(false);
        $ionicLoading.hide();
      }
      return false;
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

  });
;
