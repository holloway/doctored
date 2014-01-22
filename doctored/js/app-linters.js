/*globals doctored, window, alert, Worker*/
(function(){
	"use strict";

    doctored.linters = {
        workers: [],
        config: {
            number_of_workers: 4 //TODO either make this configurable or calculate this in a clever way... perhaps benchmark speed of completing CPU-intensive task and decide accordingly
        },
        init: function(){
            var i    = 0,
                lint = doctored.linters;

            if(typeof window.Worker !== "function") return alert("Doctored.js requires a browser that supports Web Workers.");

            for(i = 0; i < lint.config.number_of_workers; i++){
               lint.workers.push({
                  busy:   false,
                  worker: new Worker(window.doctored.base + "js/rng.js")
               });
            }
        }
    };

    doctored.linters.init();

}());