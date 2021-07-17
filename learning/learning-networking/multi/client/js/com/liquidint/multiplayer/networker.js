/// <reference path="~/client/js/jquery-2.1.3.min.js" />
/// <reference path="~/client/js/TweenLite.min.js" />
/// <reference path="~/client/js/pixi.js" />
/// <reference path="~/client/js/main.js" />

/*
 * Thank you TechSlides for a very helpful post and sample code.
 * http://techslides.com/html5-web-workers-for-ajax-requests
 * 
 */

self.addEventListener('message', function (e) {

    fetch(e.data, function (xhr) {
        var result = xhr.responseText;
        var object = JSON.parse(result);

        // Add sequential input from calling message to prevent latent updates.
        object.seq = e.data[2];

        self.postMessage(object);
    });

}, false);


//simple XHR request in pure raw JavaScript
//because workers apparently dont like jQuery due to lack of DOM in worker.
function fetch(data, callback) {
    var xhr;

    if (typeof XMLHttpRequest !== 'undefined') xhr = new XMLHttpRequest();
    else {
        var versions = ["MSXML2.XmlHttp.5.0",
                        "MSXML2.XmlHttp.4.0",
                        "MSXML2.XmlHttp.3.0",
                        "MSXML2.XmlHttp.2.0",
                        "Microsoft.XmlHttp"]

        for (var i = 0, len = versions.length; i < len; i++) {
            try {
                xhr = new ActiveXObject(versions[i]);
                break;
            }
            catch (e) { }
        } // end for
    }

    xhr.onreadystatechange = ensureReadiness;

    function ensureReadiness() {
        if (xhr.readyState < 4) {
            return;
        }

        if (xhr.status !== 200) {
            return;
        }

        // all is well	
        if (xhr.readyState === 4) {
            callback(xhr);
        }
    }

    xhr.open('POST', data[0], true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.send(data[1]);
}