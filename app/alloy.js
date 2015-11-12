// The contents of this file will be executed before any of
// your view controllers are ever executed, including the index.
// You have access to all functionality on the `Alloy` namespace.
//
// This is a great place to do any initialization for your app
// or create any global variables/functions that you'd like to
// make available throughout your app. You can easily make things
// accessible globally by attaching them to the `Alloy.Globals`
// object. For example:
//
// Alloy.Globals.someGlobalFunction = function(){};

// Make API calls to Alloy.Globals.Facebook
if (OS_IOS) {
    Alloy.Globals.navigationWindow = Ti.UI.iOS.createNavigationWindow();
}
/*
Alloy.Globals.Facebook = require('facebook');
Alloy.Globals.ShareFB = function(url, nombre, descripcion, subtitulo, imagen){
    if (Alloy.Globals.Facebook.getCanPresentShareDialog()) {
        Alloy.Globals.Facebook.presentShareDialog({
            link : url,
            name : nombre,
            description : descripcion,
            caption : subtitulo,
            picture : imagen
        });
    } else {
        Alloy.Globals.Facebook.presentWebShareDialog({
            link : url,
            name : nombre,
            description : descripcion,
            caption : subtitulo,
            picture : imagen
        });
    }
};
*/