$.fbLike.objectId = "http://www.facebook.com/appcelerator";
if (OS_ANDROID) {
    $.index.fbProxy = Alloy.Globals.Facebook.createActivityWorker({lifecycleContainer: $.index});
}


$.buttonShare.addEventListener('click', function() {
    if(Alloy.Globals.Facebook.getCanPresentShareDialog()) {
        Alloy.Globals.Facebook.presentShareDialog({
            link: 'https://appcelerator.com/',
            name: 'great product',
            description: 'Titanium is a great product',
            caption: 'it rocks too',
            picture: 'http://www.appcelerator.com/wp-content/uploads/scale_triangle1.png'
        });
    } else {
        Alloy.Globals.Facebook.presentWebShareDialog({
            link: 'https://appcelerator.com/',
            name: 'great product',
            description: 'Titanium is a great product',
            caption: 'it rocks too',
            picture: 'http://www.appcelerator.com/wp-content/uploads/scale_triangle1.png'
        });
    }
});



$.index.open();