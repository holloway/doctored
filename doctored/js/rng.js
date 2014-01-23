/*global importScripts validateXML*/
(function(self){
	"use strict";

	//importScripts("shims.js");
	importScripts("../libs/xml.js/xmllint.js");

	var current_event,
		xml_file = "document.xml",
		rng_file = "schema.rng",
		schemas = {},
		console = {
					log: function(debug_string){
							if(!current_event) {
								current_event = {index:-1};
							}
							self.postMessage({
								type:    "debug",
								index:   current_event.index,
								message: debug_string
							});
                  }
				},
		sjax    = function sjax(url){ //synchronous http request
					var synchronous_request = new XMLHttpRequest();

					synchronous_request.open("GET", url, false);
					synchronous_request.send(null);
					return to_ncrs(synchronous_request.responseText);
				},
		to_ncrs  = function(input){
			var response = "",
				i,
				char_code;

			for(i = 0; i < input.toString().length; i++){
				char_code = input.charCodeAt(i);
				response += (char_code > 127) ? "&#" + char_code + ";" : input.charAt(i);
			}
			return response;
		},
		parse_xmllint_line = function(line, xml_file, schema_file){
			var response = {
					line_number: undefined,
					target:      undefined,
					message:     undefined,
					type:        undefined
				};
			if(line.substr(0, xml_file.length + 1) === xml_file + ":" && line.indexOf("Relax-NG validity error") !== -1) {
				response.type = "error_line";
				line = line.substr(xml_file.length + 1).trim();
				response.line_number = parseInt(line.substr(0, line.indexOf(":")), 10);
				line = line.substr(line.indexOf(":") + 1).trim();
				if(line.substr(0, "element ".length) === "element ") {
					line = line.substr("element ".length).trim();
					response.target = line.substr(0, line.indexOf(":"));
				} else {
					console.log(line);
				}
				line = line.substr(line.indexOf(":") + 1).trim();
				if(line.substr(0, "Relax-NG validity error :".length) === "Relax-NG validity error :"){
					line = line.substr("Relax-NG validity error :".length).trim();
				}
				response.message = line;
			} else if(line.substr(0, xml_file.length + 1) === xml_file + " " && line.indexOf("fails to validate") !== -1){
				response.type = "error_summary";
				response.message = line.substr(xml_file.length + 1);
			}
			return response;
		};

	self.onmessage = function(event){
		var module,
			xmllint_lines,
			xmllint_line,
			line,
			xmllint,
			i,
			error_lines = [],
			error_summary,
			success;
		
		current_event = event.data;

		if(!schemas[current_event.schema_url]){
			schemas[current_event.schema_url] = sjax(current_event.schema_url);
		}


		module = {
			"xml":       to_ncrs(current_event.xml),
			"schema":    schemas[current_event.schema_url],
			"arguments": ["--noout", "--relaxng", rng_file, xml_file]
		};

		xmllint_lines = validateXML(module).split("\n");

		for(i = 0; i < xmllint_lines.length; i++){
			xmllint_line = xmllint_lines[i];
			if(!xmllint_line.length) continue;
			line = parse_xmllint_line(xmllint_line, xml_file, rng_file);
			if(line["type"] === "error_line"){
				error_lines.push(line);
			} else if(line["type"] === "error_summary"){
				error_summary += line;
			} else {
				console.log("Unrecognised xmllint line: " + xmllint_line);
			}
		}

		self.postMessage({
			type:          "result",
			index:         current_event.index,
			result:        {
							error_lines:   error_lines,
							error_summary: error_summary
							}
		});
	};
}(self));

