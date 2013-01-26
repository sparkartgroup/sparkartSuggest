/*

Sparkart Suggest

*/

(function( $ ){
	
	'use strict';
	
	var DEFAULT_THRESHOLD = 2;
	var DEFAULT_DELAY = 150;
	var DEFAULT_MAX = 8;
	var DEFAULT_FIT = true;
	var DEFAULT_COMPARATOR = function( source, string ){
		// http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex#answer-6969486
		var regex_safe_string = string.replace( /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&' );
		var regex = new RegExp( '^'+ regex_safe_string, 'i' );
		return regex.test( source ) && string !== source;
	};
	var DEFAULT_SORTER = function( a, b ){
		return ( a < b )? -1: ( a > b )? 1: 0;
	};
	var DEFAULT_ELEMENT_CONSTRUCTOR = function( suggestion ){
		return '<li class="suggestion">'+ suggestion +'</li>';
	};
	
	var methods = {
		
		// Set up the plugin
		initialize: function( options ){
			
			options = options || {};
			
			return this.each( function(){
				
				var $this = $( this );
				var data = {};
				data.comparator = options.comparator || DEFAULT_COMPARATOR;
				data.sorter = options.sorter || DEFAULT_SORTER;
				data.elementConstructor = options.elementConstructor || DEFAULT_ELEMENT_CONSTRUCTOR;
				data.source = options.source || [];
				if( typeof data.source !== 'function' ){
					var source = data.source.slice(0);
					data.source = function( string, options, callback ){
						var results = $.grep( source, function( item ){
							var result = options.comparator( item, string );	
							return result;
						});
						results = results.sort( options.sorter );
						results = results.slice( 0, options.max );
						callback( results );
					};
				}
				data.threshold = options.threshold || DEFAULT_THRESHOLD;
				data.delay = options.delay || DEFAULT_DELAY;
				data.max = options.max || DEFAULT_MAX;
				data.fit = options.fit || DEFAULT_FIT;
				data.delay_timer = null;
				data.suggestions = null;
				
				// Bind passed events
				if( options.events ){
					for( var event in options.events ){
						if( options.events.hasOwnProperty( event ) ){
							var method = options.events[event];
							$this.on( event, method );
						}
					}
				}
				
				$this.data( 'sparkart_suggest', data );
				
				// Create suggestion interface
				var $container = data.$container = $('<div class="sparkart-suggest container" />');
				var $suggestions = data.$suggestions = $('<ul class="sparkart-suggest suggestions empty" />');
				
				// Bind interface events
				$this.on({
					'focus.sparkart-suggest': function(){
						$this.sparkartSuggest('active');
					},
					'keydown.sparkart-suggest': function( e ){
						// Up
						if( e.which === 38 ){
							e.preventDefault();
							$this.sparkartSuggest('previous');
						// Down
						} else if( e.which === 40 ){
							e.preventDefault();
							$this.sparkartSuggest('next');
						// Enter
						} else if( e.which === 13 ){
							if( $suggestions.children('.selected').length ){
								e.preventDefault();
								e.stopPropagation();
								$this.sparkartSuggest('select');
							}
						// Some other key
						} else {
							if( data.delay_timer ) clearTimeout( data.delay_timer );
							data.delay_timer = setTimeout( function(){
								$this.sparkartSuggest('update');
							}, data.delay );
						}
					},
					'blur.sparkart-suggest': function(){
						$this.sparkartSuggest('inactive');
					}
				});
				$suggestions.on( 'mouseenter.sparkart-suggest', '> li', function(){
					var index = $(this).index();
					$this.sparkartSuggest( 'highlight', index );
				});
				$suggestions.on( 'mouseup.sparkart-suggest', '> li', function(){
					var $suggestion = $suggestions.children('.selected');
					var index = $suggestion.index();
					$this.sparkartSuggest( 'select', index );
				});
				$suggestions.on( 'mousedown.sparkart-suggest', function( e ){
					e.preventDefault();
				});
				
				// Add elements to DOM
				$('body').append( $container.append($suggestions) );
				
				$container.width( $this.outerWidth() );
				
			});
			
		},
		
		// Draw the suggestions list
		update: function( string ){
			
			return this.each( function(){
				
				var $this = $(this);
				var data = $this.data('sparkart_suggest');
				string = string || $this.val();
				var offset = $this.offset();
				var height = $this.outerHeight();
				
				data.$suggestions
					.empty()
					.addClass('empty');
					
				data.$container
					.css({
						top: offset.top + height,
						left: offset.left
					});
				
				if( string && string.length >= data.threshold ){
					$this.sparkartSuggest( 'suggestions', string, function( suggestions ){
						for( var i in suggestions ){
							var suggestion_html = data.elementConstructor( suggestions[i] );
							data.$suggestions.append( suggestion_html );
						}
						data.$suggestions.toggleClass( 'empty', suggestions.length === 0 );
					});
				}
				
			});
			
		},
		
		// Return the list of suggestions
		suggestions: function( string, callback ){
		
			var $this = $(this);
			var data = $this.data('sparkart_suggest');
			string = string || $this.val();	
			var options = {
				comparator: data.comparator,
				sorter: data.sorter,
				max: data.max
			};
			
			data.source( string, options, function( suggestions ){
				data.suggestions = suggestions;	
				callback( suggestions );
			});
			
		},
		
		// Highlight suggestion by index
		highlight: function( index ){
			
			return this.each( function(){
				
				var $this = $(this);
				var data = $this.data('sparkart_suggest');
				var $selected = data.$suggestions.children('.selected');
				var $to_highlight = data.$suggestions.children(':eq('+ index +')');
				
				$selected.removeClass('selected');
				$to_highlight.addClass('selected');
				
			});
			
		},
		
		// Highlight next suggestion
		next: function(){
			
			return this.each( function(){
				
				var $this = $(this);
				var data = $this.data('sparkart_suggest');
				
				if( !data.$suggestions.is(':empty') ){
				
					var $selected = data.$suggestions.children('.selected');
					var $next = ( $selected.length )? $selected.next(): data.$suggestions.children(':first-child');
					
					$selected.removeClass('selected');
					$next.addClass('selected');
					
				}
				
			});
			
		},
		
		// Highlight previous suggestion
		previous: function(){
			
			return this.each( function(){
				
				var $this = $(this);
				var data = $this.data('sparkart_suggest');
				
				if( !data.$suggestions.is(':empty') ){
					
					var $selected = data.$suggestions.children('.selected');
					var $previous = ( $selected.length )? $selected.prev(): data.$suggestions.children(':last-child');
					
					$selected.removeClass('selected');
					$previous.addClass('selected');
					
				}
				
			});	
			
		},
		
		// Select a suggestion
		select: function( index ){
			
			return this.each( function(){
				
				var $this = $(this);
				var data = $this.data('sparkart_suggest');
				index = index || data.$suggestions.children('.selected').index();
				
				if( index > -1 ){
					
					var suggestion = data.suggestions[index];
					var event = $.Event('select');
					event.suggestion = suggestion;
					$this.trigger( event );
					
					if( event.isDefaultPrevented() ) return;	
					
					data.$suggestions.empty().addClass('empty');
					$this.val( suggestion ).focus();
					
					data.suggestions = [];					
					
				}
				
			});
			
		},
		
		// Show the suggestions
		active: function(){
			
			return this.each( function(){
				
				var $this = $(this);
				var data = $this.data('sparkart_suggest');
				
				data.$suggestions.addClass('active');
				
				$this.sparkartSuggest('update');
				
			});
			
		},
		
		// Hide the suggestions
		inactive: function(){
			
			return this.each( function(){
				
				var $this = $(this);
				var data = $this.data('sparkart_suggest');
				
				data.$suggestions.removeClass('active');
				
			});	
			
		},
		
		// Destroy the plugin
		destroy: function(){
			
			var $this = $(this);	
			var data = $this.data('sparkart_suggest');
			
			data.$suggestions.remove();
			$this.off('.sparkart-suggest');
			$this.removeData('sparkart_suggest');
			
		}
		
	};
	
	// Attach stPagination to jQuery
	$.fn.sparkartSuggest = function( method ){
		
		if( methods[method] ){
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		}
		else if( typeof method === 'object' || ! method ){
			return methods.initialize.apply( this, arguments );
		}	
		
	};

})( jQuery );