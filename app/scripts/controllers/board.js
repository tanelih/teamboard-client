'use strict';

var _    = require('lodash');
var utf8 = require('utf8');

module.exports = function(
	$scope,
	$rootScope,
	modalService,
	connectedSocket,
	resolvedBoard,
	currentUser,
	Modal,
	ticketCollection,
	authService
	) {


	// var lastVoicedTicket = null;

	// var tasks = {
	// 	'createTicket': {
	// 		regex: /^create .+/gi,
	// 		lang: 'en-US',
	// 		call: function(e) {
	// 			$scope.createTicket({
	// 				'heading': e.split(' ').slice(1).join(' ')
	// 			}).then(function(ticket) {
	// 				lastVoicedTicket = ticket;
	// 			});
	// 		}
	// 	},
	// 	'updateTicket': {
	// 		regex: /^write .+/gi,
	// 		lang: 'en-US',
	// 		call: function(e) {
	// 			if(lastVoicedTicket) {
	// 				$scope.editTicket(lastVoicedTicket, {
	// 					'color':   lastVoicedTicket.color,
	// 					'heading': lastVoicedTicket.heading,
	// 					'content': e.split(' ').slice(1).join(' ')
	// 				});
	// 			}
	// 			else {
	// 				console.debug('no ticket was selected');
	// 			}
	// 		}
	// 	}
	// }

	// $speechRecognition.onerror(function(e) {
	// 	console.error('Voice controls disabled.', e);
	// });

	// $speechRecognition.onstart(function() {
	// 	console.debug('Voice controls enabled!');
	// 	$speechRecognition.listenUtterance(tasks['createTicket']);
	// 	$speechRecognition.listenUtterance(tasks['updateTicket']);
	// });

	// $speechRecognition.listen();

	// board resolved in the ui-router
	$scope.board = resolvedBoard;
	$scope.tickets = ticketCollection.getTickets();

	$scope.$on('$stateChangeStart', function() {
		connectedSocket.off('ticket:create');
		connectedSocket.off('ticket:update');
		connectedSocket.off('ticket:remove');
	});

	// create a new ticket in our clients collection if necessary
	connectedSocket.on('ticket:create', function(ev) {
		if (ev.board !== $scope.board.id) {
			return;
		}

		if (currentUser.id === ev.user.id) {
			return console.log('ticket:create made by this client');
		}

		var ticketDoesExist = (ticketCollection.findTicket(ev.ticket.id) != undefined)

		// if the ticket does not already exist in our client (maybe we
		// added it ourselves) we add it to our clients collection
		if (!ticketDoesExist) {
			ev.ticket.color   = utf8.decode(ev.ticket.color);
			ev.ticket.heading = utf8.decode(ev.ticket.heading);
			ev.ticket.content = utf8.decode(ev.ticket.content);

			ticketCollection.addTicketLocal(ev.ticket);
			return $scope.$apply();
		}
	});

	// update a ticket in our collection, create it if necessary
	connectedSocket.on('ticket:update', function(ev) {
		if (ev.board !== $scope.board.id) {
			return;
		}

		// fix issues with self-made updates overriding client
		//
		// TODO use a unique client-id to prevent possible issues
		//      with same user on multiple devices
		if (currentUser.id === ev.user.id) {
			return console.log('ticket:update made by this client');
		}

		var existingTicket = ticketCollection.findTicket(ev.ticket.id);

		// for some reason the ticket does not yet exist in our client
		// so we need to add it to our clients collection
		if (!existingTicket) {
			ev.ticket.color   = utf8.decode(ev.ticket.color);
			ev.ticket.heading = utf8.decode(ev.ticket.heading);
			ev.ticket.content = utf8.decode(ev.ticket.content);
			return ticketCollection.addTicketLocal(ev.ticket);
		}

		// the ticket already exists in our clients collection, so
		// we can just update the attributes of it
		existingTicket.color    = utf8.decode(ev.ticket.color);
		existingTicket.heading  = utf8.decode(ev.ticket.heading);
		existingTicket.content  = utf8.decode(ev.ticket.content);
		existingTicket.position = ev.ticket.position;

		return $scope.$apply();
	});

	// remove a ticket from our clients collection if it exists
	connectedSocket.on('ticket:remove', function(ev) {
		if (ev.board !== $scope.board.id) {
			return;
		}

		ticketCollection.removeTicketLocal(ev.ticket.id);
		$scope.tickets = ticketCollection.getTickets();

		return $scope.$apply();
	});

	$scope.selectedTicketIds = [];

	$scope.removeEnabled = false;
	$scope.editEnabled = false;

	$scope.backgroundEnabled = (currentUser.type == 'guest') ? false : true;

	// TODO Move these to app configuration?
	$scope.snapOptions = {
		enabled:    false,
		gridWidth:  242,
		gridHeight: 136
	}

	$scope.isMinimapVisible = (localStorage.getItem('tb-minimap-visible') === 'true');

	$scope.ticketSearch = {
		str: ''
	};

	// if (currentUser.type == 'guest') {
	// 	$rootScope.$broadcast('ui:enable-background', false);
	// }
	// else {
	// 	$rootScope.$broadcast('ui:enable-background', true);
	// }

	// triggered from TopBarController
	$scope.$on('action:create', function(event, data) {
		$scope.promptTicketCreate();
	});

	// triggered from TopBarController
	$scope.$on('action:enable-snap', function(event, data) {
		$scope.snapOptions.enabled = !$scope.snapOptions.enabled;
	});

	// triggered from TopBarController
	// $scope.$on('action:edit-board', function(event, data) {
	// 	$scope.promptBoardEdit($scope.board);
	// });

	// triggered from TopBarController
	$scope.$on('action:remove', function(event, data) {
		$scope.promptTicketRemove();
	});

	// triggered from TopBarController
	$scope.$on('action:edit', function(event, data) {
		$scope.promptTicketEdit();
	});

	$scope.validateToolset = function() {
		var selectionCount = ticketCollection.getSelectedTicketsCount();

		// Enable/disable necessary toolbar buttons.
		if (selectionCount != 0) {
			$scope.removeEnabled = true;

			// Enable edit only if a single ticket is selected.
			if (selectionCount == 1) {
				$scope.editEnabled = true;
			}
			else {
				$scope.editEnabled = false;
			}
		}
		else {
			$scope.removeEnabled = false;
			$scope.editEnabled = false;
		}
	}

	$scope.onBoardClicked = function($event) {
		$event.stopPropagation();
		$scope.removeTicketSelections();
	}

	$scope.toggleMinimap = function() {
		$scope.isMinimapVisible = !$scope.isMinimapVisible;
		localStorage.setItem('tb-minimap-visible', $scope.isMinimapVisible);
		$rootScope.$broadcast('action:toggle-minimap', $scope.isMinimapVisible);
	}

	$scope.toggleTicketSelection = function(id) {
		ticketCollection.toggleTicketSelection(id);
		$scope.validateToolset();
	}

	$scope.removeTicketSelections = function() {
		$rootScope.$broadcast('action:select-tickets', false);
		ticketCollection.clearSelectedTicketIds();
		$scope.validateToolset();
	}

	$scope.createTicket = function(data) {
		data.board = $scope.board.id;
		data.position = { x: 0, y: 0, z: 1000 };
		ticketCollection.addTicket(data);
	}

	$scope.addBackground = function(bg) {
		$scope.board.background = bg;
		$scope.board.update()
			.then(function() {
				$scope.$broadcast('action:add-background', bg);
			});
	}

	$scope.removeSelectedTickets = function() {
		ticketCollection.removeSelectedTickets().then(function() {
			$scope.tickets = ticketCollection.getTickets();
			$scope.removeTicketSelections();
		});
	}

	$scope.promptTicketCreate = function() {
		var options = {
			'template': require('../../partials/modals/create-ticket.html'),
		}

		Modal.open(null, options).result.then(function(result) {
			return $scope.createTicket(result);
		});
	}

	$scope.promptTicketEdit = function(ticket) {
		ticket = ticket || ticketCollection.getSelectedTicket();

		var props = {
			'color':   ticket.color,
			'heading': ticket.heading,
		}

		var options = {
			'template': require('../../partials/modals/edit-ticket.html'),
		}

		Modal.open(props, options).result.then(function(result) {
			return ticketCollection.updateTicket(ticket.id, result);
		});
	}

	$scope.promptTicketRemove = function() {
		var props = {
			'name':  ticketCollection.getSelectedTicket().heading,
			'count': ticketCollection.getSelectedTicketsCount(),
		}

		var options = {
			'template': require('../../partials/modals/remove-ticket.html'),
		}

		Modal.open(props, options).result.then(function() {
			return $scope.removeSelectedTickets();
		});
	}

	$scope.promptBackgroundAdd = function() {
		var modalOptions = {
			template: require('../../partials/modal-backgroundadd.html'),
			windowClass: 'modal-size-lg'
		}

		var backgrounds = [];
		backgrounds.push({ name: 'Blank', url: 'none' });
		backgrounds.push({ name: 'Kanban', url: 'images/backgrounds/kanban.png' });
		backgrounds.push({ name: 'Scrum', url: 'images/backgrounds/scrum.png' });
		backgrounds.push({ name: 'Business model', url: 'images/backgrounds/business_model_canvas.png' });
		backgrounds.push({ name: 'SWOT', url: 'images/backgrounds/swot.png' });
		backgrounds.push({ name: 'Customer journey', url: 'images/backgrounds/customer_journey_map.png' });
		backgrounds.push({ name: 'Keep drop try', url: 'images/backgrounds/keep_drop_try.png' });
		backgrounds.push({ name: 'Play', url: 'images/backgrounds/play.png' });

		var userOptions = {
			backgrounds: backgrounds,
			currentBg: $scope.board.background
		};

		modalService.show(modalOptions, userOptions).then(function(result) {
			$scope.addBackground(result.selectedBg);
		});
	}

	$scope.logout = function() {
		authService.logout().then(function() {
			socketService.disconnect();
			$state.go('login');
		});
	}
}
