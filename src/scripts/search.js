var $ = require('jquery');
require('bootstrapTypeahead');

$.fn.searchFactory = function( opts ) {
    // set options
    opts = opts || {};

    var defaults = {
        'textInput': '.search-form-text-input',
        'tags': [],
    }

    var options = {};
    var props = Object.getOwnPropertyNames(defaults);
    for (var i = 0, j = props.length; i < j; i++) {
        options[props[i]] = opts[props[i]] || defaults[props[i]];
    }
        
    // scope main vars
    var searchFile = false;

    // find elements
    var textInput = $(options.textInput);
    var form = textInput.parents('form');

    // disable form elements while we load data
    form.find('input,button').prop('disabled',true);

    $('script').each(function(){
        var test = $(this).attr('data-search-file');
        if(test && typeof test === 'string') {
            searchFile = test;
            return false;
        }
    });

    if(searchFile){
        // get JSON file and deserialize
        $.get(searchFile)
        .done(function(data){
            var searchData = data;
            textInput.typeahead({
                source: search(searchData),
                autoSelect: false
            });
            // enable form elements now data is prepped
            form.find('input,button').prop('disabled',false);
        })
        .fail(function(err){
            if (typeof console === 'object' && typeof console.error === 'function'){
                console.error(err);
            }
        });

    }

    function search(searchData){
        var search = [];
        var tags = {};
        for (var i = 0, j = searchData.length; i < j; i++) {
            search.push({
                index: [i],
                name: searchData[i].title
            })
            // add tags to array
            var t;
            for (var k = 0, l = options.tags.length; k < l; i++) {
                t = searchData[options.tags[i]];
                if(t && t.length) {
                    for (var m = 0, n = t.length; m < n; m++) {
                        var tagName = options.tags[i].toUpperCase();
                        tags[tagName] = tags[tagName] || [];
                        tags[tagName].push([i]);
                    }
                }
            }
        }
        for (tag in tags) {
            search.push({
                index: tags[tag],
                name: tag
            })
        }
        console.log('search', search);
        return search;
    }


     
};


