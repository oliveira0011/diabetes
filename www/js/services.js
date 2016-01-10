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
;
