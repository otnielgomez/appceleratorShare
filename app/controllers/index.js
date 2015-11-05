if (OS_ANDROID) {
    $.winIndex.fbProxy = Alloy.Globals.Facebook.createActivityWorker({
        lifecycleContainer : $.winIndex
    });
}
$.buttonShareFB.addEventListener('click', function() {
    var url = 'http://gomezz.info/';
    var nombre = 'Prueba de Otniel Gomez';
    var descripcion = "Prueba de share de facebook desde appcelerator con funcion global, se esta probando el sitio de Otniel Gomez.";
    var subtitulo = "El url es http://gomezz.info/";
    var imagen = 'http://www.menucool.com/slider/jsImgSlider/images/image-slider-2.jpg';
    Alloy.Globals.ShareFB(url, nombre, descripcion, subtitulo, imagen);
});

/*
 * Ti.App.Properties.getString('twitter.consumerSecret')
 * Ti.App.Properties.getString('twitter.consumerKey')
 */
var accessToken = null;
var accessTokenSecret = null;
///////////LOAD ACCESS TOKEN
loadAccessToken = function(pService) {
    var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, pService + '.config');
    if (file.exists() == false) {
        return;
    }
    var contents = file.read();
    if (contents == null) {
        return;
    }
    var config;
    try {
        config = JSON.parse(contents.text);
    } catch(ex) {
        return;
    }
    if (!config) {
        return;
    }
    if (config.accessToken) {
        accessToken = config.accessToken;
    }
    if (config.accessTokenSecret) {
        accessTokenSecret = config.accessTokenSecret;
    }
};
///////////SAVE ACCESS TOKEN
saveAccessToken = function(pService) {
    var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, pService + '.config');
    if (file == null) {
        file = Ti.Filesystem.createFile(Ti.Filesystem.applicationDataDirectory, pService + '.config');
    }
    file.write(JSON.stringify({
        accessToken : accessToken,
        accessTokenSecret : accessTokenSecret
    }));
};

///////////CLEAR ACCESS TOKEN
clearAccessToken = function(pService) {
    var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, pService + '.config');
    if (file == null) {
        file = Ti.Filesystem.createFile(Ti.Filesystem.applicationDataDirectory, pService + '.config');
    }
    file.write(JSON.stringify({
        accessToken : null,
        accessTokenSecret : null
    }));
    accessToken = null;
    accessTokenSecret = null;
};
var Codebird = require("codebird");
var cb = new Codebird();
cb.setConsumerKey(Ti.App.Properties.getString('twitter.consumerKey'), Ti.App.Properties.getString('twitter.consumerSecret'));
///////////SET TWEET FUNCTION
function setTweet() {
    cb.__call("statuses_update", {
        "status" : "Test form @appcelerator."
    }, function(reply) {
        ///////////INSPECT OBJECT
        function inspeccionar(obj) {
            var msg = '';
            for (var property in obj) {
                if ( typeof obj[property] == 'function') {
                    var inicio = obj[property].toString().indexOf('function');
                    var fin = obj[property].toString().indexOf(')') + 1;
                    var propertyValue = obj[property].toString().substring(inicio, fin);
                    msg += ( typeof obj[property]) + ' ' + property + ' : ' + propertyValue + ' ;\n';
                } else if ( typeof obj[property] == 'unknown') {
                    msg += 'unknown ' + property + ' : unknown ;\n';
                } else {
                    msg += ( typeof obj[property]) + ' ' + property + ' : ' + obj[property] + ' ;\n';
                }
            }
            return msg;
        }

        if (reply.httpstatus == 200)
            alert("Tweet exitoso!!!");
        else
            alert(reply.errors[0].message);
    });
}

function abreVistaTwitter(){
    var width = "100%";
    var height = $.winIndex.toImage().getHeight();
    $.viewContenedorTwitter.zIndex = 1000;
    $.viewContenedorTwitter.animate({
        height : height,
        width : width,
        duration : 200
    });
}

$.buttonTweet.addEventListener('click', function(e) {
    abreVistaTwitter();    
    ///////////  SET TWEET ///////////
    //clearAccessToken('twitter');
    loadAccessToken('twitter');
    if (accessTokenSecret != null && accessToken != null) {
        cb.setToken(accessToken, accessTokenSecret);
        setTweet();
    } else {
        cb.__call("oauth_requestToken", {
            oauth_callback : "oob"
        }, function(reply) {
            cb.setToken(reply.oauth_token, reply.oauth_token_secret);
            cb.__call("oauth_authorize", {}, function(auth_url) {
                var window = Titanium.UI.createWebView({
                    height : "100%",
                    width : "100%",
                    url : auth_url
                });
                closeLabel = Ti.UI.createLabel({
                    textAlign : 'right',
                    color : 'red',
                    font : {
                        fontWeight : 'bold',
                    },
                    text : '(X)',
                    top : -10,
                    zIndex : 1000,
                    right : 0,
                    height : 14
                });
                //window.add(closeLabel);
                $.cierraVentanaTwitter.addEventListener('click', function(e) {
                //closeLabel.addEventListener('click', function(e) {
                    clearAccessToken('twitter');
                    $.viewContenedorTwitter.zIndex = -1;
                    $.viewContenedorTwitter.height = 10;
                    $.viewContenedorTwitter.width = 10;
                    $.viewTwitter.remove(window);
                });
                var destroyAuthorizeUI = function() {
                    // remove the UI
                    try {
                        window.removeEventListener('load', authorizeUICallback);
                        $.viewTwitter.remove(window);
                        window = null;
                    } catch(ex) {
                        console.log('Cannot destroy the authorize UI. Ignoring.');
                    }
                };
                var authorizeUICallback = function(e) {
                    //var val = window.evalJS('document.getElementById("PINFIELD").value');
                    var val = window.evalJS('window.document.querySelector(\'kbd[aria-labelledby="code-desc"] > code\').innerHTML');
                    if (val) {
                        destroyAuthorizeUI();
                        cb.__call("oauth_accessToken", {
                            oauth_verifier : val
                        }, function(reply) {
                            cb.setToken(reply.oauth_token, reply.oauth_token_secret);
                            setTweet();
                            accessToken = reply.oauth_token;
                            accessTokenSecret = reply.oauth_token_secret;
                            saveAccessToken('twitter');
                        });
                    }
                };
                window.addEventListener('load', authorizeUICallback);
                $.viewTwitter.add(window);
            });
        });
    }
});

if (OS_ANDROID) {
    $.winIndex.open();
} else {
    Alloy.Globals.navigationWindow.window = $.winIndex;
    Alloy.Globals.navigationWindow.open();
}