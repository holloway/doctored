/*globals doctored, console, alert*/
(function(){
    "use strict";

    var $ = doctored.$,
        relaxng = {
            extract_elements: function(){
                var this_function   = doctored.util.this_function,
                    schema_elements = this.schema.documentElement.getElementsByTagName("element"),
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
                return this_function(this.update_element_chooser, this)();
            }
        },
        w3c_schema = {
            extract_elements: function(){
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
                    this.extract_elements = relaxng.extract_elements;
                    break;
                case "xsd":
                    this.extract_elements = w3c_schema.extract_elements;
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
                this_function(this.extract_elements, this)();
                this_function(this.new_document, this)();
            }, this);
        },
        update_element_chooser = function(){
            var element_chooser = this.instance.dialog.element_chooser,
                html = '<option value="" disabled selected>Choose Element</option>' +
                       '<optgroup label="Valid elements in this context">' +
                       '<option value="" disabled class="doctored-loading">Loading...</option>' +
                       '</optgroup>' +
                       '<optgroup label="All Elements">' +
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
                max_depth = 1,
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
                        if(node.nodeName === "ref") node = $("define[name=" + node.getAttribute("name").replace(/\./g, "\\.") + "]", _this.schema)[0];
                        child_elements = $("element", node);
                        for(y = 0; y < child_elements.length; y++){
                            child_element_name = child_elements[y].getAttribute("name");
                            options[child_element_name] = _this.elements[child_element_name];
                        }
                        if(depth <= max_depth) gather_elements_below($("ref", node), depth + 1);
                    }
                };

            selector = "element[name=" + element_name + "]";
            gather_elements_below($(selector, this.schema));
            if(Object.keys(options).length === 0) {
                element_chooser.context_chooser.innerHTML = '<option value="" disabled>(None)</option>';
            } else {
                element_chooser.context_chooser.innerHTML = doctored.util.to_options_tags(options, true);
            }
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
            'schema_url':           "../../schemas/docbook5/schema.rng", // must end in .RNG
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