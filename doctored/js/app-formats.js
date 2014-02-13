/*globals doctored, console, alert*/
(function(){
    "use strict";

    var $       = doctored.$ ,
        relaxng = {
            cache_useful_stuff_from_schema: function(){
                var this_function   = doctored.util.this_function,
                    schema_elements = $("element", this.schema.documentElement),
                    schema_element,
                    nodeName,
                    i;

                this.elements = {};
                for(i = 0; i < schema_elements.length; i++){
                    schema_element = schema_elements[i];
                    nodeName = schema_element.getAttribute("name");
                    if(nodeName){
                        if(this.inline_elements.indexOf(nodeName) >= 0) {
                            this.elements[nodeName] = {display:"inline"};
                        } else {
                            this.elements[nodeName] = {display:"block"};
                        }
                    }
                }

                this.schema_defines = {}; //cache some lookups
                schema_elements = $("define", this.schema.documentElement);
                for(i = 0; i < schema_elements.length; i++){
                    schema_element = schema_elements[i];
                    nodeName = schema_element.getAttribute("name");
                    if(nodeName){
                        this.schema_defines[nodeName] = schema_element;
                    }
                }

                this.schema_elements = {}; //cache some lookups
                schema_elements = $("element", this.schema.documentElement);
                for(i = 0; i < schema_elements.length; i++){
                    schema_element = schema_elements[i];
                    nodeName = schema_element.getAttribute("name");
                    if(nodeName){
                        this.schema_elements[nodeName] = schema_element;
                    }
                }

                this.cached_context = {};

                return this_function(this.update_element_chooser, this)();
            }
        },
        w3c_schema = {
            cache_useful_stuff_from_schema: function(){
                alert("W3C Schema isn't currently supported.");
            }
        },
        format_init = function(instance){
            var this_function  = doctored.util.this_function,
                file_extension = doctored.util.file_extension(this.schema_url),
                xhr;

            if(this.ready === true) return this_function(this.update_element_chooser, this)();
            this.instance = instance;
            switch(file_extension.toLowerCase()){
                case "rng":
                    this.cache_useful_stuff_from_schema = relaxng.cache_useful_stuff_from_schema;
                    break;
                case "xsd":
                    this.cache_useful_stuff_from_schema = w3c_schema.cache_useful_stuff_from_schema;
                    break;
                default:
                    return alert("Unable to use a schema '" + file_extension + "'. RelaxNG files must have extension .rng and W3C Schema files must have extension .xsd");
            }
            xhr = new XMLHttpRequest();
            xhr.open("GET", this.schema_url, true);
            xhr.send(null);
            xhr.onreadystatechange = this_function(function(){
                if(xhr.readyState !== 4) return;
                this.schema = xhr.responseXML;
                this_function(this.cache_useful_stuff_from_schema, this)();
                this_function(this.new_document, this)();
            }, this);
        },
        update_element_chooser = function(){
            var element_chooser = this.instance.dialog.element_chooser,
                html = '<option value="" disabled selected>Choose Element</option>' +
                       '<optgroup label="Suggested elements in this context">' + // if you update this be sure to also update the one below in set_element_chooser_context()
                       '<option value="" disabled class="doctored-loading">Loading...</option>' +
                       '</optgroup>' +
                       '<optgroup label="All (' + Object.keys(this.elements).length + ' elements)">' +
                       doctored.util.to_options_tags(this.elements, true) +
                       '</optgroup>' +
                       '<optgroup label="Custom Element">' +
                       '<option value="(custom)">Choose a custom element</option>' +
                       '</optgroup>';

            element_chooser.innerHTML = html;
            element_chooser.context_chooser = $("optgroup", element_chooser)[0];
        },
        new_document = function(){
            this.instance.root.innerHTML = doctored.util.convert_xml_to_doctored_html(this.new_document_xml, this.elements);
        },
        set_element_chooser_context = function(element_name){
            var _this = this,
                context_chooser = this.instance.dialog.element_chooser.context_chooser,
                element_chooser = this.instance.dialog.element_chooser,
                child_nodes_type_element,
                options = {},
                options_length,
                max_depth = 3,
                selector,
                gather_elements_below = function(nodes, depth){
                    var node,
                        i,
                        y,
                        child_elements,
                        child_element_name;
                    if(depth === undefined) depth = 0;
                    for(i = 0; i < nodes.length; i++){
                        node = nodes[i];
                        if(node.nodeName === "ref") node = _this.schema_defines[node.getAttribute("name")];
                        if(!node) {
                            console.log("Schema consistency error. Suspected 'ref[name=" + node.getAttribute("name") + "]' couldn't be resolved.");
                            continue;
                        }
                        child_elements = $("element", node);
                        for(y = 0; y < child_elements.length; y++){
                            child_element_name = child_elements[y].getAttribute("name");
                            options[child_element_name] = _this.elements[child_element_name];
                        }
                        if(depth <= max_depth) gather_elements_below($("ref", node), depth + 1);
                    }
                };

            if(element_name === this.previously_shown_context) return;
            if(!this.cached_context[element_name]) {
                gather_elements_below([this.schema_elements[element_name]]);
                this.cached_context[element_name] = options;
            } else {
                options = this.cached_context[element_name];
            }
            options_length = Object.keys(options).length;
            context_chooser.setAttribute("label", "Suggested under '" + element_name + "' (" + options_length + " elements)");
            if(options_length === 0) {
                element_chooser.context_chooser.innerHTML = '<option value="" disabled>(None)</option>';
            } else {
                element_chooser.context_chooser.innerHTML = doctored.util.to_options_tags(options, true);
            }
            this.previously_shown_context = element_name;
        };
        
        
        


    doctored.formats = {
        docbook: {
            name:              "DocBook 5",
            root_element:      "book",
            root_attributes:   {
                                    version: "5.0",
                                    xmlns: "http://docbook.org/ns/docbook",
                                    "xmlns:xlink": "http://wwww.w3.org/1999/xlink/"
                                },
            'schema_url':       window.doctored.base + "schemas/docbook5/schema.rng", // must end in .RNG
            'convert_from_html': function(html_string){
            // Typically called when people paste HTML and this is supposed to convert that to DocBook
            // this is just a prototype at the moment, not very useful
            // FIXME: improve this A LOT!
                var element_mapping   = {"p":    "para", "a": "ulink"},
                    attribute_mapping = {"href": "url"};
                return doctored.util.simple_transform(html_string, element_mapping, attribute_mapping);
            },
            new_document_xml: function(){
                return '<title>Book Title</title>' +
                       '<chapter><para>First paragraph <link url="http://docvert.org/">with hyperlink</link>.</para></chapter>';
            }(),
            parsed: false,
            init: format_init,
            update_element_chooser: update_element_chooser,
            set_element_chooser_context: set_element_chooser_context,
            new_document: new_document,
            inline_elements: ["anchor", "link"]
        },
        'tei': {
            name:              "TEI 2.6.0",
            root_element:      "TEI",
            root_attributes:   {
                xmlns: "http://www.tei-c.org/ns/1.0"
            },
            ready: false,
            init: format_init,
            update_element_chooser: update_element_chooser,
            set_element_chooser_context: set_element_chooser_context,
            new_document: new_document,
            'schema':  "../../schemas/tei2.6/schema.rng",
            new_document_xml: function(){
                return '<title>Book Title</title>' +
                       '<chapter><para>First paragraph <ulink url="http://docvert.org/">with hyperlink</ulink>.</para></chapter>';
            }()
        }
    };
}());