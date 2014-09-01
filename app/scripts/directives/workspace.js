'use strict';


module.exports = function(scrollArea, $timeout, $window, $document) {
	return {
		restrict: 'AE',

		scope: {
			boards: '=',
			state: '='
		},

		link: function(scope, element) {

			// Fix scroll area height on iPad
			if(navigator.userAgent.match(/iPad/i)) {
				var scroller = angular.element(document.getElementById('content-scrollarea'));
				// Height: 768 - safariTopbarHeight(96) - topbarHeight(64) = 608
				scroller.css('height', '608px');
			}

			$timeout(function() {
				scrollArea.destroy();

				scrollArea.scroll = new IScroll('#content-scrollarea', {
					scrollX: true,
					scrollY: true,
					freeScroll: true,
					mouseWheel: true,
					scrollbars: true,
					interactiveScrollbars: true,
					disableMouse: false
				});
			}, 0);

			scope.updateWorkspace = function() {
				var scroller = angular.element(document.getElementById('content-scrollarea'));

				// workspaceWidth / (boardPreviewWidth + margin)
				var boardsPerRow = Math.floor(scroller[0].clientWidth / 254);
				boardsPerRow = Math.min(Math.max(boardsPerRow, 1), 8);

				var boardRowCount = Math.floor(scope.boards.length / boardsPerRow); // Full rows
				if ((scope.boards.length - boardRowCount * boardsPerRow) != 0) {
					// Partial row
					boardRowCount++;
				}

				// (boardRowCount * boardPreviewHeight + margin) + 2 * margin
				var height = (boardRowCount * 224 + 48) + 'px';
				element.css('height', height);
			}

			scope.$on('action:sidebar-collapse', function(event, isCollapsed) {
				scope.updateWorkspace();
				scrollArea.refresh();
			});

			scope.$watch('boards.length', function() {
				scope.updateWorkspace();
				scrollArea.refresh();
			});

			scope.$watch('state.isLoadingBoard', function() {
				// Show overlay when loading board.
				if (scope.state.isLoadingBoard) {
					var width = $window.outerWidth + 'px';
					var height = $window.outerHeight + 'px';
					var loadingOverlay = angular.element(element.children()[0]);

					loadingOverlay.css('width', width);
					loadingOverlay.css('height', height);
					loadingOverlay.addClass('visible');
				}
			});

			angular.element($window).bind('resize', function() {
				scope.updateWorkspace();
			});
		}
	};
}
