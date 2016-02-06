angular.module('app.factories', [])
  .factory('BiomedicType', function () {
    return {
      HEMOGLOBIN: 'hemoglobin',
      BLOOD_PRESSURE: 'blood-pressure',
      CHOLESTEROL: 'cholesterol'
    }
  })
  .factory('Biomedic', function () {
    function Biomedic(biomedicDate, value) {
      if (this.constructor === Biomedic) {
        throw new Error("Can't instantiate abstract class!");
      }
      this.id = 0;
      this.biomedicDate = biomedicDate;
      this.value = value;
    }

    Biomedic.prototype.type = function () {
      throw new Error("Abstract method!");
    };
    return Biomedic;
  })
  .factory('Hemoglobin', function (Biomedic, BiomedicType) {
    var Hemoglobin = function () {
      Biomedic.apply(this, arguments);
      this.type = BiomedicType.HEMOGLOBIN;
    };
    Hemoglobin.prototype = Object.create(Biomedic.prototype);
    Hemoglobin.prototype.constructor = Hemoglobin;

    return Hemoglobin;
  })
  .factory('BloodPressure', function (Biomedic, BiomedicType) {
    var BloodPressure = function () {
      Biomedic.apply(this, arguments);
      this.type = BiomedicType.BLOOD_PRESSURE;
    };
    BloodPressure.prototype = Object.create(Biomedic.prototype);
    BloodPressure.prototype.constructor = BloodPressure;
    return BloodPressure;
  })
  .factory('Cholesterol', function (Biomedic, BiomedicType) {
    var Cholesterol = function () {
      Biomedic.apply(this, arguments);
      this.type = BiomedicType.CHOLESTEROL;
    };
    Cholesterol.prototype = Object.create(Biomedic.prototype);
    Cholesterol.prototype.constructor = Cholesterol;
    return Cholesterol;
  })
  .factory('Friend', function () {
    function Friend(id, name, profileImage) {
      this.id = id;
      this.name = name;
      this.profileImage = profileImage;
    }

    return Friend;
  })
  .factory('Event', function (Friend) {
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
  })
  .factory('UserFormFactory', function () {
    ///returns the form structure needed for the creation of a user
    var factory = {};

    factory.getUserStructure = function (newUser) {
      var structure = {
        profileImage: {
          placeHolder: 'Imagem de Perfil',
          value: '',
          type: 'image'
        },
        firstName: {
          placeHolder: 'Primeiro Nome',
          value: '',
          type: 'text',
          constraints: {
            'required': true,
            'minlength': 2,
            'maxlength': 50,
            'pattern': /^[a-zA-Z-]+$/
          },
          errorMessages: {
            'required': 'O primeiro nome do utente é obrigatório',
            'maxlength': 'O primeiro nome do utente deve possuir entre 2 a 50 carateres',
            'minlength': 'O primeiro nome do utente deve possuir entre 2 a 50 carateres',
            'pattern': 'O primeiro nome do utente deve apenas conter letras e/ou o carater \'-\''
          }
        },
        lastName: {
          placeHolder: 'Apelido',
          value: '',
          type: 'text',
          constraints: {
            required: true,
            minlength: 2,
            maxlength: 50,
            'pattern': /^[a-zA-Z-\s]+$/
          },
          errorMessages: {
            required: 'O apelido do utente é obrigatório',
            maxlength: 'O apelido do utente deve possuir entre 2 a 50 carateres',
            minlength: 'O apelido do utente deve possuir entre 2 a 50 carateres',
            'pattern': 'O apelido do utente deve apenas conter letras, espaços e/ou o carater \'-\''
          }
        },
        email: newUser ? {
          placeHolder: 'Email',
          value: '',
          type: 'email',
          constraints: {
            required: true,
            minlength: 5,
            maxlength: 50,
            pattern: /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i
          },
          errorMessages: {
            required: 'O email do utente é obrigatório',
            maxlength: 'O email do utente deve possuir entre 5 a 50 carateres',
            minlength: 'O email do utente deve possuir entre 5 a 50 carateres',
            pattern: 'O email inserido não é válido'
          }
        } : {
          placeHolder: 'Email',
          value: '',
          type: 'label'
        },
        address: {
          placeHolder: 'Morada',
          value: '',
          type: 'text',
          constraints: {
            required: false,
            maxlength: 200
          },
          errorMessages: {
            required: 'A morada do utente é obrigatório',
            maxlength: 'A morada do utente deve possuir, no máximo, 200 carateres',
          }
        }
      };

      if (newUser) {
        structure.password = {
          placeHolder: 'Palavra-Passe',
          value: '',
          constraints: {
            required: true
          },
          type: 'password',
          errorMessages: {
            required: 'A definição de uma palavra-passe para o utente é obrigatória'
          }
        };
      } else {
        structure.password = {
          value: false,
          type: 'resetpassword'
        };
      }

      angular.forEach(structure, function (item) {
        if (item.constraints && item.constraints['required']) {
          item.required = true;
        }
      });
      console.log(structure);
      return structure;
    };

    return factory;
  })
;
