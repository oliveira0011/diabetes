angular.module('app.controllers', [])
  /**
   *
   * APPLICATION CONTROLLER
   */
  .controller('AppCtrl', function ($scope, $state, FirebaseService, NotificationService) {
    $scope.logout = function () {
      FirebaseService.getDBConnection().unauth();
      FirebaseService.logoutCurrentUser();
      $state.go('login');
    };
    $scope.$on('logoutUser', function () {
      $scope.logout();
    });
    $scope.newNotificationsNumber = 0;
    $scope.$on('new_notification', function (e, value) {
      $scope.newNotificationsNumber++;
    });
    NotificationService.registerNewNotificationsListener();
    //NotificationService.getNotifications(function (notifications) {
    //  $scope.newNotificationsNumber = notifications.length;
    //  NotificationService.registerNewNotificationsListener();
    //});
  })
  .controller('MainCtrl', function ($scope, $timeout, $window, $state, $cordovaDeviceMotion, $ionicPlatform, FirebaseService, $http) {
    $scope.$on('deviceUpdated', function (e, deviceId) {
      console.log(deviceId);
      $scope.deviceToken = deviceId;
    });
    FirebaseService.getDBConnection().child("users").child("e97c6bd0-47ac-47db-95df-b3134be52859").child("deviceToken").on('value', function (snap) {
      $scope.remoteDeviceToken = snap.val();
      var d = JSON.stringify({
        "tokens": [
          $scope.remoteDeviceToken
        ],
        "notification": {
          "alert": "Hello World!",
          "ios": {
            "badge": 1,
            "sound": "ping.aiff",
            "priority": 10,
            "contentAvailable": 1,
            "payload": {
              "key1": "value",
              "key2": "value"
            }
          },
          "android": {
            "collapseKey": "foo",
            "delayWhileIdle": true,
            "timeToLive": 300,
            "payload": {
              "key1": "value",
              "key2": "value"
            }
          }
        }
      });
      //console.log(d);
      $http({
        method: 'POST',
        url: "https://push.ionic.io/api/v1/push/",
        data: d,
        headers: {
          "Authorization": window.btoa("4cdd6aef6996fb0bc29141f33bcb0536edcea7b3661d4a43"),
          "Content-Type": "application/json",
          "X-Ionic-Application-Id": 'd98077ec'
        }
      }).error(function (e) {
        console.log(e);
      }).success(function (data, status) {
        console.log(data);
        console.log(status);
      });
    });

    //$http({
    //  method: 'GET',
    //  url: "https://push.ionic.io/api/v1/status/eb68efe6cd2011e5a494be7f749067fa",
    //  headers: {
    //    "Authorization": window.btoa("4cdd6aef6996fb0bc29141f33bcb0536edcea7b3661d4a43"),
    //    "Content-Type": "application/json",
    //    "X-Ionic-Application-Id": 'd98077ec'
    //  }
    //}).error(function (e) {
    //  console.log(e);
    //}).success(function (data, status) {
    //  console.log(data);
    //  console.log(status);
    //  $scope.hello = data;
    //});

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

    $scope.deviceToken = FirebaseService.getDeviceToken();


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
      if ($scope.watch !== undefined) {
        $scope.watch.clearWatch();
      }
    };
    $ionicPlatform.ready(function () {
      $scope.startWatching();
    });


    $scope.$on('$ionicView.beforeLeave', function () {
      if ($scope.watch !== undefined) {
        $scope.watch.clearWatch(); // Turn off motion detection watcher
      }
    });
  })
  .controller('LoginCtrl', function ($scope, $state, $stateParams, FirebaseService, $ionicPopup, $ionicLoading) {
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

    ionic.Platform.ready(initialize);


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
  .controller('ProfileCtrl', function ($scope, UserFormFactory, FirebaseService, $stateParams, $rootScope, $ionicLoading, $ionicPopup, $state) {
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
            labels: labels,
            data: [records],
            series: ['Hemoglobina'],
            colours: [colors]
          };
          break;
        case BiomedicType.BLOOD_PRESSURE:
          $scope.chartBloodPressure = {
            labels: labels,
            data: records,
            series: ['Tensão Arterial Máxima', 'Tensão Arterial Mínima'],
            colours: [colors]
          };
          break;
        case BiomedicType.CHOLESTEROL:
          $scope.chartCholesterol = {
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
  .controller('NotificationsCtrl', function ($scope, NotificationService) {
    $scope.notifications = [];
    $scope.$on('new_notification', function (e, value) {
      $scope.notifications.unshift(value);
      if (!$scope.$$phase) {
        $scope.$apply();
      }
    });
    //NotificationService.getNotifications(function (notifications) {
    //  $scope.notifications = notifications;
    //  console.log($scope.notifications);
    //  if (!$scope.$$phase) {
    //    $scope.$apply();
    //  }
    //});
  });
