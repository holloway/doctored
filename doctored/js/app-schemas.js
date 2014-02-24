/*globals doctored, console, alert*/

(function(){
    "use strict";
    // DO NOT EDIT THE FOLLOWING
    // it is dynamically inserted by schemas/rebuild-schema-manifest.js
    // {MANIFEST-START}
    doctored.schemas_manifest = [{"schema_family":"DITA","children":[{"schema_family":"1.8","children":[{"schema":"/DITA/1.8/DITA Base.xsd","label":"DITA Base","schema_family":"dita"},{"schema":"/DITA/1.8/DITA Bookmap.xsd","label":"DITA Bookmap","schema_family":"dita"},{"schema":"/DITA/1.8/DITA Topic.xsd","label":"DITA Topic","schema_family":"dita"}]}]},{"schema_family":"DocBook","children":[{"schema":"/DocBook/DocBook 5.0.rng","label":"DocBook 5.0","schema_family":"docbook"}]},{"schema_family":"MARC","children":[{"schema":"/MARC/MARC21.xsd","label":"MARC21","schema_family":"marc"}]},{"schema_family":"TEI","children":[{"schema":"/TEI/TEI 2.6.rng","label":"TEI 2.6","schema_family":"tei"}]},{"schema_family":"TeXML","children":[{"schema":"/TeXML/texml.rng","label":"texml","schema_family":"texml"}]}];
    // {MANIFEST-END}
    // DO NOT EDIT THE PRECEDING
}());

(function(){
    "use strict";

    doctored.schemas = {
        list: doctored.schemas_manifest,
        get_schema_instance: function(instance, schema_family_id, schema_url){
            var schema_family = doctored.schema_family[schema_family_id],
                this_function = doctored.util.this_function;

            if(!schema_family) return alert("There is no support for the schema family of '" + schema_family_id + "' requested by " + schema_url + "'s config file.");
            return doctored.util.simple_map_clone(schema_family);
        }
    };

    var $ = doctored.$,
        relaxng = {
            cache_useful_stuff_from_schema: function(){
                var this_function   = doctored.util.this_function,
                    schema_elements,
                    schema_element,
                    schema_element_help,
                    node_attribute_name,
                    block_or_inline,
                    i;

                this.elements = {};
                this.schema_elements = {}; //cache some lookups
                schema_elements = $("element", this.schema.documentElement);
                for(i = 0; i < schema_elements.length; i++){
                    schema_element = schema_elements[i];
                    node_attribute_name = schema_element.getAttribute("name");
                    if(node_attribute_name){
                        schema_element_help = $("documentation", schema_element)[0];
                        block_or_inline = (this.inline_elements && this.inline_elements.indexOf(node_attribute_name) >= 0) ? "inline" : "block";
                        this.elements[node_attribute_name] = {
                            display: block_or_inline,
                            help: schema_element_help ? schema_element_help.textContent : ""
                        };
                        this.schema_elements[node_attribute_name] = schema_element;
                    }
                }

                this.attributes = {};
                schema_elements = $("attribute", this.schema.documentElement);
                for(i = 0; i < schema_elements.length; i++){
                    schema_element = schema_elements[i];
                    node_attribute_name = schema_element.getAttribute("name");
                    if(node_attribute_name){
                        schema_element_help = $("documentation", schema_element)[0];
                        this.attributes[node_attribute_name] = {help: schema_element_help ? schema_element_help.textContent : ""};
                    }
                }

                this.schema_defines = {}; //cache some lookups
                schema_elements = $("define", this.schema.documentElement);
                for(i = 0; i < schema_elements.length; i++){
                    schema_element = schema_elements[i];
                    node_attribute_name = schema_element.getAttribute("name");
                    if(node_attribute_name){
                        this.schema_defines[node_attribute_name] = schema_element;
                    }
                }
                this.cached_context = {};
            },
            get_valid_nodes_for_context: function(element_name){
                var _this = this,
                    context,
                    max_depth = 10,
                    selector,
                    gather_below = function(nodes, depth){
                        var node,
                            node_name,
                            node_attribute_name,
                            i,
                            child_elements,
                            child_element_name;

                        if(depth === undefined) depth = 0;
                        for(i = 0; i < nodes.length; i++){
                            node = nodes[i];
                            node_name = node.nodeName;
                            node_attribute_name = (node.nodeType === node.ELEMENT_NODE) ? node.getAttribute("name") : undefined;
                            if(node_name === "element" && depth === 0) node_name = "we're not interested in this element so this is some random thing to skip to 'default' in switch/case";
                            switch(node_name) {
                                case "#text":
                                    break;
                                case "element":
                                    if(node_attribute_name) context.elements[node_attribute_name] = _this.elements[node_attribute_name];
                                    break;
                                case "attribute":
                                    if(node_attribute_name) context.attributes[node_attribute_name] = _this.attributes[node_attribute_name];
                                    break;
                                case "ref":
                                    node = _this.schema_defines[node_attribute_name]; //INTENTIONAL. NOT AN ERROR. SHUT UP JSHINT
                                default: // we have to go deeper
                                    if(depth <= max_depth && node.childNodes.length > 0) gather_below(node.childNodes, depth + 1);
                            }
                        }
                    };
                if(element_name === doctored.CONSTANTS.root_context) { //then it's the root node so we use different logic because there is no parent node
                    return {elements: {}, attributes: {}}; //FIXME allow different root nodes
                }
                if(!this.cached_context[element_name]) {
                    context = {elements: {}, attributes: {}};
                    //console.log(element_name, this.schema_elements[element_name]);
                    if(this.schema_elements[element_name]) {
                        gather_below([this.schema_elements[element_name]]);
                    }
                    this.cached_context[element_name] = context;
                }
                return this.cached_context[element_name];
            }
        },
        w3c_schema = {
            cache_useful_stuff_from_schema: function(){
                var this_function   = doctored.util.this_function,
                    schema_elements,
                    schema_element,
                    schema_element_help,
                    node_attribute_name,
                    block_or_inline,
                    i;

                this.elements = {};
                this.schema_elements = {}; //cache some lookups
                schema_elements = $("element", this.schema.documentElement);
                for(i = 0; i < schema_elements.length; i++){
                    schema_element = schema_elements[i];
                    node_attribute_name = schema_element.getAttribute("name");
                    if(node_attribute_name){
                        schema_element_help = $("documentation", schema_element)[0];
                        block_or_inline = (this.inline_elements && this.inline_elements.indexOf(node_attribute_name) >= 0) ? "inline" : "block";
                        this.elements[node_attribute_name] = {
                            display: block_or_inline,
                            help: schema_element_help ? doctored.util.remove_excessive_whitespace(schema_element_help.textContent) : ""
                        };
                        this.schema_elements[node_attribute_name] = schema_element;
                    }
                }

                this.attributes = {};
                schema_elements = $("attribute", this.schema.documentElement);
                for(i = 0; i < schema_elements.length; i++){
                    schema_element = schema_elements[i];
                    node_attribute_name = schema_element.getAttribute("name");
                    if(node_attribute_name){
                        schema_element_help = $("documentation", schema_element)[0];
                        this.attributes[node_attribute_name] = {help: schema_element_help ? doctored.util.remove_excessive_whitespace(schema_element_help.textContent) : ""};
                    }
                }

                this.schema_defines = {}; //cache some lookups
                schema_elements = $("[name]", this.schema.documentElement);
                for(i = 0; i < schema_elements.length; i++){
                    schema_element = schema_elements[i];
                    node_attribute_name = schema_element.getAttribute("name");
                    if(node_attribute_name){
                        if(!this.schema_defines[schema_element.nodeName]) this.schema_defines[schema_element.nodeName] = {};
                        this.schema_defines[schema_element.nodeName][node_attribute_name] = schema_element;
                    }
                }
                this.cached_context = {};
            },
            get_valid_nodes_for_context: function(element_name){
                var _this = this,
                    context,
                    max_depth = 25,
                    selector,
                    gather_below = function(nodes, depth){
                        var node,
                            node_name,
                            node_attribute_name,
                            node_attribute_ref,
                            node_attribute_base,
                            i,
                            child_elements,
                            child_element_name;

                        if(depth === undefined) depth = 0;
                        for(i = 0; i < nodes.length; i++){
                            node = nodes[i];
                            node_attribute_name = undefined;
                            node_attribute_ref  = undefined;
                            if(node.nodeType === node.ELEMENT_NODE){
                                node_attribute_ref = node.getAttribute("ref");
                                node_attribute_base = node.getAttribute("base");
                                //console.log("REFER", node_attribute_base, node_attribute_ref)
                                if(node_attribute_ref && _this.schema_defines[node.nodeName][node_attribute_ref]) {
                                    //console.log("following ref", node.nodeName, node_attribute_ref, _this.schema_defines[node.nodeName][node_attribute_ref])
                                    gather_below([_this.schema_defines[node.nodeName][node_attribute_ref]], depth + 1);
                                } else if(node_attribute_base && _this.schema_defines["xs:complexType"][node_attribute_base]) {
                                    //console.log("drop the base")
                                    gather_below([_this.schema_defines["xs:complexType"][node_attribute_base]], depth + 1);
                                }
                                node_attribute_name = node.getAttribute("name");
                            }
                            node_name = node.nodeName;
                            if(node_name === "element" && depth === 0) node_name = "we're not interested in this element so this is some random thing to skip to 'default' in switch/case";
                            //console.log(node_name, node_attribute_name, node);
                            switch(node_name) {
                                case "#text":
                                    break;
                                case "xs:element":
                                case "element":
                                    if(node_attribute_name) context.elements[node_attribute_name] = _this.elements[node_attribute_name];
                                    break;
                                case "xs:attribute":
                                case "attribute":
                                    if(node_attribute_name) context.attributes[node_attribute_name] = _this.attributes[node_attribute_name];
                                    break;
                            }
                            if(depth <= max_depth && node.childNodes.length > 0) gather_below(node.childNodes, depth + 1);
                        }
                    };
                if(element_name === doctored.CONSTANTS.root_context) { //then it's the root node so we use different logic because there is no parent node
                    return {elements: {}, attributes: {}}; //FIXME allow different root nodes
                }
                //console.log(element_name);
                if(!this.cached_context[element_name]) {
                    context = {elements: {}, attributes: {}};
                    if(this.schema_elements[element_name]) {
                        //console.log("what", context.attributes);
                        gather_below(this.schema_elements[element_name].childNodes);
                    }
                    this.cached_context[element_name] = context;
                }
                return this.cached_context[element_name];
            }
        },
        schema_init = function(instance, schema_url, new_document){
            var this_function  = doctored.util.this_function,
                file_extension = doctored.util.file_extension(schema_url),
                xhr;

            this.schema_url = doctored.base + "schemas" + schema_url;
            this.elements = {};
            this.attributes = {};
            if(this.ready === true) return this_function(this.update_element_chooser, this)();
            this.instance = instance;
            switch(file_extension.toLowerCase()){
                case "rng":
                    this.cache_useful_stuff_from_schema = relaxng.cache_useful_stuff_from_schema;
                    this.get_valid_nodes_for_context = relaxng.get_valid_nodes_for_context;
                    break;
                case "xsd":
                    this.cache_useful_stuff_from_schema = w3c_schema.cache_useful_stuff_from_schema;
                    this.get_valid_nodes_for_context = w3c_schema.get_valid_nodes_for_context;
                    break;
                default:
                    return alert("Unable to use a schema '" + file_extension + "'. RelaxNG files must have extension .rng and W3C Schema files must have extension .xsd");
            }
            xhr = new XMLHttpRequest();
            xhr.open("GET", this.schema_url, true);
            xhr.send(null);
            xhr.onreadystatechange = this_function(function(){
                if(xhr.readyState !== 4) return;
                if(xhr.responseXML){
                    this.schema = xhr.responseXML;
                } else {
                    this.schema = ( new window.DOMParser() ).parseFromString(xhr.responseText, "text/xml");
                }
                this_function(this.cache_useful_stuff_from_schema, this)();
                this_function(this.update_element_chooser, this)();
                if(new_document) this_function(this.new_document, this)();
                this_function(this.instance.lint_soon, this.instance)();
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
            this.instance.set_xml_string(this.new_document_xml);
        },
        set_dialog_context = function(dialog, elements_under_element_name, attributes_for_element_name, existing_attributes){
            var this_function        = doctored.util.this_function,
                context_chooser      = dialog.element_chooser.context_chooser || $("optgroup", dialog.element_chooser)[0],
                element_chooser      = dialog.element_chooser,
                number_of_elements,
                context,
                keys,
                key,
                i;

            if(elements_under_element_name) {
                context = this_function(this.get_valid_nodes_for_context, this)(elements_under_element_name);
                number_of_elements = (context && context.elements) ? Object.keys(context.elements).length : 0;
                if(number_of_elements === 0) {
                    context_chooser.setAttribute("label", "Suggested (0 elements)"); //TODO fix this, detect valid root nodes
                    context_chooser.innerHTML = '<option value="" disabled>(None)</option>';
                } else {
                    context_chooser.setAttribute("label", "Suggested under '" + elements_under_element_name + "' (" + number_of_elements + " elements)");
                    context_chooser.innerHTML = doctored.util.to_options_tags(context.elements, true);
                }
            }
            if(attributes_for_element_name){
                //step 1. clear existing attributes that are empty
                for(i = 0; i < dialog.attributes_div.childNodes.length - 1; i++){ // note the " - 1" because the last row is irrelevant
                    if($(".doctored-attribute-value", dialog.attributes_div.childNodes[i])[0].value.length) {
                        dialog.attributes_div.removeChild(dialog.attributes_div.childNodes[i]);
                    }
                }
                context = this_function(this.get_valid_nodes_for_context, this)(attributes_for_element_name);
                keys = (context && context.attributes) ? Object.keys(context.attributes).sort() : [];
                for(i = 0; i < keys.length; i++){
                    key = keys[i];
                    if(!existing_attributes || !existing_attributes[key]){
                        doctored.util.dialog_append_attribute(dialog, key, "", context.attributes[key].help);
                    }
                }
                dialog.attributes_title.innerHTML = "Attributes for " + doctored.util.escape_text(attributes_for_element_name);
            }
        };
       

    doctored.schema_family = { //a way of grouping multiple schemas into types (e.g. DocBook 4 and 5 are both "docbook")
        docbook: {
            name:              "DocBook 5",
            convert_from_html: function(html_string){
            // Typically called when people paste HTML and this is supposed to convert that to DocBook
            // this is just a prototype at the moment, not very useful
            // FIXME: improve this A LOT!
                var element_mapping   = {"p":    "para", "a": "ulink"},
                    attribute_mapping = {"href": "url"};
                return doctored.util.simple_transform(html_string, element_mapping, attribute_mapping);
            },
            new_document: new_document,
            new_document_xml: '<book version="5.0" xmlns="http://docbook.org/ns/docbook" xmlns:xlink="http://wwww.w3.org/1999/xlink/">' +
                                '<title>Book Title</title>' +
                                '<chapter><para>First paragraph <link xlink:href="http://docvert.org/">with hyperlink</link>.</para></chapter>' +
                              '</book>',
            init: schema_init,
            update_element_chooser: update_element_chooser,
            set_dialog_context: set_dialog_context,
            inline_elements: ["abbrev","accel","acronym","address","alt","anchor","annotation","application","author","bibliolist","biblioref","blockquote","bridgehead","calloutlist","caution","citation","citebiblioid","citerefentry","citetitle","classname","classsynopsis","cmdsynopsis","code","command","computeroutput","constant","constraintdef","constructorsynopsis","coref","database","date","destructorsynopsis","editor","email","emphasis","envar","epigraph","equation","errorcode","errorname","errortext","errortype","example","exceptionname","fieldsynopsis","figure","filename","footnote","footnoteref","foreignphrase","funcsynopsis","function","glosslist","guibutton","guiicon","guilabel","guimenu","guimenuitem","guisubmenu","hardware","important","indexterm","info","informalequation","informalexample","informalfigure","initializer","inlineequation","inlinemediaobject","interfacename","itemizedlist","jobtitle","keycap","keycode","keycombo","keysym","link","literal","literallayout","markup","mediaobject","menuchoice","methodname","methodsynopsis","modifier","mousebutton","msgset","nonterminal","note","olink","option","optional","orderedlist","org","orgname","package","parameter","person","personname","phrase","procedure","productionset","productname","productnumber","programlisting","programlistingco","prompt","property","qandaset","quote","remark","replaceable","returnvalue","revhistory","screen","screenco","screenshot","segmentedlist","shortcut","sidebar","simplelist","subscript","superscript","symbol","synopsis","systemitem","tag","task","termdef","tip","token","trademark","type","uri","userinput","variablelist","varname","warning","wordasword","xref"]
        },
        'tei': {
            name: "TEI 2.6.0",
            ready: false,
            init: schema_init,
            update_element_chooser: update_element_chooser,
            set_dialog_context: set_dialog_context,
            new_document: new_document,
            inline_elements: ["title", "note", "name", "emph", "term"],
            new_document_xml: '<TEI xmlns="http://www.tei-c.org/ns/1.0"><teiHeader><fileDesc><titleStmt><title>Review: an electronic transcription</title></titleStmt><publicationStmt><p>Published as an example for the Introduction module of TBE.</p></publicationStmt><sourceDesc><p>No source: born digital.</p></sourceDesc></fileDesc></teiHeader><text><body><head>Review</head><p><title>Die Leiden des jungen Werther</title><note place="foot">by <name>Goethe</name></note>is an <emph>exceptionally</emph> good example of a book full of <term>Weltschmerz</term>.</p> </body> </text> </TEI>'
        },
        'dita': {
            name: "DITA 1.8",
            ready: false,
            init: schema_init,
            dtd: '<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA Concept//EN" "../../dtd/concept.dtd">',
            file_extension: ".dita",
            update_element_chooser: update_element_chooser,
            set_dialog_context: set_dialog_context,
            inline_elements: ["xref", "codeph"],
            new_document: new_document,
            new_document_xml: '<!-- This file is part of the DITA Open Toolkit project hosted on Sourceforge.net. Common Public License v1.0 --><!-- (c) Copyright IBM Corp. 2004, 2005 All Rights Reserved. --><!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA Concept//EN" "../../dtd/concept.dtd"><concept id="bookmap-readme" xml:lang="en-us">  <title>Bookmap Readme</title>  <prolog/>  <conbody>    <p>This demonstration provides a proof-of-concept implementation of the DITA bookmap proposal. The proposal adds book output to DITA using a specialized DITA map known as a bookmap. The bookmap organizes the DITA topics with the correct nesting and sequence for the book. In addition, the bookmap assigns roles such as preface, chapter, and appendix to top-level topics within the book. </p>    <p class="- topic/p ">For more detailed information about the proposal, see the detailed posting on the DITA forum at <xref href="news://news.software.ibm.com:119/c11fd3$85qq$2@news.boulder.ibm.com" format="news">news://news.software.ibm.com:119/c11fd3$85qq$2@news.boulder.ibm.com</xref>.</p>    <note>This demonstration has the following limitations:<ul>        <li>For XSL-FO formatting and thus PDF generation, only the basics have been implemented. Through specialization, the DITA XHTML-based outputs for DITA map are also available for bookmap.</li>        <li>The design for the book info component of the proposal has been fleshed out based on antecedents in DocBook and IBMIDDoc (see the comments in the <codeph>bookinfo.mod</codeph> file). Most of the elements in bookinfo aren&apos;t processed.</li>        <li>The book list component of the proposal hasn&apos;t been implemented yet. Possible designs for a glossary list have been discussed extensively on the DITA forum (resulting in the proposal posted as <xref href="news://news.software.ibm.com:119/3FA29F54.83AFB251@ca.ibm.com" format="news">news://news.software.ibm.com:119/blfg38$5k0q$1@news.boulder.ibm.com</xref>).</li>        <li>The book style component of the proposal is much more experimental than the bookmap and bookinfo components. Processing for this component is limited.</li>      </ul></note>  </conbody></concept>'
        },
        'marc': {
            name: "MARC21 Slim",
            init: schema_init,
            ready: false,
            update_element_chooser: update_element_chooser,
            set_dialog_context: set_dialog_context,
            new_document: new_document,
            new_document_xml: '<?xml version="1.0" encoding="UTF-8"?> <collection xmlns="http://www.loc.gov/MARC21/slim">   <record>     <leader>01142cam  2200301 a 4500</leader>     <controlfield tag="001">   92005291 </controlfield>     <controlfield tag="003">DLC</controlfield>     <controlfield tag="005">19930521155141.9</controlfield>     <controlfield tag="008">920219s1993    caua   j      000 0 eng  </controlfield>     <datafield tag="010" ind1=" " ind2=" ">       <subfield code="a">   92005291 </subfield>     </datafield>     <datafield tag="020" ind1=" " ind2=" ">       <subfield code="a">0152038655 :</subfield>       <subfield code="c">$15.95</subfield>     </datafield>     <datafield tag="040" ind1=" " ind2=" ">       <subfield code="a">DLC</subfield>       <subfield code="c">DLC</subfield>       <subfield code="d">DLC</subfield>     </datafield>     <datafield tag="042" ind1=" " ind2=" ">       <subfield code="a">lcac</subfield>     </datafield>     <datafield tag="050" ind1="0" ind2="0">       <subfield code="a">PS3537.A618</subfield>       <subfield code="b">A88 1993</subfield>     </datafield>     <datafield tag="082" ind1="0" ind2="0">       <subfield code="a">811/.52</subfield>       <subfield code="2">20</subfield>     </datafield>     <datafield tag="100" ind1="1" ind2=" ">       <subfield code="a">Sandburg, Carl,</subfield>       <subfield code="d">1878-1967.</subfield>     </datafield>     <datafield tag="245" ind1="1" ind2="0">       <subfield code="a">Arithmetic /</subfield>       <subfield code="c">Carl Sandburg ; illustrated as an anamorphic adventure by Ted Rand.</subfield>     </datafield>     <datafield tag="250" ind1=" " ind2=" ">       <subfield code="a">1st ed.</subfield>     </datafield>     <datafield tag="260" ind1=" " ind2=" ">       <subfield code="a">San Diego :</subfield>       <subfield code="b">Harcourt Brace Jovanovich,</subfield>       <subfield code="c">c1993.</subfield>     </datafield>     <datafield tag="300" ind1=" " ind2=" ">       <subfield code="a">1 v. (unpaged) :</subfield>       <subfield code="b">ill. (some col.) ;</subfield>       <subfield code="c">26 cm.</subfield>     </datafield>     <datafield tag="500" ind1=" " ind2=" ">       <subfield code="a">One Mylar sheet included in pocket.</subfield>     </datafield>     <datafield tag="520" ind1=" " ind2=" ">       <subfield code="a">A poem about numbers and their characteristics. Features anamorphic, or distorted, drawings which can be restored to normal by viewing from a particular angle or by viewing the image\'s reflection in the provided Mylar cone.</subfield>     </datafield>     <datafield tag="650" ind1=" " ind2="0">       <subfield code="a">Arithmetic</subfield>       <subfield code="x">Juvenile poetry.</subfield>     </datafield>     <datafield tag="650" ind1=" " ind2="0">       <subfield code="a">Children\'s poetry, American.</subfield>     </datafield>     <datafield tag="650" ind1=" " ind2="1">       <subfield code="a">Arithmetic</subfield>       <subfield code="x">Poetry.</subfield>     </datafield>     <datafield tag="650" ind1=" " ind2="1">       <subfield code="a">American poetry.</subfield>     </datafield>     <datafield tag="650" ind1=" " ind2="1">       <subfield code="a">Visual perception.</subfield>     </datafield>     <datafield tag="700" ind1="1" ind2=" ">       <subfield code="a">Rand, Ted,</subfield>       <subfield code="e">ill.</subfield>     </datafield>   </record> </collection>'
        },
        'texml': {
            name: "TeXML",
            init: schema_init,
            ready: false,
            update_element_chooser: update_element_chooser,
            set_dialog_context: set_dialog_context,
            new_document: new_document,
            new_document_xml: '<?xml version="1.0" encoding="UTF-8"?><TeXML><TeXML escape="0">\\documentclass[a4paper]{article}\\usepackage[latin1]{inputenc}\\usepackage[T1]{fontenc}</TeXML><env name="document">NOTE We don\'t support linebreaks very well right now - this format isn\'t very well supported.\nI\'m not afraid of the symbols\n$, ^, > and others.</env></TeXML>'
        }
    };



}());

