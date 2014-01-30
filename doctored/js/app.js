/*globals doctored, alert, console, confirm, $*/
(function(){
    "use strict";

    doctored.event.on("app:ready", function(){
        var i,
            instance;

        doctored.ready = true;
        for(i = 0; i < doctored._to_be_initialized.length; i++){
            instance = doctored._to_be_initialized[i];
            doctored._init(instance.selector, instance.options);
        }
    });

    var non_breaking_space = "\u00A0",
        defaults = {
            autosave_every_milliseconds:   30 * 1000,
            linting_debounce_milliseconds: 500,
            retry_init_after_milliseconds: 50,
            initial_placeholder_element:   "para",
            format:                        "docbook" //key from doctored.util.formats
        },
        head = document.getElementsByTagName('head')[0],
        body = document.getElementsByTagName('body')[0];

    doctored._init = function(selector, options){
        var root_element = document.querySelector(selector),
            instance,
            property;

        if(!root_element) return alert("Doctored.js is unable to find the element selected by: " + selector);
        if (typeof defaults.format === 'string' || defaults.format instanceof String) defaults.format = doctored.util.formats[defaults.format];

        options = options || {};
        for (property in defaults) {
            if (options.hasOwnProperty(property)) continue;
            options[property] = defaults[property];
        }

        instance = {
            doctored: 0.5,
            root: root_element,
            root_selector: selector,
            cache: {},
            lint: function(){
                var xml = this.get_xml_string();

                doctored.linters.lint(xml, this.options.format.schema, instance.lint_response, instance);
            },
            get_xml_string: function(){
                return this.options.format.root_start_tag + doctored.util.descend_building_xml(this.root.childNodes) + this.options.format.root_close_tag;
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
            save: function(event){
                var instance,
                    localStorage_key,
                    xml;

                instance = doctored.util.get_instance_from_root_element(this); //because `this` is the root element, not the instance, due to this function being a browser event callback.
                localStorage_key = instance.options.localStorage_key;
                window.localStorage.setItem(localStorage_key, instance.get_xml_string());
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
            mouseup: function(event){
                var instance = doctored.util.get_instance_from_root_element(this),
                    selection_elements = instance.root.getElementsByClassName("doctored-selection"),
                    highlight_text = function(){
                        
                        var element = document.createElement('div');
                        element.className = "doctored-selection";
                        var selection = window.getSelection() || document.getSelection() || (document.selection ? document.selection.createRange() : null);
                        if (selection.rangeCount) {
                                var range = selection.getRangeAt(0).cloneRange();
                                if(range.toString().length === 0) return;
                                range.surroundContents(element);
                                selection.removeAllRanges();
                                selection.addRange(range);
                                selection.removeAllRanges();
                        }
                        
                    };

                setTimeout(highlight_text, 0);
            },
            selectionstart: function(event){
                //wot?
            },
            element_picker: function(target){
                var $target = $(target),
                    offset  = $target.inlineOffset(); //todo replace with plain javascript

                this.dialog.style.left = offset.left + "px";
                this.dialog.style.top  = offset.top  + "px";
                this.dialog.style.display = "block";
            },
            view_source: function(event){
                var instance = doctored.util.get_instance_from_root_element(this),
                    xml      = instance.get_xml_string(),
                    textarea = document.createElement('textarea');

                event.preventDefault();
                textarea.readOnly = true;
                textarea.classList.add("doctored-view-source-textbox");
                textarea.innerHTML = xml;
                body.appendChild(textarea);
                textarea.focus();
                textarea.addEventListener('blur', function(){ this.parentNode.removeChild(this); }, false);
            },
            download: function(event){
                var instance = doctored.util.get_instance_from_root_element(this),
                    xml      = instance.get_xml_string(),
                    filename = instance.root_selector.replace(/[#-]/g, "").replace(/\s/g, "") + xml.replace(/<[^>]*?>/g, "").replace(/\s/g, "");

                event.preventDefault();
                if(filename.length > 10) {
                    filename = filename.substr(0, 10);
                } else if(filename.length < 4) {
                    filename = "download";
                }
                filename += ".xml";
                doctored.util.offer_download(xml, filename);
            },
            options: options,
            init: function(){
                var default_content,
                    _this = this,
                    menu;

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
                this.root.addEventListener('touchend', this.mouseup, false);
                this.root.addEventListener('selectstart', this.selectionstart, false);
                this.menu = document.createElement('menu');
                this.menu.classList.add("doctored-menu");
                this.dialog = document.createElement('menu');
                this.dialog.classList.add("doctored-dialog");
                this.dialog.innerHTML = "<select>" + doctored.util.to_options_tags(this.options.format.get_elements()) + "</select>";
                this.menu.innerHTML = "<a class=\"doctored-download\" href=\"\">Download</a><a class=\"doctored-view-source\" href=\"\">View Source</a>";
                this.menu.download = this.menu.getElementsByClassName("doctored-download")[0];
                this.menu.download.addEventListener('click', this.download, false);
                this.menu.view_source = this.menu.getElementsByClassName("doctored-view-source")[0];
                this.menu.view_source.addEventListener('click', this.view_source, false);
                this.options.localStorage_key = this.options.localStorage_key || this.root_selector.replace(/[#-]/g, "").replace(/\s/g, "");
                this.root.parentNode.insertBefore(this.menu, this.root);
                this.root.parentNode.insertBefore(this.dialog, this.root);
                if(window.localStorage) {
                    this.save_timer = setInterval(function(){ _this.save.apply(_this); }, this.options.autosave_every_milliseconds);
                }
                if(console && console.log) console.log("Doctored.js: Initialized editor " + this.root_selector + "!");
            }
        };
        instance.init();
        doctored.instances = doctored.instances || [];
        doctored.instances.push(instance);
        return instance;
    };
}());
