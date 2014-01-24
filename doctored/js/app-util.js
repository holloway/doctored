/*globals doctored, Node, alert*/
(function(){
	"use strict";

    doctored.util = {
        debounce: function(fn, delay_in_milliseconds, context) {
            var timer = null;
            context = context || this;
            return function(){
                var args = arguments;
                clearTimeout(timer);
                timer = setTimeout(
                            function(){ fn.apply(context, args); },
                            delay_in_milliseconds
                        );
            };
        },
        increment_but_wrap_at: function(current_value, wrap_at, increment_by){
            var amount = increment_by || 1;

            current_value += amount;
            if(current_value >= wrap_at) current_value = 0;
            return current_value;
        },
        display_types: {
            block: "block",
            inline: "inline-block",
            table: "table",
            row: "row",
            cell: "cell",
            root: "root"
        },
        sniff_display_type: function(node){
            if(!node) return;
            var className;
            switch(node.nodeType){
                case node.TEXT_NODE:
                    return Node.TEXT_NODE;
                case node.ELEMENT_NODE:
                    className = " " + node.className + " ";
                    if(       / block / .test(className)){
                        return doctored.util.display_types.block;
                    } else if(/ inline /.test(className) || / inline-block /.test(className)){
                        return doctored.util.display_types.inline;
                    } else if(/ table / .test(className)){
                        return doctored.util.display_types.table;
                    } else if(/ row /   .test(className)){
                        return doctored.util.display_types.row;
                    } else if(/ cell /  .test(className)){
                        return doctored.util.display_types.cell;
                    } else if(/ selection /  .test(className)){
                        return doctored.util.display_types.text_selection;
                    } else if(/ doctored /  .test(className)){
                        return doctored.util.display_types.root;
                    }

                    return alert("Unknown element type. className was " + className);
            }
            alert("Unknown element type. nodeName was " + node.nodeName);
        },
        descend_building_xml: function(nodes, depth){
            var i,
                node,
                xml_string = "",
                data_element,
                text_node,
                display_type;
            
            if(depth === undefined) depth = 0;

            for(i = 0; i < nodes.length; i++){
                node = nodes[i];
                switch(node.nodeType){
                    case Node.ELEMENT_NODE:
                        data_element = node.getAttribute("data-element");
                        if(!data_element) continue;
                        display_type =doctored.util.sniff_display_type(node);
                        if(display_type === doctored.util.display_types.block){
                            xml_string += "\n";
                        }
                        xml_string += "<" + data_element;
                        xml_string += doctored.util.build_xml_attributes_from_json_string(node.getAttribute("data-attributes"));
                        xml_string += ">";
                        if (node.hasChildNodes()) {
                            xml_string += doctored.util.descend_building_xml(node.childNodes, depth+1);
                        }
                        xml_string += "</" + data_element + ">";
                        if(depth === 0 && display_type === doctored.util.display_types.block){
                            xml_string += "\n";
                        }
                        break;
                    case Node.TEXT_NODE:
                        text_node = node.innerHTML || node.textContent || node.innerText;
                        if(text_node === undefined) break;
                        xml_string += text_node.replace(/[\n]/g, " ");
                        break;
                }
            }
            return xml_string;
        },
        build_xml_attributes_from_json_string: function(json_string){
            var attributes,
                attributes_string = "",
                key;
            if(!json_string || json_string.length === 0) return "";
            attributes = JSON.parse(json_string);
            for(key in attributes) {
                attributes_string += " " + key.toString() + "=\"" + attributes[key] + "\"";
            }
            return attributes_string;
        }
    };

}());