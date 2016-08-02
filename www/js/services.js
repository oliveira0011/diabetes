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
        for (var i = 0; i < Object.keys(results).length; i++) {
          var result = Object.keys(results)[i];
          if (results.hasOwnProperty(result)) {
            var friend = results[result];
            if (friend.id !== FirebaseService.getCurrentUserUid()) {
              const fr = friend;
              const counter = i + 1;
              dbConnection.child("profileImages").child(friend.id).once('value', function (data) {
                if (data.val() != null) {
                  var frind = new Friend(fr.id, fr.firstName + " " + fr.lastName, data.val().image);
                  friends.push(frind);
                  if (counter === Object.keys(results).length - 1) {
                    handler(friends);
                  }
                }
              });
            }
          }
        }
      });
    };
    return FriendsService;
  })
  .service('EventsService', function (Event, FirebaseService, MessageService, Message, MessageType) {
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
    function clone(obj) {
      if (null == obj || "object" != typeof obj) return obj;
      var copy = obj.constructor();
      for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
      }
      return copy;
    }

    var processOwner = function (dbConnection, owner, id, evt1, refreshHandler, aux) {
      dbConnection.child("users").child(owner).once('value', function (snap) {
        var evt = aux[id];
        evt.owner = snap.val();
        refreshHandler(evt);
      });
    };
    EventsService.getAllEvents = function (refreshHandler) {
      var dbConnection = FirebaseService.getDBConnection();
      dbConnection.child("events").orderByChild("date")/*.startAt(new Date().getTime())*/.on('value', function (snap) {
        var data = snap.val();
        var aux = {};
        for (var dt in data) {
          if (data.hasOwnProperty(dt)) {
            var event = clone(data[dt]);
            event.id = dt;
            aux[event.id] = clone(event);
            processOwner(dbConnection, event.owner, event.id, event, refreshHandler, aux);
          }
        }
      });
    };
    EventsService.markAsSeen = function (eventId, handler) {
      var dbConnection = FirebaseService.getDBConnection();
      dbConnection.child("events").child(eventId).child("friends").child(FirebaseService.getCurrentUserUid()).update({seen: true}, handler);
    };
    EventsService.editParticipation = function (eventId, participate, handler) {
      var dbConnection = FirebaseService.getDBConnection();
      dbConnection.child("events").child(eventId).child("friends").child(FirebaseService.getCurrentUserUid()).update({
        participate: participate,
        seen: true
      }, handler);
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
          friendsIds[obj.id].seen = false;
        }
        var dbConnection = FirebaseService.getDBConnection();
        var ref = dbConnection.child("events").push();
        ref.set({
          name: event.name,
          description: event.description,
          location: event.location,
          geoLocation: {lat: event.geoLocation.lat(), lng: event.geoLocation.lng()},
          friends: friendsIds,
          date: event.date.getTime(),
          owner: FirebaseService.getCurrentUserUid()
        }, function () {
          eventAddedCallback();
        });
        var eventId = ref.key();
        dbConnection.child('users').child(FirebaseService.getCurrentUserUid()).once('value', function (user) {
          var retrievedUser = user.val();
          for (var j = 0; j < event.friends.length; j++) {
            var fr = event.friends[j];
            MessageService.addMessage(fr.id, eventId, new Message('Convite para Evento', retrievedUser.firstName + " " + retrievedUser.lastName + 'convidou-o para participar em ' + event.name + '.', MessageType.EVENT));
          }
        });

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
  .service('BiomedicService', function (FirebaseService, CardiacFrequency, BloodPressure, Cholesterol, BiomedicType, Weight, AbdominalGirth) {
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

    BiomedicService.addAbdominalGirthRecord = function (biomedic, handler) {
      if (!biomedic instanceof AbdominalGirth) {
        throw 'The data passed to persist must be a AbdominalGirth class.';
      }
      BiomedicService.addRecord(biomedic, handler);
    };
    BiomedicService.addCardiacFrequencyRecord = function (biomedic, handler) {
      if (!biomedic instanceof CardiacFrequency) {
        throw 'The data passed to persist must be a CardiacFrequency class.';
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

    BiomedicService.getAbdominalGirthRecords = function (handler) {
      BiomedicService.getRecords(BiomedicType.ABDOMINAL_GIRTH, handler);
    };
    BiomedicService.getCardiacFrequencyRecords = function (handler) {
      BiomedicService.getRecords(BiomedicType.CARDIACFREQUENCY, handler);
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
  .service('MessageService', function ($rootScope, FirebaseService, Message, MessageType, $http) {
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
    messagesService.markAsSeen = function (id, handler) {
      var ref = FirebaseService.getDBConnection().child('messages').child("in").child(FirebaseService.getCurrentUserUid()).child(id);
      ref.update({seen: true}, handler);
    };
    messagesService.getMessage = function (id, handler) {
      if (!FirebaseService.isUserLogged()) {
        console.log('invalidUser');
        $rootScope.$broadcast('logoutUser');
      }
      console.log("User: ");
      console.log(FirebaseService.getCurrentUserUid());
      var ref = FirebaseService.getDBConnection().child('messages').child("in").child(FirebaseService.getCurrentUserUid()).child(id);
      ref.once('value', function (snap) {
        var value = snap.val();
        if (handler) {
          value.id = id;
          handler(value);
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
    messagesService.addMessage = function (userId, eventId, message) {
      if (!message instanceof Message) {
        throw 'The data passed to persist must be a Message class.';
      }
      if (!FirebaseService.isUserLogged()) {
        console.log('invalidUser');
        $rootScope.$broadcast('logoutUser');
      }
      var ref = FirebaseService.getDBConnection().child('messages').child("in").child(userId)
        .push();
      ref.set({
        title: message.title,
        body: message.body,
        date: message.date,
        type: message.type,
        eventId: eventId,
        seen: false
      });
      FirebaseService.getDBConnection().child('messages').child("out").child(FirebaseService.getCurrentUserUid())
        .child(ref.key())
        .set({
          title: message.title,
          body: message.body,
          date: message.date,
          type: message.type,
          eventId: eventId,
          seen: false
        }, function () {
          FirebaseService.getDBConnection().child("users").child(userId).child("deviceToken").on('value', function (snap) {
            var remoteDeviceToken = snap.val();
            if (!remoteDeviceToken || remoteDeviceToken == null) {
              return;
            }
            console.log(remoteDeviceToken);
            var d = JSON.stringify({
              "tokens": [
                remoteDeviceToken
              ],
              "notification": {
                "alert": message.title,
                "ios": {
                  "badge": 1,
                  "sound": "ping.aiff",
                  "priority": 10,
                  "contentAvailable": 1,
                  "title": "Nova Mensagem",
                  "payload": {
                    "body": message.body
                  }
                },
                "android": {
                  "collapseKey": message.title,
                  "delayWhileIdle": true,
                  "timeToLive": 300,
                  "title": "Nova Mensagem",
                  "payload": {
                    "body": message.body
                  }
                }
              }
            });
            $http({
              method: 'POST',
              url: "https://push.ionic.io/api/v1/push/",
              data: d,
              headers: {
                "Authorization": 'Basic ' + window.btoa("9838b15f3334b5c7ab4e27ddd5a370b2dcb2b2805be53fce"),
                "Content-Type": "application/json",
                "X-Ionic-Application-Id": '6cfedcfa'
              }
            }).error(function (e) {
              console.log(e);
            }).success(function (data, status) {
              console.log(data);
              console.log(status);
            });
          });
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
  })
  .service('RecomendationService', function (FirebaseService, Recomendation, RecomendationLevel) {
    var recomendationService = {};
    recomendationService.getCurrentRecomendation = function (userId, handler) {
      if (!FirebaseService.isUserLogged()) {
        console.log('invalidUser');
        $rootScope.$broadcast('logoutUser');
      }
      FirebaseService.getDBConnection().child('recomendations').child(userId).orderByChild("date").limitToLast(1).on('value', function (snap) {
        var value = snap.val();
        for (var first in value) {
          if (value.hasOwnProperty(first)) {
            var rec = new Recomendation(RecomendationLevel[value[first].level], value[first].medicationModified, value[first].exercises);
            rec.id = first;
            rec.date = value[first].date;
            console.log(rec);
            handler(rec);
            return;
          }
        }
        handler();
      });
    };
    recomendationService.transformRecomendations = function (value, userId, handler) {
      if (!FirebaseService.isUserLogged()) {
        console.log('invalidUser');
        $rootScope.$broadcast('logoutUser');
      }
      var arrayToReturn = [];
      for (var first in value) {
        if (value.hasOwnProperty(first)) {
          var rec = new Recomendation(RecomendationLevel[value[first].level], value[first].medicationModified, value[first].exercises);
          rec.id = first;
          rec.date = value[first].date;
          arrayToReturn.push(rec);
        }
      }
      handler(arrayToReturn);
    };
    recomendationService.getRecomendations = function (userId, handler) {
      if (!FirebaseService.isUserLogged()) {
        console.log('invalidUser');
        $rootScope.$broadcast('logoutUser');
      }
      FirebaseService.getDBConnection().child('recomendations').child(userId).orderByChild("date").on('value', function (snap) {
        var value = snap.val();
        var arrayToReturn = [];
        for (var first in value) {
          if (value.hasOwnProperty(first)) {
            var rec = new Recomendation(RecomendationLevel[value[first].level], value[first].medicationModified, value[first].exercises);
            rec.id = first;
            rec.date = value[first].date;
            arrayToReturn.push(rec);
          }
        }
        handler(arrayToReturn);
      });
    };
    return recomendationService;
  });
