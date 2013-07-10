/*

Sparkart Suggest

Originally written by Timothy Kempf
@link https://github.com/SparkartGroupInc/sparkartSuggest

Modifed by Daniel Carbone
@link https://github.com/dcarbone/sparkartSuggest

*/

(function( $ ){

	'use strict';

	var DEFAULT_THRESHOLD = 2;
	var DEFAULT_DELAY = 150;
	var DEFAULT_MAX = 8;
	var DEFAULT_FIT = true;
	var DEFAULT_DISABLE_DEFAULT_AUTOCOMPLETE = true;
	var DEFAULT_SELECT_FIRST = false;
	// Built off of http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
	var DEFAULT_DISABLED_KEYCODES = [16, 17, 18, 19, 20, 33, 34, 35, 36, 37, 39, 45, 91, 92, 93,
		112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 123, 124, 125, 144, 145];
    /**
     * @return {boolean}
     */
    var DEFAULT_COMPARATOR = function( source, string ){
		// http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex#answer-6969486
		var regex_safe_string = string.replace( /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&' );
		var regex = new RegExp( '^'+ regex_safe_string, 'i' );
		return regex.test( source ) && string !== source;
	};
    /**
     * @return {number}
     */
    var DEFAULT_SORTER = function( a, b ){
		return ( a < b )? -1: ( a > b )? 1: 0;
	};
    /**
     * @return {string}
     */
    var DEFAULT_ELEMENT_CONSTRUCTOR = function( suggestion ){
		return '<li class="suggestion selectable">'+ suggestion +'</li>';
	};

	var methods = {

		// Set up the plugin
		initialize: function( options ){

			options = options || {};

			return this.each( function(){

				var $this = $( this );

                if ( typeof options.fnBeforeInit === 'function' ){
                    options.fnBeforeInit($this);
                }

                var data = {
                    bDisableDefaultAutocomplete : options.bDisableDefaultAutocomplete || DEFAULT_DISABLE_DEFAULT_AUTOCOMPLETE,
                    aiDisabledKeycodes          : options.aiDisabledKeycodes || DEFAULT_DISABLED_KEYCODES,
                    fnComparator                : options.fnComparator || DEFAULT_COMPARATOR,
                    fnSorter                    : options.fnSorter || DEFAULT_SORTER,
                    fnElementConstructor        : options.fnElementConstructor || DEFAULT_ELEMENT_CONSTRUCTOR,
                    asSource                    : options.asSource || null,
                    fnSource                    : options.fnSource || null,
                    iThreshold                  : options.iThreshold || DEFAULT_THRESHOLD,
                    iDelay                      : options.iDelay || DEFAULT_DELAY,
                    iMax                        : options.iMax || DEFAULT_MAX,
                    iFit                        : options.iFit || DEFAULT_FIT,
                    delay_timer                 : null,
                    asSuggestions               : null,

                    fnWidth                     : options.fnWidth || null,
                    sWidth                      : options.sWidth || null,

                    // Before / After action optional closures
                    fnBeforeSource      : options.fnBeforeSource || null,
                    fnAfterSource       : options.fnAfterSource || null,
                    fnBeforeActive      : options.fnBeforeActive || null,
                    fnAfterActive       : options.fnAfterActive || null,
                    fnBeforeInactive    : options.fnBeforeInactive || null,
                    fnAfterInactive     : options.fnAfterInactive || null,
                    fnBeforeUpdate      : options.fnBeforeUpdate|| null,
                    fnAfterUpdate       : options.fnAfterUpdate || null,
                    fnBeforeSelect      : options.fnBeforeSelect || null,
                    fnAfterSelect       : options.fnAfterSelect || null,
                    fnBeforeSuggestions : options.fnBeforeSuggestions || null,
                    fnAfterSuggestions  : options.fnAfterSuggestions || null,
                    fnBeforeHighlight   : options.fnBeforeHighlight || null,
                    fnAfterHighlight    : options.fnAfterHighlight || null,
                    fnBeforeNext        : options.fnBeforeNext || null,
                    fnAfterNext         : options.fnAfterNext || null,
                    fnBeforePrevious    : options.fnBeforePrevious || null,
                    fnAfterPrevious     : options.fnAfterPrevious || null,
                    fnBeforeDestroy     : options.fnBeforeDestroy || null,
                    fnAfterDestroy      : options.fnAfterDestroy || null
                };

                if (!(data.asSource instanceof Array) && typeof data.fnSource !== "function" ){
                    throw "asSource or fnSource must be defined!";
                }

                if( typeof data.fnSource !== 'function' && data.asSource instanceof Array ){
                    data.fnSource = function( string, options, callback ){
                        var results = $.grep( data.asSource, function( item ){
                            return options.fnComparator(item, string);
                        });
                        results = results.sort( options.fnSorter );
                        results = results.slice( 0, options.iMax );
                        callback( results );
                    };
                }

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
					'focus.sparkart-suggest': function( event, fireEvent ){
						if (fireEvent === undefined || fireEvent === true){
							$this.sparkartSuggest('active');
						}
					},
					'keydown.sparkart-suggest': function( e ){
						var $selected = $suggestions.children('.selectable.selected');

						// Determine which key has been pressed.
						switch(true){
							// Up
							case e.which === 38 :
								e.preventDefault();
								$this.sparkartSuggest('previous');
							break;
							// Down
							case e.which === 40 :
								e.preventDefault();
								$this.sparkartSuggest('next');
							break;
							// Enter
							case e.which === 13 :
								if( $selected.length ){
									e.preventDefault();
									e.stopPropagation();
									$this.sparkartSuggest('select');
								}
							break;
							// Tab
							case e.which === 9 :
								var index = $selected.index();
								$this.sparkartSuggest( 'select', index );
							break;

							// Escape
							case e.which === 27 :
								$this.sparkartSuggest('inactive');
								$this.trigger('focus', false);
							break;

							// In the event the user presses a non-character key, such as
							// shift / ctrl / windows / etc, we do not want to re-fire
							// the update and select events
							case ($.inArray(e.which, data.aiDisabledKeycodes) > -1) :
								// Do nothing...
							break;

							// Other key
							default :
								if( data.delay_timer ) clearTimeout( data.delay_timer );
								data.delay_timer = setTimeout( function(){
									$this.sparkartSuggest('active');
								}, data.iDelay );
							break;
						}
					},
					'blur.sparkart-suggest': function( event ){
						event.preventDefault();
						event.stopPropagation();
						$this.sparkartSuggest('inactive');
					},
					'focusout.sparkart-suggest' : function( event ){
						event.preventDefault();
						event.stopPropagation();
						$this.sparkartSuggest('inactive');
					}
				});

				$suggestions
					/* mouse events */
					.on('mouseenter.sparkart-suggest', '> li.selectable', function( event ){
						var index = $(this).index();
						$this.sparkartSuggest( 'highlight', index );
					})
					.on('mousedown.sparkart-suggest', '> li.selectable', function( event ){
						var $suggestion = $suggestions.children('.selected');
						var index = $suggestion.index();
						$this.sparkartSuggest( 'select', index );
					});

				// Add elements to DOM
				$('body').append( $container.append($suggestions) );

                // Define width of the container
                var width = 0;
                if ( typeof data.fnWidth === "function" ){
                    width = data.fnWidth($this, data);
                }
                else if ( typeof data.sWidth === "string" ){
                    width = data.sWidth;
                }
                else{
                    width = $this.outerWidth();
                }
                $container.width( width );

                if ( typeof options.fnAfterInit === 'function' ){
                    options.fnAfterInit($this, data);
                }

			});

		},

		// Draw the suggestions list
		update: function( string ){

			return this.each( function(){

				var $this = $(this);
				var data = $this.data('sparkart_suggest');
				string = string || $this.val();

                if ( typeof data.fnBeforeUpdate === "function" ){
                    data.fnBeforeUpdate($this, data, string);
                }

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

				// If the input string is >= the set iThreshold, update
				// autocomplete contents.
				if( string && string.length >= data.iThreshold ){
					$this.sparkartSuggest( 'suggestions', string, function( suggestions ){
						for( var i in suggestions ){
							var suggestion_html = data.fnElementConstructor( suggestions[i] );
							data.$suggestions.append( suggestion_html );
						}
						data.$suggestions.toggleClass( 'empty', suggestions.length === 0 );
					});
				}

                if ( typeof data.fnAfterUpdate === "function" ){
                    data.fnAfterUpdate($this, data, string);
                }
			});

		},

        // Execute fnSource to get list of suggestions
        source : function( string, options, callback ){

            var $this = $(this);
            var data = $this.data('sparkart_suggest');

            if ( typeof data.fnBeforeSource === 'function' ){
                data.fnBeforeSource($this, data);
            }

            data.fnSource( string, options, function( suggestions ){
                data.suggestions = suggestions;
                callback( suggestions );
            });

            if ( typeof data.fnAfterSource === 'function' ){
                data.fnAfterSource($this, data);
            }

        },

		// Return the list of suggestions
		suggestions: function( string, callback ){

			var $this = $(this);
			var data = $this.data('sparkart_suggest');
			string = string || $this.val();

            if ( typeof data.fnBeforeSuggestions === "function" ){
                data.fnBeforeSuggestions($this, data, string);
            }

            var options = {
				fnComparator: data.fnComparator,
				fnSorter: data.fnSorter,
				iMax: data.iMax
			};

            $this.sparkartSuggest('source', string, options, callback);

            if ( typeof data.fnAfterSuggestions === "function" ){
                data.fnAfterSuggestions($this, data);
            }
		},

		// Highlight suggestion by index
		highlight: function( index ){

			return this.each( function(){

				var $this = $(this);
				var data = $this.data('sparkart_suggest');
				var $selected = data.$suggestions.children('.selected');
				var $to_highlight = data.$suggestions.children(':eq('+ index +')');

                if ( typeof data.fnBeforeHighlight === "function" ){
                    data.fnBeforeHighlight($this, data, $selected, $to_highlight);
                }

				$selected.removeClass('selected');
				$to_highlight.addClass('selected');

                if ( typeof data.fnAfterHighlight === "function" ){
                    data.fnAfterHighlight($this, data, $selected, $to_highlight);
                }

			});

		},

		// Highlight next suggestion
		next: function(){

			return this.each( function(){

				var $this = $(this);
				var data = $this.data('sparkart_suggest');

                if ( typeof data.fnBeforeNext === "function" ){
                    data.fnBeforeNext($this, data);
                }

				if( !data.$suggestions.is(':empty') ){

					var $selected = data.$suggestions.children('.selected');
					var $next = ( $selected.length )? $selected.next(): data.$suggestions.children(':first-child');

					$selected.removeClass('selected');
					$next.addClass('selected');

				}

                if ( typeof data.fnAfterNext === "function" ){
                    data.fnAfterNext($this, data);
                }

			});

		},

		// Highlight previous suggestion
		previous: function(){

			return this.each( function(){

				var $this = $(this);
				var data = $this.data('sparkart_suggest');

                if ( typeof data.fnBeforePrevious === "function" ){
                    data.fnBeforePrevious($this, data);
                }

				if( !data.$suggestions.is(':empty') ){

					var $selected = data.$suggestions.children('.selected');
					var $previous = ( $selected.length )? $selected.prev(): data.$suggestions.children(':last-child');

					$selected.removeClass('selected');
					$previous.addClass('selected');

				}

                if ( typeof data.fnAfterPrevious === "function" ){
                    data.fnAfterPrevious($this, data);
                }

			});

		},

		// Select a suggestion
		select: function( index ){

			return this.each( function(){

				var $this = $(this);
				var data = $this.data('sparkart_suggest');
                if ( typeof data.fnBeforeSelect === "function" ){
                    data.fnBeforeSelect($this, data);
                }
				index = index || data.$suggestions.children('.selected').index();

				if( index > -1 ){

					var suggestion = data.suggestions[index];
					var event = $.Event('select');
					event.suggestion = suggestion;
					$this.trigger( event );

					if( event.isDefaultPrevented() ) return;

					data.$suggestions.empty().addClass('empty');
					$this.val( suggestion );

					$this.trigger('focus', false);
				}

                if ( typeof data.fnAfterSelect === 'function' ){
                    data.fnAfterSelect($this, data);
                }
			});
		},

		// Show the suggestions
		active: function(){

			return this.each( function(){

				var $this = $(this);
				var data = $this.data('sparkart_suggest');

                if ( typeof data.fnBeforeActive === 'function' ){
                    data.fnBeforeActive($this, data);
                }

				data.$suggestions.addClass('active');

                if ( typeof data.fnAfterActive === "function" ){
                    data.fnAfterActive($this, data);
                }

				$this.sparkartSuggest('update');

			});

		},

		// Hide the suggestions
		inactive: function(){

			return this.each( function(){

				var $this = $(this);
				var data = $this.data('sparkart_suggest');

                if ( typeof data.fnBeforeInactive === 'function' ){
                    data.fnBeforeInactive($this, data);
                }

				data.$suggestions.removeClass('active');

                if ( typeof data.fnAfterInactive === 'function' ){
                    data.fnAfterInactive($this, data);
                }

			});

		},

		// Destroy the plugin
		destroy: function(){

			var $this = $(this);
			var data = $this.data('sparkart_suggest');

            if ( typeof data.fnBeforeDestroy === 'function' ){
                data.fnBeforeDestroy($this, data);
            }

			data.$suggestions.remove();
			$this.off('.sparkart-suggest');
			$this.removeData('sparkart_suggest');

            if ( typeof data.fnAfterDestroy === 'function' ){
                data.fnAfterDestroy($this, data);
            }

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