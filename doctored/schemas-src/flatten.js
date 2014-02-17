/*globals require, path, __dirname, console, process */
(function(){
    "use strict";
    // I'd normally use an XML parser but my Debian install is broken and NPM doesn't work
    // so this is all I can do for now

    var fs = require('fs'),
        path = require('path'),
        approot = path.dirname(__dirname),
        resolver = {},
        resolver_by_value = {},
        i,
        catalog,
        catalogues,
        catalog_path,
        catalog_path_directory,
        strip_comments = function(markup){
            return markup.replace(/<!--[\s\S]*?-->/g, '');
        },
        parse_attributes_string = function(attributes_string){
            var attributes_regex = /([\-A\-Z:a-zA-Z0-9_]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g, // originally via but tweaked to support xmlns http://ejohn.org/files/htmlparser.js
                attributes = {};

            attributes_string.replace(attributes_regex, function(match, name){
                var value = arguments[2] ? arguments[2] :
                                arguments[3] ? arguments[3] :
                                    arguments[4] ? arguments[4] : name;

                attributes[name] = value;
            });
            return attributes;
        },
        group_match = function(match){
            var group_string = match.replace(/>[\s\S]*$/g, '') + ">",
                group_attributes = parse_attributes_string(group_string),
                base = group_attributes['xml:base'];

            if(!resolver[base]) resolver[base] = {};

            match.replace(/<[\s\S]*?>/g, function(match){
                var element_name = match.substr(1, match.indexOf(" ") - 1),
                    attributes_string = match.substr(match.indexOf(" ")),
                    attributes = parse_attributes_string(attributes_string),
                    value = attributes.uri,
                    key;

                if(match.substr(0, 2) === "</") return;

                switch(element_name){
                    case "group":
                        //do nothing
                        break;
                    case "system":
                        key = attributes.systemId;
                        break;
                    case "uri":
                        key = attributes.name;
                        break;
                }
                if(key) {
                    if(!resolver[base][element_name]) resolver[base][element_name] = {};
                    if(!resolver_by_value[key]) resolver_by_value[key] = [];
                    resolver_by_value[key].push({base:base, value:value, element_name:element_name, key:key});
                    resolver[base][element_name][key] = value;
                } else if(element_name !== "group") {
                    console.log('Unable to determine key "' + key + '". ' + JSON.stringify(attributes) + " " + attributes_string);
                }
            });
        },
        xml_path,
        xml,
        resolve_includes = function(match){
            var key,
                attributes_string = match.substr(match.indexOf(" ")),
                attributes = parse_attributes_string(attributes_string),
                i,
                include_path,
                xml_directory = path.dirname(xml_path),
                resolver_item,
                response;

            if(resolver_by_value[attributes.schemaLocation]){
                for(i = 0; i < resolver_by_value[attributes.schemaLocation].length; i++) {
                    resolver_item = resolver_by_value[attributes.schemaLocation][i];
                    if(xml_path.indexOf(resolver_item.base) >= 0){
                        include_path = path.join(catalog_path_directory, resolver_item.base, resolver_item.value);
                    }
                }
                if(include_path === undefined) { //couldn't find a close match, try last match instead
                    include_path = path.join(catalog_path_directory, resolver_item.base, resolver_item.value);
                    //console.log("Unable to find base that matched xml_path\n" + xml_path + " in ", resolver_by_value[attributes.schemaLocation], (xml_path.indexOf(resolver_item.base) >= 0));
                    //process.exit();
                }
            } else {
               include_path = path.join(xml_directory, attributes.schemaLocation);
            }
            
            response = fs.readFileSync(include_path, 'utf8');
            response = response.replace(/<\?.*?\?>/g, '');
            response = response.replace(/<xs:schema[\s\S]*?>/g, '');
            response = response.replace(/<\/xs:schema[\s\S]*?>/g, '');
            return response;
        };

    if(process.argv.length < 4) {
        console.log("Usage:\nnode ./build.js dita1.8/catalog.xml dita1.8/base/xsd/basemap.xsd > ../schemas/dita1.8/schema.xsd");
        process.exit();
    }

    catalog_path = process.argv[2];
    catalog_path_directory = path.dirname(catalog_path);
    catalog = fs.readFileSync(catalog_path, 'utf8');
    catalog = strip_comments(catalog);
    catalog.replace(/<group[\s\S]*?group>/gm, group_match);
    //resolver now set

    xml_path = process.argv[3];
    xml = fs.readFileSync(xml_path, 'utf8');
    xml = strip_comments(xml);
    while(xml.match(/<xs:include/)){
        xml = xml.replace(/<xs:include[\s\S]*?\/>/g, resolve_includes);
    }
    console.log(xml); // so that people can pipe it to a file
}());