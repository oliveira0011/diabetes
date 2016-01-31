// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('app', ['ionic', 'app.controllers', 'app.directives', 'app.factories', 'app.services', 'firebase', 'ngMessages', 'ngCordova'])
  .run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      }
    });
  })
  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider

      .state('app', {
        url: '/app',
        cache: false,
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'AppCtrl'
      })
      .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'LoginCtrl'
      })
      .state('app.search', {
        url: '/search',
        views: {
          'menuContent': {
            templateUrl: 'templates/search.html'
          }
        }
      })
      .state('app.profile', {
        url: '/profile',
        views: {
          'menuContent': {
            templateUrl: 'templates/profile.html',
            controller: 'ProfileCtrl'
          }
        }
      })
      .state('app.events', {
        url: '/event',
        views: {
          'menuContent': {
            templateUrl: 'templates/events.html',
            controller: 'EventsCtrl'
          }
        }
      })
      .state('app.eventCreate', {
        url: '/event/new',
        views: {
          'menuContent': {
            templateUrl: 'templates/event.html',
            controller: 'EventCtrl'
          }
        }
      })
      .state('app.eventEdit', {
        url: '/event/:id/edit',
        views: {
          'menuContent': {
            templateUrl: 'templates/event.html',
            controller: 'EventCtrl'
          }
        }
      })
      .state('app.eventFind', {
        url: '/event/:id',
        views: {
          'menuContent': {
            templateUrl: 'templates/eventfind.html',
            controller: 'EventFindCtrl'
          }
        }
      })
      .state('app.main', {
        url: '/main',
        views: {
          'menuContent': {
            templateUrl: 'templates/main-page.html',
            controller: 'MainCtrl'
          }
        }
      })
      .state('app.hemoglobin', {
        url: '/hemoglobin',
        views: {
          'menuContent': {
            templateUrl: 'templates/hemoglobin.html',
            controller: 'HemoGlobinCtrl'
          }
        }
      })
      .state('app.hemoglobinRegistry', {
        url: '/hemoglobin/registry',
        views: {
          'menuContent': {
            templateUrl: 'templates/hemoglobin-registry.html',
            controller: 'HemoGlobinRegistryCtrl'
          }
        }
      });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');
  });
