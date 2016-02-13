angular.module('app.services', [])
  .service('FriendsService', function (Friend) {
    function FriendsService() {
      this.friends = {};
    }

    FriendsService.prototype.addFriend = function (friend, friendAddedCallback) {
      if (!friend instanceof Friend) {
        console.log('Trying to add an non Event object!!');
      } else {
        if (!this.friends) {
          this.friends = {};
        }
        this.friends[friend.id] = friend;
        if (this.friendAddedCallback) {
          this.friendAddedCallback(friend);
        }
      }
    };


    FriendsService.prototype.getAllFriends = function () {
      return this.friends;
    };

    FriendsService.prototype.getFriend = function (id) {
      return this.friends[id];
    };
    FriendsService.friends = {};
    FriendsService.friends["ID1"] = new Friend("ID1", "João Faria", "img/ionic.png");
    FriendsService.friends[2] = new Friend(2, "Eduardo Silva", "img/ionic.png");
    FriendsService.friends[3] = new Friend(3, "André Coelho", "img/ionic.png");
    FriendsService.friends[4] = new Friend(4, "Cristiana Ramos", "img/ionic.png");
    FriendsService.friends[5] = new Friend(5, "Tatiana Oliveira", "img/ionic.png");
    FriendsService.friends[6] = new Friend(6, "Teresa Abreu", "img/ionic.png");

    return FriendsService;
  })
  .service('EventsService', function (Event, FriendsService) {
    function EventsService() {
      this.events = {};
    }

    EventsService.prototype.getAllEvents = function () {
      return this.events;
    };

    EventsService.prototype.getEvent = function (id) {
      return this.events[id];
    };

    EventsService.prototype.addEvent = function (event, eventAddedCallback) {
      if (!event instanceof Event) {
        console.log('Trying to add an non Event object!!');
      } else {
        if (!this.events) {
          this.events = {};
        }
        this.events[event.id] = event;
        if (this.eventAddedCallback) {
          this.eventAddedCallback(event);
        }
      }
    };
    EventsService.events = {};
    EventsService.events[1] = new Event(1, "Caminhada na Peneda", "R. Dr. João Soares,2400 Leiria", "Caminhada pela peneda. Importante para quem queira cumprir o seu objetivo de realizar exercício físico", FriendsService.friends, "img/ionic.png", FriendsService.friends[2]);
    EventsService.events[2] = new Event(2, "Caminhada por Leiria", "R. Dr. João Soares,2400 Leiria", "Caminhada por Leiria", FriendsService.friends, "img/ionic.png", FriendsService.friends[3]);
    EventsService.events[3] = new Event(3, "Sessão de exercício físico no parque do avião", "R. Dr. João Soares,2400 Leiria", "Em princípio não haverá caminhadas nem corridas, a menos que a maioria dos participantes assim o queira. A ideia é fazer exercícios como flexões e outros.", FriendsService.friends, "img/ionic.png", FriendsService.friends[4]);

    return EventsService;
  })
  .service('FirebaseService', function () {
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
          alert('Received push notification!');
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
  .service('NotificationService', function ($rootScope, FirebaseService) {

    var notificationsService = {};
    var notifications = [];
    notificationsService.getNotifications = function (handler) {
      if (!FirebaseService.isUserLogged()) {
        console.log('invalidUser');
        $rootScope.$broadcast('logoutUser');
      }
      var ref = FirebaseService.getDBConnection().child('notifications').child(FirebaseService.getCurrentUserUid());
      //ref.push({title:'Nova Recomendação do seu Médico', body:'Após rever a sua evolução dos seus dados biomédicos, decidi atualizar o seu nível de atividade física para níveis mais convenientes.'});
      //ref.push({title:'Novo Evento: Caminhada pela cidade', body:'Foi convidado para o Evento \'Caminhada pela cidade\'.', link:'#app/event/1'});
      //ref.push({title:'Novo Evento: Caminhada pela peneda', body:'Foi convidado para o Evento \'Caminhada pela peneda\'.', link:'#app/event/1'});
      ref.once('value', function (snap) {
        var value = snap.val();
        var retrievedNotifications = [];
        if (handler) {
          angular.forEach(value, function (notification, key) {
            notification.id = key;
            retrievedNotifications.push(notification);
          });
          notifications = retrievedNotifications;
          handler(notifications.slice());
        }
      });
    };
    notificationsService.registerNewNotificationsListener = function () {
      if (!FirebaseService.isUserLogged()) {
        console.log('invalidUser');
        $rootScope.$broadcast('logoutUser');
      }
      var ref = FirebaseService.getDBConnection().child('notifications').child(FirebaseService.getCurrentUserUid());
      ref.on('child_added', function (snap) {
        var value = snap.val();
        value.id = snap.key();
        notifications.push(value);
        $rootScope.$broadcast('new_notification', value);
      });
    };
    return notificationsService;
  });
