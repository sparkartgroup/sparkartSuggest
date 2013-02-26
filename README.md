# sparkartSuggest

jQuery plugin for suggesting results in text inputs.

## Usage

In order to use sparkartSuggest you'll need to include jQuery, jquery.sparkartSuggest.js, and jquery.sparkartSuggest.css.

**A basic suggest input**

```html
<input id="suggestive" type="text" value="javascript,jquery" />
<script>
	$('#suggestive').sparkartSuggest({
		source: ['java','javascript','java beans','java the country','java strikes back']
	});
</script>
```

## Configuration

* **source** - *(array,function)* - An array of strings to use as suggestions. Alternatively, a function that returns a list of suggestions. An example source function:

```javascript
function( string, options, callback ){
	$.getJSON( '/suggestions?q='+ string, function( suggestions ){
		callback( suggestions );
	});
}
```
* **threshold** - *(integer)* - The number of characters that must be typed before suggestions start to appear. Defaults to `2`.
* **max** - *(integer)* - The maximum number of suggestions to show. Defaults to `8`.
* **delay** - *(integer)* - How long (in milliseconds) the plugin waits before loading suggestions. Defaults to `150`.
* **disableDefaultAutocomplete** - *(boolean)* - Many browsers have a built-in autocomplete option that can interfere with this plugin, this will attempt to disable that.  Defaults to `true`.
* **sorter** - *(function)* - A function used to sort returned results. This is the default sorter:

```javascript
function( a, b ){
	return ( a < b )? -1: ( a > b )? 1: 0;
}
```
* **comparator** - *(function)* - A function used to determine which strings match. This is the default comparator:

```javascript
function( source, string ){
	// http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex#answer-6969486
	var regex_safe_string = string.replace( /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&' );
	var regex = new RegExp( '^'+ regex_safe_string, 'i' );
	return regex.test( source ) && string !== source;
}
```

## License

MIT License.

----------

Copyright © 2012 Sparkart Group, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
