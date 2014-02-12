/*globals doctored, console*/
(function(){
    "use strict";

    var format_init = function(){
        if(this.ready === true) return;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", this.schema_url, true);
        xhr.send(null);
        xhr.onreadystatechange = function(){
            if (xhr.readyState !== 4) return;
            this.schema = xhr.responseXml;
        };
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
            'schema_url':           "../../schemas/docbook5/schema.rng",
            'convert_from_html': function(html_string){
            // Typically called when people paste HTML and this is supposed to convert that to DocBook
            // this is just a prototype at the moment, not very useful
            // FIXME: improve this A LOT!
                var element_mapping   = {"p":    "para", "a": "ulink"},
                    attribute_mapping = {"href": "url"};
                return doctored.util.simple_transform(html_string, element_mapping, attribute_mapping);
            },
            get_new_document: function(){
                return '<title>Book Title</title>' +
                       '<chapter><para>First paragraph <ulink url="http://docvert.org/">with hyperlink</ulink>.</para></chapter>';
            },
            ready: false,
            init: format_init,
            inline_elements: ["anchor", "ulink"]
        },
        'tei': {
            name:              "TEI 2.6.0",
            root_element:      "TEI",
            root_attributes:   {
                xmlns: "http://www.tei-c.org/ns/1.0"
            },
            ready: false,
            init: format_init,
            'schema':  "../../schemas/tei2.6/schema.rng",
            get_new_document: function(){
                return '<title>Book Title</title>' +
                       '<chapter><para>First paragraph <ulink url="http://docvert.org/">with hyperlink</ulink>.</para></chapter>';
            }
        }
    };
}());