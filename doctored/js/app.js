/*globals doctored, alert, console, confirm*/
(function(){
    "use strict";

    doctored.event.on("app:ready", function(){
        doctored.ready = true;
    });

    var non_breaking_space = "\u00A0",
        defaults = {
            linting_debounce_milliseconds: 500,
            initial_placeholder_element:   "para",
            retry_init_after_milliseconds: 50,
            format:                        doctored.util.formats.docbook
        };

    doctored.init = function(selector, options){
        var root_element = document.querySelector(selector),
            instance,
            property;

        if(!root_element) return alert("Doctored.js is unable to find the element selected by: " + selector);

        options = options || {};
        for (property in defaults) {
            if (options.hasOwnProperty(property)) continue;
            options[property] = defaults[property];
        }

        instance = {
            root: root_element,
            root_selector: selector,
            cache: {},
            lint: function(){
                var xml = this.options.format.root_start_tag + doctored.util.descend_building_xml(this.root.childNodes) + this.options.format.root_close_tag;

                doctored.linters.lint(xml, this.options.format.schema, instance.lint_response, instance);
            },
            lint_response: function(errors){
                var by_line = {},
                    error_line,
                    child_node,
                    line_number,
                    i,
                    error,
                    format_errors = function(line_errors){
                        var i,
                            error_string = "";
                        for(i = 0; i < line_errors.length; i++){
                            error_string += line_errors[i].message + ". ";
                        }
                        return error_string;
                    };

                for(i = 0; i < errors.error_lines.length; i++){
                    error_line = errors.error_lines[i];
                    if(by_line[error_line.line_number] === undefined) {
                        by_line[error_line.line_number] = [];
                    }
                    by_line[error_line.line_number].push(error_line);
                }
                for(i = 0; i < this.root.childNodes.length; i++){
                    child_node = this.root.childNodes[i];
                    line_number = i + 1;
                    if(by_line[line_number]) {
                        child_node.setAttribute("data-error", format_errors(by_line[line_number]));
                        child_node.classList.add("has_errors");
                        child_node.classList.remove("hide_errors");
                    } else {
                        child_node.setAttribute("data-error", "");
                        child_node.classList.remove("has_errors");
                        child_node.classList.add("hide_errors");
                    }
                }
            },
            paste: function(event){
                var html = doctored.util.get_clipboard_xml_as_html_string(event.clipboardData),
                    instance = doctored.util.get_instance_from_root_element(this), //because `this` is the root element, not the instance, due to this function being a browser event callback.
                    doctored_html;

                if(instance && instance.options.format.convert_from_html && doctored.util.looks_like_html(html)) {
                    event.returnValue = false;
                    setTimeout(function(){ //for some reason in Chrome it runs confirm twice when it's not in a setTimeout. Odd, suspected browser bug.
                        if(confirm("That looks like HTML - want to convert it to " + instance.options.format.name + "?")) {
                            html = instance.options.format.convert_from_html(html);
                        }
                        doctored_html = doctored.util.convert_html_to_doctored_html(html);
                        doctored.util.insert_html_at_cursor_position(doctored_html, event);
                    }, 0);
                    return;
                }
                doctored_html = doctored.util.convert_html_to_doctored_html(html);
                doctored.util.insert_html_at_cursor_position(doctored_html, event);
            },
            options: options,
            init: function(){
                var default_content,
                    _this = this;

                if(!doctored.ready) {
                    if(this.cache.init_timer) clearTimeout(this.cache.init_timer);
                    this.cache.init_timer = setTimeout( function(){ _this.init(); }, this.options.retry_init_after_milliseconds);
                    return;
                }

                default_content = document.createElement("div");
                default_content.setAttribute("data-element", this.options.initial_placeholder_element);
                default_content.classList.add("block");
                default_content.appendChild(document.createTextNode(non_breaking_space));
                this.root.contentEditable = true;
                this.root.classList.add("doctored");
                this.root.appendChild(default_content);
                this.root.addEventListener("input",   doctored.util.debounce(_this.lint, _this.options.linting_debounce_milliseconds, _this), false);
                this.root.addEventListener('paste',   this.paste, false);
                this.root.addEventListener('click',   this.click_element, false);
                this.root.addEventListener('keydown', this.keydown_element, false);
                this.root.addEventListener('keyup',   this.keyup_element, false);
                this.root.addEventListener('mouseup', this.mouseup, false);
                if(console && console.log) console.log("Doctored.js: Initialized editor " + this.root_selector + "!");
            }
        };
        instance.init();
        doctored.instances = doctored.instances || [];
        doctored.instances.push(instance);
        return instance;
    };
}());
