'use strict';


var _       = require('lodash');
var angular = require('angular');

var config = {
	common: {

		// TODO Do we need to have configurable states?
		// states for the ui-router
		states: {
			main:     'main.workspace',
			board:    'main.board',
			login:    'login',
			register: 'register'
		},

		// keys used by localStorage to hold information
		// about the users identity
		userKey:  'tbuser',
		tokenKey: 'tbtoken'
	},
	development: {

		// socket.io server host and port
		io: {
			_url: 'http://' + (process.env.HOSTNAME || 'localhost') + ':9001',
		},

		// restful api url and port
		api: {
			_url: 'http://' + (process.env.HOSTNAME || 'localhost') + ':9002/api'
		},

		// static content provider url and port
		// serves things like board images
		static: {
			_url: 'http://' + (process.env.HOSTNAME || 'localhost'),
			_port: 9002
		}
	},
	production: {

		io: {
			_url: process.env.IO_URL
		},

		api: {
			_url: process.env.API_URL
		},

		static: {
			_url:  process.env.STATIC_URL,
			_port: process.env.STATIC_PORT
		}
	}
}

config = _.extend(config.common,
	config[process.env.NODE_ENV] || config.development);

config.io.url = function() {
	return this._url;
}

config.api.url = function() {
	return this._url + '/';
}

module.exports = angular.module('tb.configuration', [ ])
	.value('Config', config);
