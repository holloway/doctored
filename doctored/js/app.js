/*globals doctored, alert, console, confirm, $*/
(function(){
    "use strict";

    var defaults = {
            autosave_every_milliseconds:      30 * 1000,
            linting_debounce_milliseconds:    1000,
            retry_init_after_milliseconds:    50,
            format:                           "docbook" //key from doctored.formats in app-formats.js
        },
        head = document.getElementsByTagName('head')[0],
        body = document.getElementsByTagName('body')[0];

    doctored.event.on("app:ready", function(){
        var i,
            instance;

        doctored.ready = true;
        for(i = 0; i < doctored._to_be_initialized.length; i++){
            instance = doctored._to_be_initialized[i];
            doctored._init(instance.selector, instance.options);
        }
    });

    doctored._init = function(selector, options){
        var root_element = document.querySelector(selector),
            instance,
            property;

        if(!root_element) return console.log("Doctored.js: Unable to find the element selected by: " + selector);
        if (typeof defaults.format === 'string' || defaults.format instanceof String) defaults.format = doctored.formats[defaults.format];

        options = options || {};
        for (property in defaults) {
            if (options.hasOwnProperty(property)) continue;
            options[property] = defaults[property];
        }

        instance = {
            doctored: 0.6,
            root: root_element,
            root_selector: selector,
            cache: {},
            lint: function(){
                doctored.linters.lint(this.get_xml_string(),
                                      this.options.format.schema,
                                      this.lint_response,
                                      instance);
            },
            lint_response: function(errors){
                var by_line = doctored.util.lint_response(errors, this.root.childNodes.length),
                    i,
                    child_node,
                    line_number = 0;

                for(i = 0; i < this.root.childNodes.length; i++){
                    child_node = this.root.childNodes[i];
                    if(child_node.nodeType === Node.ELEMENT_NODE){ //ignore text nodes etc
                        line_number += 1;
                        if(by_line[line_number]) {
                            child_node.setAttribute("data-error", doctored.util.format_lint_errors(by_line[line_number]));
                            child_node.classList.add("has_errors");
                            child_node.classList.remove("hide_errors");
                        } else {
                            child_node.setAttribute("data-error", "");
                            child_node.classList.remove("has_errors");
                            child_node.classList.add("hide_errors");
                        }
                    }
                }
                if(errors && errors.error_lines && errors.error_lines.length === 0) {
                    this.root.classList.add("valid");
                    this.root.classList.remove("invalid");
                } else {
                    this.root.classList.add("invalid");
                    this.root.classList.remove("valid");
                }
            },
            get_xml_string: function(){
                return this.options.format.root_start + "\n" + doctored.util.descend_building_xml(this.root.childNodes) + this.options.format.root_end;
            },
            save: function(event){
                var instance,
                    localStorage_key,
                    xml;

                instance = doctored.util.get_instance_from_root_element(this);
                localStorage_key = instance.options.localStorage_key;
                window.localStorage.setItem(localStorage_key, instance.get_xml_string());
            },
            paste: function(event){
                var html = doctored.util.get_clipboard_xml_as_html_string(event.clipboardData),
                    instance = doctored.util.get_instance_from_root_element(this),
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
                doctored_html = doctored.util.convert_xml_to_doctored_html(html);
                doctored.util.insert_html_at_cursor_position(doctored_html, event);
            },
            mouseup: function(event){
                var instance = doctored.util.get_instance_from_root_element(this),
                    browser_selection = window.getSelection() || document.getSelection() || (document.selection ? document.selection.createRange() : null),
                    new_doctored_selection;

                doctored.util.remove_old_selection(instance.cache.selection, instance);
                if (browser_selection.rangeCount) {
                    new_doctored_selection = doctored.util.surround_selection_with_element("div", "doctored-selection", instance, browser_selection);
                    if(new_doctored_selection && new_doctored_selection.parentNode) { //if it's attached to the page
                        doctored.util.display_dialog_around_inline(new_doctored_selection, instance.dialog);
                    }
                }
            },
            promote_selection_to_element: function(event){
                var instance = doctored.util.get_instance_from_root_element(this),
                    option,
                    option_value;

                if(!instance.cache.selection || !instance.cache.selection.classList.contains("doctored-selection")) return;
                instance.cache.selection.classList.remove("doctored-selection");
                option = instance.dialog.select.options[instance.dialog.select.selectedIndex];
                option_value = option.getAttribute("value");
                if(option_value.length === 0) return;
                instance.cache.selection.classList.add(option_value);
                instance.cache.selection.setAttribute("data-element", option.innerText);
                instance.dialog.style.display = "none";
                instance.dialog.select.selectedIndex = 0;
            },
            properties: function(event){
                event.preventDefault();
            },
            view_source: function(event){
                var instance = doctored.util.get_instance_from_root_element(this),
                    xml      = instance.get_xml_string(),
                    textarea = document.createElement('textarea');

                textarea.classList.add("doctored-view-source-textbox");
                textarea.innerHTML = xml;
                body.appendChild(textarea);
                textarea.focus();
                textarea.addEventListener('blur', function(){
                    var xml = this.value;
                    xml = xml.substr(xml.indexOf("\n") + 1);
                    xml = xml.substr(0, xml.lastIndexOf("\n"));
                    instance.root.innerHTML = doctored.util.convert_xml_to_doctored_html(xml, instance.options.format.elements);
                    if(this && this.parentNode) {
                        try {
                            this.parentNode.removeChild(this); //FIXME: this try/catch is to work around DOM errors where the node doesn't exist despite the if() check. Investigate later.
                        }catch(exception){}
                    }}, false);
                event.preventDefault();
            },
            download: function(event){
                var instance = doctored.util.get_instance_from_root_element(this),
                    xml      = instance.get_xml_string(),
                    filename = instance.root_selector.replace(/[#-]/g, "").replace(/\s/g, "") + xml.replace(/<[^>]*?>/g, "").replace(/\s/g, "");

                if(filename.length > 10) filename = filename.substr(0, 10);
                else if(filename.length < 4) filename = "download";
                filename += ".xml";
                event.preventDefault();
                doctored.util.offer_download(xml, filename);
            },
            mousemove: function(event){
                var x = event.x,
                    y = event.y,
                    instance = doctored.util.get_instance_from_root_element(this),
                    target   = event.toElement || event.target || document.elementFromPoint(x, y),
                    target_offset = target.getBoundingClientRect(),
                    cursor = "auto";

                if(!target) return;
                if(target.classList.contains("inline")       && y > target_offset.top  - doctored.CONSTANTS.inline_label_height_in_pixels + target.offsetHeight) {
                    cursor = "pointer";
                } else if(target.classList.contains("block") && x < target_offset.left + doctored.CONSTANTS.block_label_width_in_pixels) {
                    cursor = "pointer";
                }
                instance.root.style.cursor = cursor;
            },
            options: options,
            init: function(){
                var _this = this,
                    menu,
                    i,
                    lint = doctored.util.debounce(_this.lint, _this.options.linting_debounce_milliseconds, _this);

                this.root.innerHTML = doctored.util.convert_xml_to_doctored_html(_this.options.format.get_new_document(), this.options.format.elements);
                this.root.contentEditable = true;
                this.root.className = "doctored";
                this.root.addEventListener("input",     lint, false);
                this.root.addEventListener('paste',     this.paste, false);
                this.root.addEventListener('click',     this.click_element, false);
                this.root.addEventListener('keydown',   this.keydown_element, false);
                this.root.addEventListener('keyup',     this.keyup_element, false);
                this.root.addEventListener('mouseup',   this.mouseup, false);
                this.root.addEventListener('touchend',  this.mouseup, false);
                this.root.addEventListener('mousemove', this.mousemove, false);
                this.menu = document.createElement('menu');
                this.menu.className = "doctored-menu";
                this.dialog = document.createElement('menu');
                this.dialog.className = "doctored-dialog";
                this.dialog.innerHTML = '<select><option value="">Choose Element</option>' + doctored.util.to_options_tags(this.options.format.elements) + "</select>";
                this.dialog.select = this.dialog.getElementsByTagName('select')[0];
                this.dialog.select.addEventListener('change', this.promote_selection_to_element, false);
                this.menu.innerHTML = '<a class="doctored-properties" href="">Properties</a><a class="doctored-view-source" href="">View Source</a><a class="doctored-download" href="">Download</a>';
                this.menu.properties_button = this.menu.getElementsByClassName("doctored-properties")[0];
                this.menu.properties_button.addEventListener('click', this.properties, false);
                this.menu.download = this.menu.getElementsByClassName("doctored-download")[0];
                this.menu.download.addEventListener('click', this.download, false);
                this.menu.view_source = this.menu.getElementsByClassName("doctored-view-source")[0];
                this.menu.view_source.addEventListener('click', this.view_source, false);
                this.properties = document.createElement('menu');
                this.properties.className = "doctored-properties";
                this.properties.innerHTML = '<label><span>Root:</span><select><option>Choose Element</option>' + doctored.util.to_options_tags(this.options.format.elements) + '</select></label>';
                this.properties.select = this.properties.getElementsByTagName('select')[0];
                this.options.localStorage_key = this.options.localStorage_key || this.root_selector.replace(/[#-]/g, "").replace(/\s/g, "");
                this.root.parentNode.insertBefore(this.menu, this.root);
                this.root.parentNode.insertBefore(this.dialog, this.root.previousSibling);
                this.root.parentNode.insertBefore(this.properties, this.root.previousSibling.previousSibling);
                if(window.localStorage) {
                    this.save_timer = setInterval(function(){ _this.save.apply(_this); }, this.options.autosave_every_milliseconds);
                }
                if(console && console.log) console.log("Doctored.js: Initialized editor " + this.root_selector + "!");
                lint();
            }
        };
        instance.init();
        doctored.instances = doctored.instances || [];
        doctored.instances.push(instance);
        return instance;
    };

    doctored.CONSTANTS = {
        inline_label_height_in_pixels: 10,
        block_label_width_in_pixels:   25
    };
}());