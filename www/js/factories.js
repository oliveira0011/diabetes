angular.module('app.factories', [])
  .factory('Friend', function () {
    function Friend(id, name, profileImage) {
      this.id = id;
      this.name = name;
      this.profileImage = profileImage;
    }

    return Friend;
  }).factory('Event', function (Friend) {
  function Event(id, name, location, description, friends, image, owner) {
    this.id = id;
    this.name = name;
    this.location = location;
    this.description = description;
    this.image = image;
    this.owner = owner;
    this.friends = {};
    if (friends) {
      var thisInstance = this;
      angular.forEach(friends, function (friend) {
        thisInstance.addFriend(friend);
      });
      delete thisInstance;
    }
  }

  Event.prototype.addFriend = function (friend, friendAddedCallback) {
    if (!friend instanceof Friend) {
      console.log('Trying to add an non Friend object!!');
    } else {
      this.friends[friend.id] = friend;
      if (this.friendAddedCallback) {
        this.friendAddedCallback(friend);
      }
    }
  };
  Event.prototype.removeFriend = function (friend, friendRemovedCallback) {
    if (!friend instanceof Friend) {
      console.log('Trying to remove an non Friend object!!');
    } else {
      delete this.friends[friend.id];
      if (this.friendRemovedCallback) {
        this.friendRemovedCallback(friend);
      }
    }
  };
  return Event;
});
