/*globals doctored, window, alert, Worker, console*/
(function(){
	"use strict";

    var get_worker = function(i){
        return {
          ready:  true,
          index: i,
          Worker: new Worker(window.doctored.base + "js/rng.js")
        };
    };

    doctored.linters = {
        pool: [],
        pool_cursor: 0,
        config: {
            number_of_workers: 4, //TODO either make this configurable or calculate this in a clever way... perhaps benchmark speed of completing CPU-intensive task and decide accordingly
            when_all_workers_are_busy_retry_after_milliseconds: 100
        },
        lint: function(xml_string, path_to_schema, callback, context){
            var _this          = this,
				linters        = doctored.linters,
				initial_cursor = linters.pool_cursor,
				worker         = linters.pool[linters.pool_cursor];

            while(worker.ready !== true){
                linters.pool_cursor = doctored.util.increment_but_wrap_at(linters.pool_cursor, linters.pool.length);
                worker = linters.pool[linters.pool_cursor];
                if(linters.pool_cursor === initial_cursor) { //then we've looped around, so we'll discard the current request
                    console.log("Killing off old worker #" + worker.index + " and restarting it.");
                    worker.Worker.terminate(); //this is relative expensive for memory/CPU so we don't really want to have to do this. Perhaps it would be better to wait?
                    worker = get_worker(worker.index);
                }
            }
            
            linters.pool_cursor = doctored.util.increment_but_wrap_at(linters.pool_cursor, linters.pool.length);

            console.log("xml_string", xml_string);

            if(console && console.log) console.log("Gave job to worker #" + worker.index);
            worker.callback = callback;
            worker.context  = context;
            worker.ready    = false;
            worker.Worker.postMessage({
                "xml":        xml_string,
                "index":      worker.index,
                "schema_url": path_to_schema
            });
            return true;
        },
        Worker_response: function(event){
            var linters = doctored.linters,
                worker;
 
            if(!event || !event.data || event.data.index === undefined || event.data.index === -1) {
                return console.log("Unidentified worker response ", event);
            }
            worker = linters.pool[event.data.index];
            worker.ready = true; //worker is now ready for more work
            if(!event.data || !event.data.type) {
                return console.log("Unknown worker response of ", event);
            }
            switch(event.data.type){
                case "debug":
                    return console.log("DEBUG: Worker#" + event.data.index + " said: " + event.data.message);
                case "result":
                    if(worker.context) {
                        return worker.callback.bind(worker.context)(event.data.result);
                    }
                    return worker.callback(event.data.result);
                default:
                    return console.log("Unknown worker response of ", event);
            }
        },
        init: function(){
            var i    = 0,
                linters = doctored.linters;

            if(typeof window.Worker !== "function") return alert("Doctored.js requires a browser that supports Web Workers.");

            for(i = 0; i < linters.config.number_of_workers; i++){
               linters.pool.push(get_worker(i));
               linters.pool[linters.pool.length - 1].Worker.onmessage = linters.Worker_response;
            }
        }
    };

    doctored.linters.init();

}());