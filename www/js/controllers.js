angular.module('app.controllers', [])
/**
 *
 * APPLICATION CONTROLLER
 */
  .controller('AppCtrl', function ($scope, $rootScope, $state, FirebaseService, MessageService) {
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
      if (!value.seen) {
        $scope.newNotificationsNumber++;
      }

    });
    MessageService.registerNewNotificationsListener();
    MessageService.getMessages(function (messages) {
      $scope.newNotificationsNumber = 0;
      for (var i = 0; i < messages.length; i++) {
        var obj = messages[i];
        if (!obj.seen) {
          $scope.newNotificationsNumber++;
        }
      }
      MessageService.registerNewNotificationsListener();
    });

    $rootScope.$on('$cordovaNetwork:offline', function (event, networkState) {
      $rootScope.$broadcast('offline');
    });
    $rootScope.$on('$cordovaNetwork:online', function (event, networkState) {
      $rootScope.$broadcast('online');
      var dataToStore = window.localStorage.getItem("dataToStore");
      dataToStore = JSON.parse(dataToStore);
      if (!dataToStore) {
        return
      }
      for (var userId in dataToStore) {
        if (dataToStore.hasOwnProperty(userId)) {
          for (var datee in dataToStore[userId]) {
            if (dataToStore[userId].hasOwnProperty(datee)) {
              var date = dataToStore[userId][datee];
              if (date["run"]) {
                (function () {
                  var runRef = FirebaseService.getDBConnection().child('physical_activity')
                    .child(userId)
                    .child(datee)
                    .child("run");
                  var x = date["run"];
                  runRef.transaction(function (current_value) {
                    return (current_value || 0) + x;
                  });
                })();


              }
              if (date["runSpeed"]) {
                (function () {
                  var runSpeedRef = FirebaseService.getDBConnection().child('physical_activity')
                    .child(userId)
                    .child(datee)
                    .child("runSpeed");

                  var x = date["runSpeed"];
                  runSpeedRef.transaction(function (current_value) {
                    return (!current_value ? x : ((current_value + x) / 2));
                  });
                })();
              }
              if (date["walk"]) {
                (function () {
                  var runRef = FirebaseService.getDBConnection().child('physical_activity')
                    .child(userId)
                    .child(datee)
                    .child("walk");
                  var x = date["walk"];
                  runRef.transaction(function (current_value) {
                    return (current_value || 0) + x;
                  });
                })();
              }
              if (date["walkSpeed"]) {
                (function () {
                  var runSpeedRef = FirebaseService.getDBConnection().child('physical_activity')
                    .child(userId)
                    .child(datee)
                    .child("walkSpeed");
                  var x = date["walkSpeed"];
                  runSpeedRef.transaction(function (current_value) {
                    return (!current_value ? x : ((current_value + x) / 2));
                  });
                })();
              }
              if (date["idle"]) {
                (function () {
                  var runRef = FirebaseService.getDBConnection().child('physical_activity')
                    .child(userId)
                    .child(datee)
                    .child("idle");
                  var x = date["idle"];
                  runRef.transaction(function (current_value) {
                    return (current_value || 0) + x;
                  });
                })();
              }
              if (date["idleSpeed"]) {
                (function () {
                  var runSpeedRef = FirebaseService.getDBConnection().child('physical_activity')
                    .child(userId)
                    .child(datee)
                    .child("idleSpeed");
                  var x = date["idleSpeed"];
                  runSpeedRef.transaction(function (current_value) {
                    return (!current_value ? x : ((current_value + x) / 2));
                  });
                })();
              }
            }
          }
        }
      }
      dataToStore = undefined;
      window.localStorage.removeItem("dataToStore");
    });

  })
  .controller('MainCtrl', function ($scope, $timeout, $window, $state, $cordovaDeviceMotion, $cordovaNetwork, $ionicPlatform, FirebaseService, $http, TimerService) {

    $scope.getFormattedDate = function (timestamp) {
      var date = new Date(timestamp);
      var day = date.getDate();
      var month = date.getMonth() + 1;
      month = month < 10 ? '0' + month : month;
      day = day < 10 ? '0' + day : day;
      var year = date.getFullYear();
      return day + "-" + month + '-' + year;
    };


    $scope.stopWatching = function () {
      if ($scope.watch) {
        $scope.watch.clearWatch();
        $scope.active = false;
      }
    };


    $scope.$on('deviceUpdated', function (e, deviceId) {
      console.log(deviceId);
      $scope.deviceToken = deviceId;
    });
    FirebaseService.getDBConnection().child("users").child(FirebaseService.getCurrentUserUid()).child("deviceToken").on('value', function (snap) {
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

    $scope.data = {
      refreshRate: 200
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
      if ($scope.categories && $scope.categories[0]) {
        $scope.categories[0].category = [];
      }
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
    $scope.getFormattedTimerDate = function () {
      var millis = $scope.timeElapsed;
      var minutes = Math.floor(millis / 60000);
      var seconds = ((millis % 60000) / 1000).toFixed(0);
      return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    };

    $scope.cancelListeners = function () {
      FirebaseService.getDBConnection().child('physical_activity').child(FirebaseService.getCurrentUserUid()).child($scope.getFormattedDate(new Date().getTime()))
        .orderByChild('timestamp').startAt($scope.startTimestamp).off('value', function () {
        console.log("off");
      });
      $scope.categories[0].category = [];
    };
    $scope.registerListeners = function () {
      $scope.stopWatching = function () {
        if ($scope.watch) {
          $scope.watch.clearWatch();
          $scope.active = false;
        }
      };
    };


    $scope.startWatching = function () {
      console.log(typeof $cordovaDeviceMotion.watchAcceleration);
      if (!$cordovaDeviceMotion || (typeof $cordovaDeviceMotion.watchAcceleration) == undefined) {
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

        //$scope.speed = aux;
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
        if (($scope.timestamp - $scope.currentIterationTimestamp) / 1000 > 10) {
          if ($scope.currentIterationSpeed > 6) {//TODO: check, for now we reduced to -2

            if (/*$cordovaNetwork.isOffline()*/1==1) {
              var dataToStore = JSON.parse(window.localStorage.getItem('dataToStore'));
              var date = $scope.getFormattedDate(new Date().getTime());
              if (!dataToStore || dataToStore.length > 0) {
                dataToStore = {};
              }
              if (!dataToStore[FirebaseService.getCurrentUserUid()]) {
                dataToStore[FirebaseService.getCurrentUserUid()] = {};
              }
              if (!dataToStore[FirebaseService.getCurrentUserUid()][date]) {
                dataToStore[FirebaseService.getCurrentUserUid()][date] = {};
              }
              if (!dataToStore[FirebaseService.getCurrentUserUid()][date]["run"]) {
                dataToStore[FirebaseService.getCurrentUserUid()][date]["run"] = 0;
              }
              if (!dataToStore[FirebaseService.getCurrentUserUid()][date]["run"]) {
                dataToStore[FirebaseService.getCurrentUserUid()][date]["runSpeed"] = 0;
              }
              dataToStore[FirebaseService.getCurrentUserUid()][date]["run"] = dataToStore[FirebaseService.getCurrentUserUid()][date]["run"] + 10;
              dataToStore[FirebaseService.getCurrentUserUid()][date]["runSpeed"] = !dataToStore[FirebaseService.getCurrentUserUid()][date]["runSpeed"] ? $scope.currentIterationSpeed : ((dataToStore[FirebaseService.getCurrentUserUid()][date]["runSpeed"] + $scope.currentIterationSpeed) / 2);

              window.localStorage.setItem("dataToStore", JSON.stringify(dataToStore));

            } else {
              var runRef = FirebaseService.getDBConnection().child('physical_activity')
                .child(FirebaseService.getCurrentUserUid())
                .child($scope.getFormattedDate(date))
                .child("run");
              runRef.transaction(function (current_value) {
                return (current_value || 0) + 10;
              });

              var runSpeedRef = FirebaseService.getDBConnection().child('physical_activity')
                .child(FirebaseService.getCurrentUserUid())
                .child($scope.getFormattedDate(new Date().getTime()))
                .child("runSpeed");
              runSpeedRef.transaction(function (current_value) {
                return (!current_value ? $scope.currentIterationSpeed : ((current_value + $scope.currentIterationSpeed) / 2));
              });
            }


          } else if ($scope.currentIterationSpeed > 0.2) {//TODO: check, for now we reduced to -2

            if (/*$cordovaNetwork.isOffline()*/1==1) {
              dataToStore = JSON.parse(window.localStorage.getItem('dataToStore'));
              date = $scope.getFormattedDate(new Date().getTime());
              if (!dataToStore || dataToStore.length > 0) {
                dataToStore = {};
              }
              if (!dataToStore[FirebaseService.getCurrentUserUid()]) {
                dataToStore[FirebaseService.getCurrentUserUid()] = {};
              }
              if (!dataToStore[FirebaseService.getCurrentUserUid()][date]) {
                dataToStore[FirebaseService.getCurrentUserUid()][date] = {};
              }
              if (!dataToStore[FirebaseService.getCurrentUserUid()][date]["walk"]) {
                dataToStore[FirebaseService.getCurrentUserUid()][date]["walk"] = 0;
              }
              if (!dataToStore[FirebaseService.getCurrentUserUid()][date]["walkSpeed"]) {
                dataToStore[FirebaseService.getCurrentUserUid()][date]["walkSpeed"] = 0;
              }
              dataToStore[FirebaseService.getCurrentUserUid()][date]["walk"] = dataToStore[FirebaseService.getCurrentUserUid()][date]["walk"] + 10;
              dataToStore[FirebaseService.getCurrentUserUid()][date]["walkSpeed"] = !dataToStore[FirebaseService.getCurrentUserUid()][date]["walkSpeed"] ? $scope.currentIterationSpeed : ((dataToStore[FirebaseService.getCurrentUserUid()][date]["walkSpeed"] + $scope.currentIterationSpeed) / 2);

              window.localStorage.setItem("dataToStore", JSON.stringify(dataToStore));

            } else {
              var walkRef = FirebaseService.getDBConnection().child('physical_activity')
                .child(FirebaseService.getCurrentUserUid())
                .child($scope.getFormattedDate(new Date().getTime()))
                .child("walk");

              walkRef.transaction(function (current_value) {
                return (current_value || 0) + 10;
              });


              var walkSpeedRef = FirebaseService.getDBConnection().child('physical_activity')
                .child(FirebaseService.getCurrentUserUid())
                .child($scope.getFormattedDate(new Date().getTime()))
                .child("walkSpeed");
              walkSpeedRef.transaction(function (current_value) {
                return (!current_value ? $scope.currentIterationSpeed : ((current_value + $scope.currentIterationSpeed) / 2));
              });

            }
          } else {

            if (/*$cordovaNetwork.isOffline()*/1!=1) {
              dataToStore = JSON.parse(window.localStorage.getItem('dataToStore'));
              date = $scope.getFormattedDate(new Date().getTime());
              if (!dataToStore || dataToStore.length > 0) {
                dataToStore = {};
              }
              if (!dataToStore[FirebaseService.getCurrentUserUid()]) {
                dataToStore[FirebaseService.getCurrentUserUid()] = {};
              }
              if (!dataToStore[FirebaseService.getCurrentUserUid()][date]) {
                dataToStore[FirebaseService.getCurrentUserUid()][date] = {};
              }
              if (!dataToStore[FirebaseService.getCurrentUserUid()][date]["idle"]) {
                dataToStore[FirebaseService.getCurrentUserUid()][date]["idle"] = 0;
              }
              if (!dataToStore[FirebaseService.getCurrentUserUid()][date]["idleSpeed"]) {
                dataToStore[FirebaseService.getCurrentUserUid()][date]["idleSpeed"] = 0;
              }
              dataToStore[FirebaseService.getCurrentUserUid()][date]["idle"] = dataToStore[FirebaseService.getCurrentUserUid()][date]["idle"] + 10;
              dataToStore[FirebaseService.getCurrentUserUid()][date]["idleSpeed"] = !dataToStore[FirebaseService.getCurrentUserUid()][date]["idleSpeed"] ? $scope.currentIterationSpeed : ((dataToStore[FirebaseService.getCurrentUserUid()][date]["idleSpeed"] + $scope.currentIterationSpeed) / 2);

              window.localStorage.setItem("dataToStore", JSON.stringify(dataToStore));
            } else {
              var idleRef = FirebaseService.getDBConnection().child('physical_activity')
                .child(FirebaseService.getCurrentUserUid())
                .child($scope.getFormattedDate(new Date().getTime()))
                .child("idle");

              idleRef.transaction(function (current_value) {
                return (current_value || 0) + 10;
              });


              var idleSpeedRef = FirebaseService.getDBConnection().child('physical_activity')
                .child(FirebaseService.getCurrentUserUid())
                .child($scope.getFormattedDate(new Date().getTime()))
                .child("idleSpeed");
              idleSpeedRef.transaction(function (current_value) {
                return (!current_value ? $scope.currentIterationSpeed : ((current_value + $scope.currentIterationSpeed) / 2));
              });
            }

          }
          $scope.currentIterationTimestamp = $scope.timestamp;
          $scope.currentIterationSpeed = 0;
        }
      });
      $scope.registerListeners();
    };
    $ionicPlatform.ready(function () {
      //$scope.startWatching();
    });

    $scope.$on('$ionicView.beforeLeave', function () {
      if ($scope.watch !== undefined) {
        $cordovaDeviceMotion.clearWatch($scope.watch); // Turn off motion detection watcher
      }
    });
  })
  .controller('PhysicalActivityCtrl', function ($scope, $timeout, $window, $state, $cordovaDeviceMotion, $cordovaNetwork, $ionicPlatform, FirebaseService, $http, TimerService) {

    var init = function () {
      $scope.getFormattedDate = function (timestamp) {
        var date = new Date(timestamp);
        var day = date.getDate();
        var month = date.getMonth() + 1;
        month = month < 10 ? '0' + month : month;
        day = day < 10 ? '0' + day : day;
        var year = date.getFullYear();
        return day + "-" + month + '-' + year;
      };

      $scope.attrs = {
        caption: "Minutos / Categoria de Exercício",
        yaxisname: "Segundos",
        xaxisname: "Categoria de exercício",
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
      }, {
        category: []
      }, {
        category: []
      }, {
        category: []
      }, {
        category: []
      }, {
        category: []
      }, {
        category: []
      }];

      $scope.dataset = [{
        "seriesName": "Andar",
        "data": [{}, {}, {}, {}, {}, {}, {}]
      }, {
        "seriesName": "Correr",
        "data": [{}, {}, {}, {}, {}, {}, {}]
      }];


      var roundedMinutesWalk = 0;
      var roundedSecondsWalk = 0;

      var roundedMinutesRun = 0;
      var roundedSecondsRun = 0;
      $scope.trendlines = [
        {
          "line": [
            {
              "startvalue": "600",
              "color": "#0075c2",
              "displayvalue": "Caminhada",
              "valueOnRight": "1",
              "thickness": "1",
              "showBelow": "1",
              "tooltext": "Andar: " + roundedMinutesWalk + ":" + roundedSecondsWalk + "m"
            },
            {
              "startvalue": "200",
              "color": "#1aaf5d",
              "displayvalue": "Corrida",
              "valueOnRight": "1",
              "thickness": "1",
              "showBelow": "1",
              "tooltext": "Corrida: " + roundedMinutesRun + ":" + roundedSecondsRun + "m"
            }
          ]
        }
      ];

      var fillSerie = function (serieNumber) {
        serieNumber = 6 - serieNumber;
        var formattedDate = $scope.getFormattedDate(new Date().getTime() - (86400000 * serieNumber));
        $scope.categories[0].category[serieNumber] = {label: formattedDate};
        if (serieNumber == 0) {
          FirebaseService.getDBConnection().child('physical_activity').child(FirebaseService.getCurrentUserUid()).child(formattedDate)
            .on('value', function (snap) {
              $scope.dataset[0].data[serieNumber] = {};
              $scope.dataset[1].data[serieNumber] = {};
              var items = snap.val();
              console.log(formattedDate, items);
              if (items == null) {
                items = {
                  walk: 0,
                  run: 0
                }
              }
              //$scope.dataset[0].data[serieNumber] = ({label: 'Idle', value: items.idle});
              $scope.dataset[0].data[serieNumber] = ({label: 'Andar', value: items.walk});
              $scope.dataset[1].data[serieNumber] = ({label: 'Correr', value: items.run});
            });
        } else {
          FirebaseService.getDBConnection().child('physical_activity').child(FirebaseService.getCurrentUserUid()).child(formattedDate)
            .once('value', function (snap) {
              $scope.dataset[0].data[serieNumber] = {};
              $scope.dataset[1].data[serieNumber] = {};
              var items = snap.val();
              console.log(formattedDate, items);
              if (items == null) {
                items = {
                  idle: 0,
                  walk: 0,
                  run: 0
                }
              }
              if (items == null) {
                items = {
                  idle: 0,
                  walk: 0,
                  run: 0
                }
              }
              console.log(serieNumber);
              //$scope.dataset[0].data[serieNumber] = ({label: 'Idle', value: items.idle});
              $scope.dataset[0].data[serieNumber] = ({label: 'Andar', value: items.walk});
              $scope.dataset[1].data[serieNumber] = ({label: 'Correr', value: items.run});
            });
        }
      };

      for (var i = 0; i < 7; i++) {
        fillSerie(i);
      }
    };

    $ionicPlatform.ready(function () {
      $scope.offline = /*$cordovaNetwork.isOffline()*/1!=1;
      $scope.$on('offline', function () {
        $scope.offline = true;
      });
      $scope.$on('online', function () {
        $scope.offline = false;
        init();
      });
      if (!$scope.offline) {
        init();
      }
    });
  })
  .controller('LoginCtrl', function ($rootScope, $cordovaNetwork, $ionicPlatform, $scope, $state, $stateParams, FirebaseService, UsersService, $ionicPopup, $ionicLoading) {
     $scope.offline = true;
    $ionicPlatform.ready(function () {
      $scope.offline = /*$cordovaNetwork.isOffline()*/1!=1;
    });
    $rootScope.$on('$cordovaNetwork:offline', function (event, networkState) {
      $scope.offline = true;
    });
    $rootScope.$on('$cordovaNetwork:online', function (event, networkState) {
      $scope.offline = false;
    });

    if (FirebaseService.isUserLogged()) {
      FirebaseService.checkDeviceToken();
      $state.go('app.main');
    }
    $scope.errorMessages = [];
    $scope.loginData = {
      //username: 'm1@hotmail.com',
      username: '',
      //password: 'xptoxpto'
      password: ''
    };
    $scope.doLogin = function (form) {
      $scope.errorMessages = [];
      if (form.$valid) {
        $ionicLoading.show({template: 'A autenticar...'});
        var dbConnection = FirebaseService.getDBConnection();

        function authHandler(error, authData) {
          if (error) {
            console.log("Login Failed!", error);
            $scope.errorMessages.push("Não foi possível autenticar, por favor verifique os dados introduzidos.");
          } else {
            console.log("Authenticated successfully with payload:", authData);
            UsersService.getUser(authData.uid, function(user){
              if(user == null || !user || user.doctor_uid === null || !user.doctor_uid){
                $ionicLoading.hide();
                $scope.errorMessages.push("Não foi possível autenticar, por favor verifique os dados introduzidos.");
                //alert("Não foi possível autenticar, por favor verifique os dados introduzidos.");
                return;
              }
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
                      $scope.errorMessages.push("Não foi possível alterar a password.");
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
            });
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
        if(!res){
          return;
        }
        $ionicLoading.show({
          template: "A enviar email de reposição de palavra-passe..."
        });
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
  .controller('EventsCtrl', function ($ionicPlatform, FirebaseService, $cordovaNetwork, EventsService, $scope, $ionicTabsDelegate) {

    function clone(obj) {
      if (null == obj || "object" != typeof obj) return obj;
      var copy = obj.constructor();
      for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
      }
      return copy;
    }

    $scope.filterEvents = function (filter) {
      $scope.filter = filter;
      $scope.filteredEvents = [];


      if (!$scope.events) {
        return;
      }

      console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      for (var j = 0; j < $scope.events.length; j++) {
        console.log($scope.events[j].id);
      }
      for (var i = 0; i < $scope.events.length; i++) {
        var obj = clone($scope.events[i]);
        var add = false;
        switch (filter) {
          case 'new':
            if (!obj.outdated) {
              add = true;
            }
            $ionicTabsDelegate.select(0);
            break;
          case 'unseen':
            if (!obj.seen) {
              add = true;
            }
            $ionicTabsDelegate.select(1);
            break;
          case 'participated':
            if (obj.outdated && obj.participate) {
              add = true;
            }
            $ionicTabsDelegate.select(2);
            break;
          case 'all':
            add = true;
            $ionicTabsDelegate.select(3);
            break;
        }
        if (add) {
          $scope.filteredEvents.push(obj);
        }
      }

    };
    var init = function () {
      $scope.events = [];

      $scope.filter = 'new';
      $scope.filteredEvents = [];
      EventsService.getAllEvents(function (evt1) {
        if (!$scope.filter) {
          return;
        }
        var evt = clone(evt1);
        if (evt.owner.id === FirebaseService.getCurrentUserUid()) {
          evt.seen = true;
          evt.participate = true;
        }
        evt.outdated = evt.date <= new Date().getTime();
        evt.friendsNumber = 0;
        for (var property in evt.friends) {
          if (evt.friends.hasOwnProperty(property)) {
            if (property === FirebaseService.getCurrentUserUid()) {
              evt.seen = evt.friends[property].seen;
            }
            if (evt.friends[property].participate) {
              evt.participate = true;
              evt.friendsNumber++;
            }
          }
        }
        $scope.events.push(evt);
        console.log("????????????????????????????????");
        for (var j = 0; j < $scope.events.length; j++) {
          console.log($scope.events[j].id);
        }
        $scope.filterEvents($scope.filter);
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

    };
    $ionicPlatform.ready(function () {
      $scope.offline = /*$cordovaNetwork.isOffline()*/1!=1;
      $scope.$on('offline', function () {
        $scope.offline = true;
      });
      $scope.$on('online', function () {
        $scope.offline = false;
        init();
      });
      if (!$scope.offline) {
        init();
      }
    });

  })
  .controller('EventCtrl', function ($ionicPlatform, Friend, Event, EventsService, $cordovaNetwork, $scope, $ionicLoading, $compile, $state, $stateParams, $ionicModal, FriendsService) {


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
      $scope.selectAll = !$scope.selectAll;
    };

    $scope.toggleFriend = function (friend) {
      if (friend.selected) {
        $scope.selectedFriends[friend.id] = friend;
        $scope.selectAll = false;
      } else {
        delete $scope.selectedFriends[friend.id];
        $scope.selectAll = true;
      }
    };
    $scope.closeModal = function () {
      //$scope.event.friends = [];
      //for (var selectedFriend in $scope.selectedFriends) {
      //  if ($scope.selectedFriends.hasOwnProperty(selectedFriend)) {
      //    $scope.event.friends.push($scope.selectedFriends[selectedFriend]);
      //  }
      //}
      $scope.modal.remove();
    };
    $scope.openModalFriends = function () {
      $ionicModal.fromTemplateUrl('/templates/friends-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modal = modal;
        $scope.modal.show();
      });
    };

    $scope.closeModalLocation = function () {
      $scope.modal.remove();
    };
    $scope.openModalLocation = function () {
      $ionicModal.fromTemplateUrl('/templates/event-location-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modal = modal;
        $scope.modal.show();
        if ($scope.event.geoLocation) {
          $scope.location = $scope.event.location;
          $scope.geoLocation = $scope.event.geoLocation;
          initialize($scope.event.geoLocation);
        } else {
          initialize();
        }
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
      return day + "-" + month + '-' + year + ' ' + hour + ':' + minute + ':' + second;
    };

    //</editor-fold>

    function initialize(geoLocation) {
      var myLatlng = new google.maps.LatLng(39.7375278, -8.813522, 17);

      var mapOptions = {
        center: myLatlng,
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.HYBRID
      };
      var map = new google.maps.Map(document.getElementById("map"), mapOptions);

      var marker = new google.maps.Marker({
        position: geoLocation ? geoLocation : myLatlng,
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
            if (results[0]) {
              $scope.location = results[0].formatted_address;
            } else {
              $scope.location = "Lat: " + event.latLng.lat() + "\nLng: " + event.latLng.lng();
            }
          } else {
            $scope.location = "Lat: " + event.latLng.lat() + "\nLng: " + event.latLng.lng();
          }
          $scope.$apply();
        });
      }

      google.maps.event.addListener(map, 'click', function (event) {
        placeMarker(event.latLng);
        $scope.geoLocation = event.latLng;
      });


      $scope.map = map;
    }

    $scope.marker = {};

    $scope.clearLocation = function () {
      delete $scope.location;
      delete $scope.geoLocation;
    };

    $scope.removeGeoLocation = function () {
      delete $scope.event.geoLocation;
    };

    $scope.saveLocation = function () {
      $scope.event.location = $scope.location;
      $scope.event.geoLocation = $scope.geoLocation;
      delete $scope.location;
      delete $scope.geoLocation;
      $scope.closeModalLocation();
    }

    var init = function () {
      $scope.friends = [];
      $scope.selectedFriends = [];
      $scope.selectAll = $scope.selectedFriends.length == 0 || $scope.selectedFriends.length == $scope.friends.length;
      FriendsService.getFriends(function (friends) {
        $scope.friends = friends;
        $scope.selectAll = $scope.selectedFriends.length == 0 || $scope.selectedFriends.length == $scope.friends.length;
        if ($scope.selectAll) {
          $scope.toggleAll();
        }
      });
    };
    $ionicPlatform.ready(function () {
      $scope.offline = /*$cordovaNetwork.isOffline()*/1!=1;
      $scope.$on('offline', function () {
        $scope.offline = true;
      });
      $scope.$on('online', function () {
        $scope.offline = false;
        init();
      });
      if (!$scope.offline) {
        init();
      }
    });
  })
  .controller('EventFindCtrl', function ($ionicPlatform, $cordovaNetwork, $scope, $ionicLoading, $compile, $state, $stateParams, EventsService, FirebaseService) {
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


    $scope.editParticipation = function () {
      if ($scope.participate == false) {
        $scope.participate = true;
      } else {
        $scope.participate = false;
      }
      //$scope.participate = participate;
      EventsService.editParticipation($stateParams.id, $scope.participate, function () {
      });
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

    var init = function () {
      $scope.participate = false;
      EventsService.getEvent($stateParams.id, function (event) {
        $scope.event = event;
        EventsService.markAsSeen($stateParams.id, function () {
        });
        $scope.canEditParticipation = (event.date > new Date().getTime()) && (event.owner !== FirebaseService.getCurrentUserUid());
        if (event.geoLocation) {
          initialize(event.geoLocation.lat, event.geoLocation.lng);
        }
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
    };

    $ionicPlatform.ready(function () {
      $scope.offline = /*$cordovaNetwork.isOffline()*/1!=1;
      $scope.$on('offline', function () {
        $scope.offline = true;
      });
      $scope.$on('online', function () {
        $scope.offline = false;
        init();
      });
      if (!$scope.offline) {
        init();
      }
    });
  })
  .controller('ProfileCtrl', function ($ionicPlatform, $scope, UserFormFactory, $cordovaNetwork, FirebaseService, $stateParams, $rootScope, $ionicLoading, $ionicPopup, $state) {


    var init = function () {

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
        });
      } else {
        $state.go('login');
      }
    };

    $ionicPlatform.ready(function () {
      $scope.offline = /*$cordovaNetwork.isOffline()*/1!=1;
      $scope.$on('offline', function () {
        $scope.offline = true;
      });
      $scope.$on('online', function () {
        $scope.offline = false;
        init();
      });
      if (!$scope.offline) {
        init();
      }
    });
  })
  .controller('BiomedicCtrl', function ($ionicPlatform, $scope, $cordovaNetwork, BiomedicService, BiomedicType) {


    // $scope.offline = false;

    var initChart = function (caption, subcaption, colors) {
      return {
        attrs: {
          caption: caption,
          subcaption: subcaption,
          bgcolor: "FFFFFF",
          animation: "0",
          showalternatehgridcolor: "0",
          divlinecolor: 'CCCCCC',
          showvalues: "0",
          showcanvasborder: "0",
          legendshadow: "0",
          showborder: "0",
          paletteColors: colors,
          dynamicaxis: "1",
          scrollheight: "10",
        },
        //labels: labels,
        dataset: [{
          "seriesname": "",
          "data": []
        }],
        categories: [{
          category: []
        }],
        colors: colors
      }
    };

    function getFormattedDate(timestamp) {
      var date = new Date(timestamp);
      var month = date.getMonth() + 1;
      month = month < 10 ? '0' + month : month;
      var year = date.getFullYear();
      return month + '-' + year;
    }

    var handler = function (type, retrievedRecords) {
      if (!retrievedRecords || retrievedRecords == null) {
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
      var labels = [{
        category: []
      }];
      switch (type) {
        case BiomedicType.ABDOMINAL_GIRTH:
          colors = $scope.chartAbdominalGirth.colors;
          records = [{
            "seriesname": "CardiacFrequencya",
            "data": $scope.abdominalGirthRecords
          }];
          break;
        case BiomedicType.CARDIACFREQUENCY:
          colors = $scope.chartCardiacFrequency.colors;
          records = [{
            "seriesname": "CardiacFrequencya",
            "data": $scope.cardiacfrequencyRecords
          }];
          break;
        case BiomedicType.BLOOD_PRESSURE:
          colors = $scope.chartBloodPressure.colors;
          records = [{
            "seriesname": "Tensão Arterial Máxima",
            "data": []
          }, {
            "seriesname": "Tensão Arterial Mínima",
            "data": []
          }];
          var minRecords = !retrievedRecords[0] || retrievedRecords[0] == null ? [] : Object.keys(retrievedRecords[0]).map(function (k) {
            return retrievedRecords[0][k]
          });
          var maxRecords = !retrievedRecords[1] || retrievedRecords[1] == null ? [] : Object.keys(retrievedRecords[1]).map(function (k) {
            return retrievedRecords[1][k]
          });

          var rec = minRecords.concat(maxRecords);
          rec.sort(function (a, b) {
            return parseFloat(a.biomedicDate) - parseFloat(b.biomedicDate);
          });

          var cMax = 0;
          var cMin = 0;
          for (var i = 0; i < rec.length; i++) {
            var record = rec[i];
            var isNew = true;
            var date = getFormattedDate(record.biomedicDate);
            var nextRecord;
            var nextDate;
            if (labels[0].category.indexOf(date) == -1) {
              if (record.type == BiomedicType.MIN_BLOOD_PRESSURE) {
                nextRecord = rec[cMin + 1];
              } else if (record.type == BiomedicType.MAX_BLOOD_PRESSURE) {
                nextRecord = rec[cMax + 1];
              }
              labels[0].category.push({label: date});
              if (nextRecord) {
                nextDate = getFormattedDate(nextRecord.biomedicDate);
                if (nextDate == date) {
                  isNew = false;
                  if (nextRecord.type == BiomedicType.MIN_BLOOD_PRESSURE) {
                    records[1].data.push({value: nextRecord.value});
                    i++;
                  } else if (nextRecord.type == BiomedicType.MAX_BLOOD_PRESSURE) {
                    records[0].data.push({value: nextRecord.value});
                    i++;
                  }
                  cMin++;
                  cMax++;
                } else {
                  nextRecord = undefined;
                  if (record.type == BiomedicType.MIN_BLOOD_PRESSURE) {
                    records[0].data.push({value: 0});
                    cMin++;
                  } else if (record.type == BiomedicType.MAX_BLOOD_PRESSURE) {
                    records[1].data.push({value: 0});
                    cMax++;
                  }
                }
              }
            }
            cMin++;
            cMax++;


            if (record.type == BiomedicType.MIN_BLOOD_PRESSURE) {
              records[1].data.push({value: record.value});
            } else if (record.type == BiomedicType.MAX_BLOOD_PRESSURE) {
              records[0].data.push({value: record.value});
            }
          }
          break;
        case BiomedicType.CHOLESTEROL:
          colors = $scope.chartCholesterol.colors;
          records = [{
            "seriesname": "Colesterol",
            "data": $scope.cholesterolRecords
          }];
          break;
        case BiomedicType.WEIGHT:
          colors = $scope.chartWeight.colors;
          records = [{
            "seriesname": "Peso",
            "data": $scope.weightRecords
          }];
          break;
      }
      if (records[0].data.length == 0) {
        arr.sort(function (a, b) {
          return (!a || a == null) && (!b || b == null) ? 0 : (a && (!b || b == null) ? parseFloat(a.biomedicDate) : ((!a || a == null) && b ? parseFloat(b.biomedicDate) : parseFloat(a.biomedicDate) - parseFloat(b.biomedicDate)));
        });
        angular.forEach(arr, function (record) {
          if (record && record != null) {
            records[0].data.push({value: record.value});
            labels[0].category.push({label: getFormattedDate(record.biomedicDate)});
          }
        });
      }
      switch (type) {
        case BiomedicType.ABDOMINAL_GIRTH:
          $scope.chartAbdominalGirth.dataset = records;
          $scope.chartAbdominalGirth.categories = labels;
          break;
        case BiomedicType.CARDIACFREQUENCY:
          $scope.chartCardiacFrequency.dataset = records;
          $scope.chartCardiacFrequency.categories = labels;
          break;
        case BiomedicType.BLOOD_PRESSURE:
          $scope.chartBloodPressure.dataset = records;
          $scope.chartBloodPressure.categories = labels;
          break;
        case BiomedicType.CHOLESTEROL:
          $scope.chartCholesterol.dataset = records;
          $scope.chartCholesterol.categories = labels;
          break;
        case BiomedicType.WEIGHT:
          var imc = [];
          for (var j = 0; j < records[0].data.length; j++) {//IMC calculation
            var obj = records[0].data[j].value;
            imc[j] = {value: (obj / (1.71 * 1.71)).toFixed(2)};
          }
          records.push({
            "seriesname": "IMC",
            "data": imc
          });
          $scope.chartWeight.dataset = records;
          $scope.chartWeight.categories = labels;
          break;
      }
      if (!$scope.$$phase) {
        $scope.$apply();
      }
    };


    var init = function () {
      $scope.chartCholesterol = initChart('Colesterol HDL', 'mg/dL', "#DECF3F");
      $scope.chartWeight = initChart('Peso / IMC', 'Kg / Kg/m2', "#B276B2, #F17CB0");
      $scope.chartCardiacFrequency = initChart('Frequência Cardíaca', 'bpm', "#F15854");
      $scope.chartBloodPressure = initChart('T. Arterial Sistólica / Diastólica', 'mmHg', "#4D4D4D, #5DA5DA");
      $scope.chartAbdominalGirth = initChart('Perímetro Abdominal', 'cm', "#DECF3F");


      $scope.cardiacfrequencyRecords = [];
      $scope.bloodPressureRecords = [];
      $scope.cholesterolRecords = [];
      $scope.weightRecords = [];
      $scope.abdominalGirthRecords = [];
      BiomedicService.getCardiacFrequencyRecords(handler);
      BiomedicService.getBloodPressureRecords(handler);
      BiomedicService.getCholesterolRecords(handler);
      BiomedicService.getWeightRecords(handler);
      BiomedicService.getAbdominalGirthRecords(handler);
    };


    $scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
      console.log('stateChanged to: ', toState, toState.name === 'app.biomedic');
      if (toState.name === 'app.biomedic') {
        init();
      }
    });


    $ionicPlatform.ready(function () {
      $scope.offline = /*$cordovaNetwork.isOffline()*/1!=1;
      $scope.$on('offline', function () {
        $scope.offline = true;
      });
      $scope.$on('online', function () {
        $scope.offline = false;
        init();
      });
      if (!$scope.offline) {
        init();
      }
    });
  })
  .controller('BiomedicRegistryCtrl', function ($ionicPlatform, $cordovaNetwork, $scope, BiomedicService, CardiacFrequency, MinBloodPressure, MaxBloodPressure, Cholesterol, Weight, BiomedicType, $ionicLoading, $state, AbdominalGirth, $rootScope) {
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
    $scope.setType('cardiacfrequency');
    $scope.isActive = function (type) {
      return type === $scope.biomedic.type;
    };

    $scope.saveBiomedic = function (form) {
      if ($scope.biomedic.biomedicDate != null) {
        form.biomedicDate.$setValidity('required', true);
      }
      if (form.$invalid) {
        return;
      } else if ($scope.biomedic.biomedicDate == null) {
        form.biomedicDate.$setValidity('required', false);
        return;
      }
      var label = "";
      switch ($scope.biomedic.type) {
        case BiomedicType.CARDIACFREQUENCY:
          label = "Frequência Cardíaca";
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
        case BiomedicType.ABDOMINAL_GIRTH:
          label = "Perímetro Abdominal";
          break;

      }
      $ionicLoading.show({template: "A gravar " + label + "..."});


      var handler = function () {
        $ionicLoading.hide();
        $state.go('app.biomedic');
      };
      switch ($scope.biomedic.type) {
        case BiomedicType.CARDIACFREQUENCY:
          BiomedicService.addCardiacFrequencyRecord(new CardiacFrequency($scope.biomedic.biomedicDate, $scope.biomedic.value), handler);
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
        case BiomedicType.ABDOMINAL_GIRTH:
          BiomedicService.addAbdominalGirthRecord(new AbdominalGirth($scope.biomedic.biomedicDate, $scope.biomedic.value), handler);
          break;
      }


    }

    $ionicPlatform.ready(function () {
      $scope.offline = /*$cordovaNetwork.isOffline()*/1!=1;
      $scope.$on('offline', function () {
        $scope.offline = true;
      });
      $scope.$on('online', function () {
        $scope.offline = false;
      });
    });
  })
  .controller('RecomendationCtrl', function ($ionicPlatform, $cordovaNetwork, $scope, FirebaseService, RecomendationService) {
    $scope.currentIndex = 0;

    $scope.getFormattedDate = function (timestamp) {
      var date = new Date(timestamp);
      var day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
      var month = date.getMonth() + 1;
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var seconds = date.getSeconds();
      month = month < 10 ? '0' + month : month;
      hours = hours < 10 ? '0' + hours : hours;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      seconds = seconds < 10 ? '0' + seconds : seconds;
      var year = date.getFullYear();
      return day + "/" + month + '/' + year + " " + hours + ":" + minutes + ":" + seconds;
    };

    $scope.recomendations = [];
    $scope.recomendation = undefined;


    $scope.nextRecomendation = function () {

      if ($scope.currentIndex == $scope.recomendations.length - 1) {
        return;
      }
      $scope.recomendation = $scope.recomendations[$scope.currentIndex++];

    };
    $scope.previousRecomendation = function () {

      if ($scope.currentIndex == 0) {
        return;
      }
      $scope.recomendation = $scope.recomendations[$scope.currentIndex--];
    };

    var processRecomendations = function (recomendations) {
      $scope.recomendations = [];
      $scope.recomendation = undefined;
      if (recomendations && recomendations !== null) {
        for (var i = 0; i < recomendations.length; i++) {
          var obj = recomendations[i];

          var level = obj.level;

          var aux = obj.toJson();
          aux.level = level;
          $scope.recomendations.push(aux);
        }
        $scope.currentIndex = $scope.recomendations.length - 2;
        $scope.recomendation = $scope.recomendations[$scope.currentIndex];
      }
    };
    $ionicPlatform.ready(function () {
      $scope.offline = /*$cordovaNetwork.isOffline()*/1!=1;
      $scope.$on('offline', function () {
        alert(window.localStorage.getItem("recomendation"));
        var recomendations = JSON.parse(window.localStorage.getItem("recomendation"));
        if (recomendations && recomendations !== null) {
          RecomendationService.transformRecomendations(recomendations, FirebaseService.getCurrentUserUid(), function (recs) {
            processRecomendations(recs);
          });
        }
      });
      $scope.$on('online', function () {
        $scope.offline = false;
        RecomendationService.getRecomendations(FirebaseService.getCurrentUserUid(), function (recomendations) {
          processRecomendations(recomendations);
          if (!recomendations || recomendations === null) {
            recomendations = [];
          }
          window.localStorage.setItem("recomendation",  JSON.stringify(recomendations));
        });
      });
      if (!$scope.offline) {
        RecomendationService.getRecomendations(FirebaseService.getCurrentUserUid(), function (recomendations) {
          processRecomendations(recomendations);
          if (!recomendations || recomendations === null) {
            recomendations = [];
          }
          window.localStorage.setItem("recomendation", JSON.stringify(recomendations));
        });
      } else {
        var recomendations = JSON.parse(window.localStorage.getItem("recomendation"));
        if (recomendations && recomendations !== null) {
          RecomendationService.transformRecomendations(recomendations, FirebaseService.getCurrentUserUid(), function (recs) {
            processRecomendations(recs);
          });
        }
      }
    });
    // RecomendationService.getCurrentRecomendation(FirebaseService.getCurrentUserUid(), function (recomendation) {
    //   if (recomendation && recomendation !== null) {
    //     var obj = recomendation;
    //     var level = obj.level;
    //     var aux = obj.toJson();
    //     aux.level = level;
    //     $scope.recomendation = aux;
    //   } else {
    //     $scope.recomendation = undefined;
    //   }
    // });
  })
  .controller('MessageCtrl', function ($scope, MessageService, $stateParams, $state) {
    if ($stateParams.id) {
      MessageService.getMessage($stateParams.id, function (message) {
        $scope.message = message;
      });
    } else {
      $state.go('app.messages');
    }

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
  .controller('MessagesCtrl', function ($ionicPlatform, $scope, $cordovaNetwork, MessageService) {


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

    $scope.markAsSeen = function (message) {
      MessageService.markAsSeen(message.id, function (x) {
      });
    };

    var init = function () {
      $scope.notifications = [];
      MessageService.getMessages(function (messages) {
        $scope.messages = messages;
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      });
    };

    $ionicPlatform.ready(function () {
      $scope.offline = /*$cordovaNetwork.isOffline()*/1!=1;
      $scope.$on('offline', function () {
        $scope.offline = true;
      });
      $scope.$on('online', function () {
        $scope.offline = false;
        init();
      });
      if (!$scope.offline) {
        init();
      }
    });
  })

  .controller('StatsCtrl', function ($ionicPlatform, $cordovaNetwork, $scope, $timeout, $window, $state, RecomendationService, FirebaseService, PhysicalActivityType, PhysicalActivityType) {
    $scope.getFormattedDateSpeed = function (timestamp) {
      var date = new Date(timestamp);
      var day = date.getDate();
      var month = date.getMonth() + 1;
      month = month < 10 ? '0' + month : month;
      day = day < 10 ? '0' + day : day;
      var year = date.getFullYear();
      return day + "-" + month + '-' + year;
    };

    $scope.getUserFormattedDate = function (timestamp) {
      var currentYear = new Date().getFullYear();
      var currentMonth = new Date().getMonth() + 1;
      var date = new Date(timestamp);
      var day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
      var month = date.getMonth() + 1;
      month = month < 10 ? '0' + month : month;
      var year = date.getFullYear();
      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        return "N/D";
      }
      return day + "/" + month + '/' + year + ' (' + (currentYear - year - (currentMonth < month ? 1 : 0)) + ' anos)';
    };
    $scope.getFormattedDate = function (timestamp) {
      var date = new Date(timestamp);
      var day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
      var month = date.getMonth() + 1;
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var seconds = date.getSeconds();
      month = month < 10 ? '0' + month : month;
      hours = hours < 10 ? '0' + hours : hours;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      seconds = seconds < 10 ? '0' + seconds : seconds;
      var year = date.getFullYear();
      if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        return "N/D";
      }
      return day + "/" + month + '/' + year + " " + hours + ":" + minutes + ":" + seconds;
    };



    $scope.calculatePhysicalActivityStats = function (recomendation) {
      var startDate = $scope.getFormattedDateSpeed(recomendation.date);
      var dateDate = new Date(recomendation.date);
      var maxDate = new Date();

      var auxDay = 0;
      var auxWeek = 0;
      var dates = [];
      dates[0] = {
        startDate: recomendation.date,
        formattedStartDate: $scope.getFormattedDateSpeed(recomendation.date),
        endDate: dateDate.setDate(dateDate.getDate() + 7),
        formattedEndDate: $scope.getFormattedDateSpeed(dateDate),
        days: []
      };
      dates[0].days[0] = {date: recomendation.date, formattedDate: startDate};
      var nextDate = new Date(recomendation.date);
      while (nextDate.getTime() < maxDate.getTime()) {
        if (!dates[auxWeek]) {
          dateDate = new Date(nextDate.getTime());
          dates[auxWeek] = {
            startDate: nextDate.getTime(),
            formattedStartDate: $scope.getFormattedDateSpeed(nextDate.getTime()),
            endDate: dateDate.setDate(dateDate.getDate() + 7),
            formattedEndDate: $scope.getFormattedDateSpeed(dateDate.getTime()),
            days: []
          };
        }
        nextDate.setDate(nextDate.getDate() + 1);
        var formattedDate = $scope.getFormattedDateSpeed(nextDate.getTime());
        if (++auxDay == 7) {
          auxWeek++;
          auxDay = 0;
          continue;
        }
        dates[auxWeek].days[auxDay] = {date: recomendation.date, formattedDate: formattedDate};
      }
      $scope.physicalActivityTotalWeeks = dates.length;

      for (var i = 0; i < dates.length; i++) {
        var obj = dates[i];
        FirebaseService.getDBConnection().child('physical_activity').child(FirebaseService.getCurrentUserUid()).orderByKey()
          .startAt(obj.formattedStartDate)
          .endAt(obj.formattedEndDate)
          .once('value', function (snap) {
            var physicalActivityTotalSeconds = 0;
            var frequencies = {};
            for (var j = 0; j < recomendation.exercises.length; j++) {
              var obj1 = recomendation.exercises[j];
              frequencies[obj1.type.key] = {
                duration: obj1.duration,
                durationPerformed: 0,
                frequency: obj1.frequency,
                frequencyPerformed: 0
              };
              physicalActivityTotalSeconds += obj1.duration * obj1.frequency;
            }


            var items = snap.val();
            if (!items || items == null) {
              $scope.physicalActivityWeeks = 0;
              $scope.physicalActivityPercentage = 0;
              $scope.physicalActivity = {
                classPercentage: 'circle-red',
                labelPercentage: $scope.physicalActivityPercentage + '%',
                classWeeks: 'circle-red',
                labelWeeks: $scope.physicalActivityWeeks + " / " + $scope.physicalActivityTotalWeeks
              };
              if (!$scope.$$phase) {
                $scope.$apply();
              }
              return;
            }

            var itemsArray = Object.keys(items).map(function (key) {
              return items[key]
            });

            var physicalSecondsAux = 0;
            for (var x = 0; x < itemsArray.length; x++) {
              var obj2 = itemsArray[x];
              if (obj2 != null) {
                if (frequencies[PhysicalActivityType.WALK.key]) {
                  frequencies[PhysicalActivityType.WALK.key].durationPerformed += (!obj2.walk ? 0 : obj2.walk);
                  physicalSecondsAux += (!obj2.walk ? 0 : obj2.walk);
                  if (obj2.walk && obj2.walk >= frequencies[PhysicalActivityType.WALK.key].duration) {
                    frequencies[PhysicalActivityType.WALK.key].frequencyPerformed++;
                  }
                }
                if (frequencies[PhysicalActivityType.RUN.key]) {
                  frequencies[PhysicalActivityType.RUN.key].durationPerformed += (!obj2.run ? 0 : obj2.run);
                  physicalSecondsAux += (!obj2.run ? 0 : obj2.run);
                  if (obj2.run && obj2.run >= frequencies[PhysicalActivityType.RUN.key].duration) {
                    frequencies[PhysicalActivityType.RUN.key].frequencyPerformed++;
                  }
                }
              }
            }

            var frequenciesArray = Object.keys(frequencies).map(function (key) {
              return frequencies[key]
            });

            var addValidWeek = true;
            for (var c = 0; c < frequenciesArray.length; c++) {
              var obj3 = frequenciesArray[c];
              if (obj3 && obj3.frequency > obj3.frequencyPerformed) {
                addValidWeek = false;
                break;
              }
            }
            if (addValidWeek) {
              $scope.physicalActivityWeeks++;
            }
            $scope.physicalActivityPercentage = physicalSecondsAux * 100 / physicalActivityTotalSeconds;
            var physicalActivityPercentageAux = $scope.physicalActivityPercentage / 100;
            $scope.physicalActivity = {

              classPercentage: physicalActivityPercentageAux < 75 ? 'circle-red' : physicalActivityPercentageAux < 100 ? 'circle-orange' : 'circle-green',
              labelPercentage: Math.round($scope.physicalActivityPercentage) / 100 + '%',
              classWeeks: $scope.physicalActivityTotalWeeks / 2 > $scope.physicalActivityWeeks ? 'circle-red' : $scope.physicalActivityTotalWeeks < $scope.physicalActivityWeeks ? 'circle-green' : 'circle-orange',
              labelWeeks: $scope.physicalActivityWeeks + " / " + $scope.physicalActivityTotalWeeks
            };

            if (!$scope.$$phase) {
              $scope.$apply();
            }
          });

      }

    };

    var init = function() {
      $scope.currentRecomendation = undefined;
      $scope.physicalActivity = {
        classPercentage: '0',
        labelPercentage: '',
        classWeeks: '',
        labelWeeks: '0 / 0'
      };
      $scope.physicalActivityWeeks = 0;
      $scope.physicalActivityPercentage = 0;
      $scope.physicalActivityTotalWeeks = 0;
      RecomendationService.getCurrentRecomendation(FirebaseService.getCurrentUserUid(), function (recomendation) {
        if (recomendation) {
          $scope.currentRecomendation = {};
          var level = recomendation.level;
          $scope.currentRecomendation = recomendation.toJson();
          $scope.currentRecomendation.level = level;

          $scope.calculatePhysicalActivityStats(recomendation);
        }
      });
    }

    $ionicPlatform.ready(function () {
      $scope.offline = /*$cordovaNetwork.isOffline()*/1!=1;
      $scope.$on('offline', function () {
        $scope.offline = true;
      });
      $scope.$on('online', function () {
        $scope.offline = false;
        init();
      });
      if (!$scope.offline) {
        init();
      }
    });

  });
