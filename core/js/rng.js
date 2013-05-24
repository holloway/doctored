/*global importScripts validateXML*/
(function(self){
	"use strict";

	importScripts('../libs/xml.js/xmllint.js');

	if(!String.prototype.trim) { // thanks to http://stackoverflow.com/a/8522376
		String.prototype.trim = function(){
			return this.replace(/^\s+|\s+$/g,'');
		};
	}

	function debug(message){
		self.postMessage({"debug": message});
	}

	function synchronous_get_file(url){
		var AJAX = new XMLHttpRequest(),
			responseText,
			responseXml = "",
			index,
			charCode;
		AJAX.open("GET", url, false);
		AJAX.send(null);
		responseText = AJAX.responseText;
		for(index = 0; index < responseText.length; index++){
			charCode = responseText.charCodeAt(index);
			responseXml += (charCode > 127) ? "&#"+charCode+";" : responseText.charAt(index);
		}
		return responseXml;
	}

	function parse_xmllint_line(line, xml_file, schema_file){
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
				debug(line);
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
	}

	var schemas = {};

	self.onmessage = function(event) {
		var message = event.data,
			module,
			xmllint_lines,
			xmllint_line,
			line,
			xmllint,
			i,
			xml_file = "document.xml",
			rng_file = "schema.rng",
			error_lines = [],
			error_summary,
			success;
		
		if(!schemas[message.schema_url]){
			schemas[message.schema_url] = synchronous_get_file(message.schema_url);
		}
		
		module = {
			"xml": message.xml,
			"schema": schemas[message.schema_url],
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
				error_summary = line;
			} else {
				debug(xmllint_line);
			}
		}

		self.postMessage({
			error_lines: error_lines,
			error_summary:error_summary,
			success: success
		});
	};
}(self));

