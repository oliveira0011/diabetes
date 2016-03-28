angular.module('app.services', [])
  .service('FriendsService', function (Friend, FirebaseService) {
    function FriendsService() {
      this.friends = {};
    }

    FriendsService.getFriends = function (handler) {
      var dbConnection = FirebaseService.getDBConnection();
      dbConnection.child("users").on('value', function (data) {
        var friends = [];
        var results = data.val();
        for (var result in results) {
          if (results.hasOwnProperty(result)) {
            var friend = results[result];
            if (friend.id !== FirebaseService.getCurrentUserUid()) {
              console.log(friend.id);
              const fr = friend;
              dbConnection.child("profileImages").child(friend.id).once('value', function (data) {
                if (data.val() != null) {
                  var frind = new Friend(fr.id, fr.firstName + " " + fr.lastName, data.val().image);
                  friends.push(frind);
                }
              });
            }
          }
        }
        handler(friends);
      });
    };
    return FriendsService;
  })
  .service('EventsService', function (Event, FirebaseService) {
    function EventsService() {
      this.events = {};
    }

    EventsService.getEvent = function (id, handler, refreshHandler) {
      var dbConnection = FirebaseService.getDBConnection();
      dbConnection.child("events").child(id).on('value', function (snap) {
        var data = snap.val();
        const evt = data;
        var friends = [];
        angular.copy(evt.friends, friends);
        evt.friends = [];
        console.log(friends);
        var ownerId = evt.owner;
        handler(evt);
        dbConnection.child("users").child(ownerId).on('value', function (snap) {
          evt.owner = snap.val();
          evt.owner.id = ownerId;
          const own = evt.owner;
          dbConnection.child("profileImages").child(ownerId).once('value', function (data) {
            if (data.val() != null) {
              own.profileImage = data.val().image;
            }
            for (var friend in friends) {
              if (friends.hasOwnProperty(friend)) {
                var obj = friends[friend];
                console.log(obj);
                if (obj.participate) {
                  const f = friend;
                  dbConnection.child("users").child(f).on('value', function (snap) {
                    const fr = snap.val();
                    dbConnection.child("profileImages").child(f).once('value', function (data) {
                      if (data.val() != null) {
                        fr.profileImage = data.val().image;
                        evt.friends.push(fr);
                        refreshHandler();
                      }
                    });
                  });
                }
                refreshHandler();
              }
            }
          });
        });
      });
    };
    EventsService.getAllEvents = function (handler, refreshHandler) {
      var dbConnection = FirebaseService.getDBConnection();
      dbConnection.child("events").orderByChild("date").startAt(new Date().getTime()).on('value', function (snap) {
        var data = snap.val();
        var events = [];
        for (var dt in data) {
          if (data.hasOwnProperty(dt)) {
            var event = data[dt];
            event.id = dt;
            const evt = event;
            dbConnection.child("users").child(event.owner).once('value', function (snap) {
              var owner = snap.val();
              evt.owner = owner;
              events.push(evt);
              refreshHandler();
            });
          }
        }
        handler(events);
      });
    };
    EventsService.editParticipation = function (eventId, participate, handler) {
      var dbConnection = FirebaseService.getDBConnection();
      dbConnection.child("events").child(eventId).child("friends").child(FirebaseService.getCurrentUserUid()).set({participate: participate}, handler);
    };
    EventsService.addEvent = function (event, eventAddedCallback) {
      if (!event instanceof Event) {
        console.log('Trying to add an non Event object!!');
      } else {
        var friendsIds = {};
        console.log(event);
        for (var i = 0; i < event.friends.length; i++) {
          var obj = event.friends[i];
          friendsIds[obj.id] = {};
          friendsIds[obj.id].participate = false;
        }
        var dbConnection = FirebaseService.getDBConnection();
        dbConnection.child("events")
          .push({
            name: event.name,
            description: event.description,
            location: event.location,
            geoLocation: {lat: event.geoLocation.lat(), lng: event.geoLocation.lng()},
            friends: friendsIds,
            date: event.date.getTime(),
            owner: FirebaseService.getCurrentUserUid()
          }, eventAddedCallback);
      }
    };

    EventsService.editEvent = function (id, event, eventAddedCallback) {
      if (!event instanceof Event) {
        console.log('Trying to add an non Event object!!');
      } else {
        var friendsIds = [];
        for (var i = 0; i < event.friends.length; i++) {
          var obj = event.friends[i];
          friendsIds.push(obj.ud);
        }
        var dbConnection = FirebaseService.getDBConnection();
        dbConnection.child("events")
          .child("id")
          .set({
            name: event.name,
            description: event.description,
            location: event.location,
            geoLocation: {lat: event.geoLocation.lat(), lng: event.geoLocation.lng()},
            friends: friendsIds,
            date: event.date.getTime(),
          }, eventAddedCallback);
      }
    };
    EventsService.events = {};
    //EventsService.events[1] = new Event(1, "Caminhada na Peneda", "R. Dr. João Soares,2400 Leiria", "Caminhada pela peneda. Importante para quem queira cumprir o seu objetivo de realizar exercício físico", FriendsService.friends, "img/ionic.png", FriendsService.friends[2]);
    //EventsService.events[2] = new Event(2, "Caminhada por Leiria", "R. Dr. João Soares,2400 Leiria", "Caminhada por Leiria", FriendsService.friends, "img/ionic.png", FriendsService.friends[3]);
    //EventsService.events[3] = new Event(3, "Sessão de exercício físico no parque do avião", "R. Dr. João Soares,2400 Leiria", "Em princípio não haverá caminhadas nem corridas, a menos que a maioria dos participantes assim o queira. A ideia é fazer exercícios como flexões e outros.", FriendsService.friends, "img/ionic.png", FriendsService.friends[4]);

    return EventsService;
  })
  .service('FirebaseService', function ($rootScope) {
    var firebaseService = {};
    var deviceToken;
    var push;
    firebaseService.logoutCurrentUser = function () {
      window.localStorage.removeItem('currentUserUid');
      if (deviceToken) {
        try {
          push.unregister();
        } catch (e) {
          console.log("push notification is not present, ignored");
        }
      }
    };
    firebaseService.setCurrentUserUid = function (currentUserUid) {
      window.localStorage.setItem('currentUserUid', currentUserUid);
    };
    firebaseService.getCurrentUserUid = function () {
      return window.localStorage.getItem('currentUserUid');
    };
    firebaseService.isUserLogged = function () {
      return window.localStorage.getItem('currentUserUid') && window.localStorage.getItem('currentUserUid') !== null;
    };

    firebaseService.getDeviceToken = function () {
      console.log("GET: " + deviceToken);
      return deviceToken;
    };
    firebaseService.registerDevice = function () {
      console.log("registering device");
      var callback = function (token) {
        console.log("Device token:", token.token);
        //push.addTokenToUser(user);
        //user.save();
        deviceToken = token.token;
      };
      Ionic.io();
      push = new Ionic.Push({
        "onNotification": function (notification) {
          //alert('Received push notification!');
          console.log(notification);
          $rootScope.$broadcast('newNotification', notification);
        },
        "debug": true,
        "pluginConfig": {
          "android": {
            "iconColor": "#0000FF"
          }
        }
      });
      try {
        push.register(callback);
      } catch (e) {
        console.log("push notification is not present, ignored");
      }
      console.log("registering started for device");
    };
    firebaseService.checkDeviceToken = function () {
      if (!deviceToken) {
        firebaseService.registerDevice();
        console.log("Device token undefined");
        return;
      }
      var ref = this.getDBConnection().child('users').child(this.getCurrentUserUid()).child("deviceToken");
      ref.once('value', function (snap) {
        var storedDeviceId = snap.val();
        console.log(storedDeviceId);
        if ((!storedDeviceId || storedDeviceId == null || storedDeviceId != deviceToken)) {
          ref.set(deviceToken, function () {
            console.log("Device Token updated.");
          });
        } else {
          deviceToken = storedDeviceId;
        }
        $rootScope.$broadcast('deviceUpdated', deviceToken);
      });
    };
    firebaseService.getDBConnection = function () {
      return new Firebase("https://diabetes.firebaseio.com");
    };
    return firebaseService;
  })
  .service('BiomedicService', function (FirebaseService, Hemoglobin, BloodPressure, Cholesterol, BiomedicType, Weight) {
    function BiomedicService() {
    }

    BiomedicService.addRecord = function (biomedic, handler) {
      var dbConnection = FirebaseService.getDBConnection();
      dbConnection.child(biomedic.type).child(FirebaseService.getCurrentUserUid())
        .push({
          value: biomedic.value,
          biomedicDate: biomedic.biomedicDate.getTime()
        }, handler);
    };

    BiomedicService.getRecords = function (type, handler) {
      var dbConnection = FirebaseService.getDBConnection();
      dbConnection.child(type).child(FirebaseService.getCurrentUserUid()).on('value', function (data) {
        var results = data.val();
        for (var result in results) {
          if (results.hasOwnProperty(result)) {
            results[result].type = type;
          }
        }
        handler(type, results);
      });
    };

    BiomedicService.addHemoglobinRecord = function (biomedic, handler) {
      if (!biomedic instanceof Hemoglobin) {
        throw 'The data passed to persist must be a Hemoglobin class.';
      }
      BiomedicService.addRecord(biomedic, handler);
    };
    BiomedicService.addMinBloodPressureRecord = function (biomedic, handler) {
      if (!biomedic instanceof BloodPressure) {
        throw 'The data passed to persist must be a MinBloodPressure class.';
      }
      BiomedicService.addRecord(biomedic, handler);
    };
    BiomedicService.addMaxBloodPressureRecord = function (biomedic, handler) {
      if (!biomedic instanceof BloodPressure) {
        throw 'The data passed to persist must be a MaxBloodPressure class.';
      }
      BiomedicService.addRecord(biomedic, handler);
    };
    BiomedicService.addCholesterolRecord = function (biomedic, handler) {
      if (!biomedic instanceof Cholesterol) {
        throw 'The data passed to persist must be a Cholesterol class.';
      }
      BiomedicService.addRecord(biomedic, handler);
    };
    BiomedicService.addWeightRecord = function (biomedic, handler) {
      if (!biomedic instanceof Weight) {
        throw 'The data passed to persist must be a Weight class.';
      }
      BiomedicService.addRecord(biomedic, handler);
    };

    BiomedicService.getHemoglobinRecords = function (handler) {
      BiomedicService.getRecords(BiomedicType.HEMOGLOBIN, handler);
    };
    BiomedicService.getMinBloodPressureRecords = function (handler) {
      BiomedicService.getRecords(BiomedicType.MIN_BLOOD_PRESSURE, handler);
    };
    BiomedicService.getBloodPressureRecords = function (handler) {
      BiomedicService.getRecords(BiomedicType.MIN_BLOOD_PRESSURE, function (type, records) {
        BiomedicService.getRecords(BiomedicType.MAX_BLOOD_PRESSURE, function (type, retrievedRecords) {
          handler(BiomedicType.BLOOD_PRESSURE, [records, retrievedRecords]);
        });
      });
    };
    BiomedicService.getMaxBloodPressureRecords = function (handler) {
      BiomedicService.getRecords(BiomedicType.MAX_BLOOD_PRESSURE, handler);
    };
    BiomedicService.getCholesterolRecords = function (handler) {
      BiomedicService.getRecords(BiomedicType.CHOLESTEROL, handler);
    };
    BiomedicService.getWeightRecords = function (handler) {
      BiomedicService.getRecords(BiomedicType.WEIGHT, handler);
    };
    return BiomedicService;
  })
  .service('MessageService', function ($rootScope, FirebaseService) {
    var messagesService = {};
    var messages = [];

    messagesService.getMessages = function (handler) {
      if (!FirebaseService.isUserLogged()) {
        console.log('invalidUser');
        $rootScope.$broadcast('logoutUser');
      }
      var ref = FirebaseService.getDBConnection().child('messages').child("in").child(FirebaseService.getCurrentUserUid()).orderByChild("date");
      ref.on('value', function (snap) {
        var value = snap.val();
        var retrievedNotifications = [];
        if (handler) {
          angular.forEach(value, function (notification, key) {
            notification.id = key;
            retrievedNotifications.unshift(notification);
          });
          messages = retrievedNotifications;
          handler(messages.slice());
        }
      });
    };
    messagesService.registerNewNotificationsListener = function () {
      if (!FirebaseService.isUserLogged()) {
        console.log('invalidUser');
        $rootScope.$broadcast('logoutUser');
      }
      var ref = FirebaseService.getDBConnection().child('messages').child("in").child(FirebaseService.getCurrentUserUid()).orderByChild("date");
      ref.on('child_added', function (snap) {
        var value = snap.val();
        value.id = snap.key();
        messages.unshift(value);
        $rootScope.$broadcast('new_message', value);
      });
    };
    return messagesService;
  })
  .service('TimerService', function ($rootScope, $timeout) {

    var timer = {};
    var timerTime = 60;
    var mytimeout = null; // the current timeoutID
    var started;
    var xpto;

    // actual timer method, counts down every second, stops on zero
    timer.onTimeout = function () {
      if (timerTime === 0) {
        $rootScope.$broadcast('timer-stopped', xpto);
        $timeout.cancel(mytimeout);
        return;
      }
      timerTime--;
      xpto++;
      mytimeout = $timeout(timer.onTimeout, 1000);
      $rootScope.$broadcast('timer-changed', timerTime);
    };
    timer.startTimer = function () {
      mytimeout = $timeout(timer.onTimeout, 1000);
      xpto = timerTime;
      started = true;
    };

    return timer;
  });
