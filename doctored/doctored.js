/*globals alert*/

(function(){
    "use strict";

    window.doctored = {
        event: {
            bindings: {},
            on: function(name, callback){
                var bindings = window.doctored.event.bindings;
                if(bindings[name] === undefined) bindings[name] = [];
                bindings[name].push(callback);
            },
            off: function(name, callback){
                var bindings = window.doctored.event.bindings,
                    callback_string = callback.toString(),
                    i;
                if(bindings[name] === undefined) return;
                for(i = bindings[name].length; i > 0; i--){
                    if(callback_string == bindings[name][i].toString()){
                        bindings[name].splice(i, 1);
                    }
                }
            },
            trigger: function(name){
                var bindings = window.doctored.event.bindings,
                    i;
                if(bindings[name] === undefined) return;
                for(i = 0; i < bindings[name].length; i++){
                    setTimeout(bindings[name][i], 0); //go on async stack, don't execute immediately
                }
            }
        },
        _to_be_initialized: [],
        init: function(selector, options){
            window.doctored._to_be_initialized.push({selector: selector, options: options});
        }
    };

    var head           = document.getElementsByTagName('head'),
        body           = document.getElementsByTagName('body'),
        scripts        = Array.prototype.slice.call(document.getElementsByTagName('script')),
        this_script    = scripts[scripts.length-1],
        manifest       = {
                         "js" : ["js/app-linters.js", "js/app-util.js", "js/app-formats.js", "js/app.js", "js/shims.js", "libs/filesaver.js/FileSaver.js"],
                         "css": ["css/screen.css"]
                         },
        manifest_count = manifest.js.length + manifest.css.length,
        manifest_load  = function(){
                            manifest_count--;
                            if(manifest_count === 0) window.doctored.event.trigger("app:ready");
                          },
        i,
        new_element;

    if(head.length !== 1 || body.length !== 1) return alert("Error: Doctored.js must be included at the end of the <body> tag. This may change if enough people complain.");

    head = head[0];
    body = body[0];

    window.doctored.base = this_script.src.substr(0, this_script.src.lastIndexOf("/") + 1);

    //TODO: allow people to override manifest locations when their URLs are mangled via a CDN or something.
    //      because this is unusual we shouldn't optimise for this ... I guess this should probably be
    //      done by have a <script> preceding this one that sets the new URLs.

    for(i = 0; i < manifest.js.length; i++){
        new_element = document.createElement("script");
        new_element.setAttribute("src", window.doctored.base + manifest.js[i]);
        new_element.addEventListener("load", manifest_load, false);
        body.appendChild(new_element);
    }

    for(i = 0; i < manifest.css.length; i++){
        new_element = document.createElement("link");
        new_element.setAttribute("rel", "stylesheet");
        new_element.setAttribute("href", window.doctored.base + manifest.css[i]);
        new_element.addEventListener("load", manifest_load, false);
        head.appendChild(new_element);
    }

}());