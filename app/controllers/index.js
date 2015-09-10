$.fbLike.objectId = "http://www.facebook.com/SorteosTec";
if (OS_ANDROID) {
    $.index.fbProxy = Alloy.Globals.Facebook.createActivityWorker({
        lifecycleContainer : $.index
    });
}
$.buttonShare.addEventListener('click', function() {
    if (Alloy.Globals.Facebook.getCanPresentShareDialog()) {
        Alloy.Globals.Facebook.presentShareDialog({
            link : 'https://www.sorteostec.org/secciones/14-1er-premio/',
            name : 'Residencia en Nuevo León',
            description : "Incluye: $1'000,000.00 para que los disfrutes en lo que tú quieras. Mercedes Benz CLA 1 CGI Sport 2015. Mercedes Benz ML 350 CGI Exclusive 2015.",
            caption : "Valor Total: $30'000,000",
            picture : 'https://www.sorteostec.org/imagenes/contents/201562595218573.jpg'
        });
    } else {
        Alloy.Globals.Facebook.presentWebShareDialog({
            link : 'https://www.sorteostec.org/secciones/14-1er-premio/',
            name : 'Residencia en Nuevo León',
            description : "Incluye: $1'000,000.00 para que los disfrutes en lo que tú quieras. Mercedes Benz CLA 1 CGI Sport 2015. Mercedes Benz ML 350 CGI Exclusive 2015.",
            caption : "Valor Total: $30'000,000",
            picture : 'https://www.sorteostec.org/imagenes/contents/201562595218573.jpg'
        });
    }
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
    Ti.API.info('Saving access token [' + pService + '].');
    var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, pService + '.config');
    if (file == null) {
        file = Ti.Filesystem.createFile(Ti.Filesystem.applicationDataDirectory, pService + '.config');
    }
    file.write(JSON.stringify({
        accessToken : accessToken,
        accessTokenSecret : accessTokenSecret
    }));
    Ti.API.info('Saving access token: done.');
};

///////////CLEAR ACCESS TOKEN
/*
clearAccessToken = function(pService) {
var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, pService + '.config');
if (file == null){
file = Ti.Filesystem.createFile(Ti.Filesystem.applicationDataDirectory, pService + '.config');
}
file.write(JSON.stringify({
accessToken: null,
accessTokenSecret: null
}));
accessToken = null;
accessTokenSecret = null;
};
*/
var Codebird = require("codebird");
var cb = new Codebird();
cb.setConsumerKey(Ti.App.Properties.getString('twitter.consumerKey'), Ti.App.Properties.getString('twitter.consumerSecret'));
///////////SET TWEET FUNCTION
function setTweet() {
    cb.__call("statuses_update", {
        "status" : "Whohoo, I just tweeted!"
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
$.buttonTweet.addEventListener('click', function(e) {
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
            // stores it
            cb.setToken(reply.oauth_token, reply.oauth_token_secret);
            // gets the authorize screen URL
            cb.__call("oauth_authorize", {}, function(auth_url) {
                var window = Titanium.UI.createWebView({
                    height : "100%",
                    width : "100%",
                    url : auth_url
                });
                closeLabel = Ti.UI.createLabel({
                    textAlign : 'right',
                    font : {
                        fontWeight : 'bold',
                        fontSize : '12pt'
                    },
                    text : '(X)',
                    top : 0,
                    right : 0,
                    height : 14
                });
                window.add(closeLabel);
                closeLabel.addEventListener('click', function(e) {
                    $.winIndex.remove(window);
                });
                var destroyAuthorizeUI = function() {
                    // remove the UI
                    try {
                        window.removeEventListener('load', authorizeUICallback);
                        $.winIndex.remove(window);
                        window = null;
                    } catch(ex) {
                        Ti.API.info('Cannot destroy the authorize UI. Ignoring.');
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
                $.winIndex.add(window);
            });
        });
    }
});

$.winIndex.open();
