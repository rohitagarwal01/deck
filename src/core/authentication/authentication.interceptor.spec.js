'use strict';

describe('authenticationInterceptor', function() {

  var interceptor, $q, settings, apiHost, authenticationService, $rootScope;

  beforeEach(
    window.module(
      require('./authentication.interceptor.service.js')
    )
  );

  beforeEach(window.inject(function(authenticationInterceptor, _$q_, _apiHost_, _authenticationService_, _$rootScope_) {
    interceptor = authenticationInterceptor;
    $q = _$q_;
    apiHost = _apiHost_;
    authenticationService = _authenticationService_;
    $rootScope = _$rootScope_;
    apiHost.setAuthEndpoint('auth.netflix.net');
  }));

  describe('non-intercepted requests', function() {
    it('resolves immediately for auth endpoint', function() {
      var resolved = null;
      var request = { url: apiHost.authEndpoint() };
      interceptor.request(request).then(function(result) { resolved = result; });
      $rootScope.$digest();
      expect(resolved).toBe(request);
    });

    it('resolves immediately for relative and non-http requests', function() {
      var resolved = null;
      var request = { url: '/something/relative' };
      interceptor.request(request).then(function(result) { resolved = result; });
      $rootScope.$digest();
      expect(resolved.url).toBe(request.url);

      request.url = 'tcp://what.are.you.doing.here';
      interceptor.request(request).then(function(result) { resolved = result; });
      $rootScope.$digest();
      expect(resolved.url).toBe(request.url);
    });
  });

  describe('intercepted requests', function () {

    it('registers event with authentication service and does not resolve when not authenticated', function () {
      var resolved = null;
      var request = { url: 'http://some-server.spinnaker.org' };

      var pendingRequests = [];

      spyOn(authenticationService, 'getAuthenticatedUser').and.returnValue({ authenticated: false });
      spyOn(authenticationService, 'onAuthentication').and.callFake(function(pendingRequest) {
        pendingRequests.push(pendingRequest);
      });

      interceptor.request(request).then(function(result) { resolved = result; });
      $rootScope.$digest();
      expect(resolved).toBe(null);
      expect(pendingRequests.length).toBe(1);

      // simulate authentication event
      pendingRequests[0]();
      $rootScope.$digest();
      expect(resolved).toBe(request);
    });

    it('resolves immediately when authenticated', function () {
      var resolved = null;
      var request = { url: 'http://some-server.spinnaker.org' };

      spyOn(authenticationService, 'getAuthenticatedUser').and.returnValue({ authenticated: true });

      interceptor.request(request).then(function(result) { resolved = result; });
      $rootScope.$digest();
      expect(resolved.url).toBe(request.url);

    });
  });

});