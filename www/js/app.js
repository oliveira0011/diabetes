// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('app', ['ionic', 'ionic.service.core', 'ngCordova', 'app.controllers', 'app.directives', 'app.factories', 'app.services', 'firebase', 'ngMessages', 'ng-fusioncharts'])
  .run(function ($ionicPlatform, FirebaseService) {
    $ionicPlatform.ready(function () {
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      }
      FirebaseService.registerDevice();
    });
  })
  .config(function($ionicConfigProvider) {
    // remove back button text completely
    $ionicConfigProvider.backButton.previousTitleText(false).text(' ');
    $ionicConfigProvider.tabs.position("bottom"); //Places them at the bottom for all OS
    $ionicConfigProvider.tabs.style("standard");
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
      .state('app.biomedic', {
        url: '/biomedic',
        views: {
          'menuContent': {
            templateUrl: 'templates/biomedic.html',
            controller: 'BiomedicCtrl'
          }
        }
      })
      .state('app.biomedicRegistry', {
        url: '/biomedic/registry',
        views: {
          'menuContent': {
            templateUrl: 'templates/biomedic-registry.html',
            controller: 'BiomedicRegistryCtrl'
          }
        }
      })
      .state('app.messages', {
        url: '/message',
        views: {
          'menuContent': {
            templateUrl: 'templates/messages.html',
            controller: 'MessagesCtrl'
          }
        }
      })
      .state('app.message', {
        url: '/message/:id',
        views: {
          'menuContent': {
            templateUrl: 'templates/message.html',
            controller: 'MessageCtrl'
          }
        }
      });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');
  });
