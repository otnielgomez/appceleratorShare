var win = Titanium.UI.createWindow({
    title : 'Publish Stream',
    backgroundColor : "white"
});
var fb = require('facebook');

var wallDialog = Ti.UI.createButton({
    title : 'Share URL with Share Dialog',
    top : 135,
    left : 10,
    right : 10,
    height : 40
});

wallDialog.addEventListener('click', function() {
    fb.presentShareDialog({
        link : 'https://appcelerator.com/',
        title : 'great product',
        description : 'Titanium is a great product',
        picture : 'http://www.appcelerator.com/wp-content/uploads/scale_triangle1.png'
    });
});

fb.addEventListener('shareCompleted', function(e) {
    if (e.success) {
        alert('Share completed');
    } else if (e.cancelled) {
        alert('Share cancelled');
    } else {
        alert('error ' + e.errorDesciption + '. code: ' + e.code);
    }
});

win.add(wallDialog);

var likeButton = fb.createLikeButton({
    top : 230,
    height : "50%", // Note: on iOS setting Ti.UI.SIZE dimensions prevented the button click
    width : "50%",
    objectID : "https://www.facebook.com/appcelerator", // URL or Facebook ID
    foregroundColor : "white", // A color in Titanium format - see Facebook docs
    likeViewStyle : 'box_count', // standard, button, box_count - see FB docs
    auxiliaryViewPosition : 'inline', // bottom, inline, top - see FB docs
    horizontalAlignment : 'left', // center, left, right - see FB docs,
    soundEnabled : true // boolean, iOS only
});

if (Ti.Platform.osname == 'android') {
    likeButton.height = Ti.UI.SIZE;
    likeButton.width = Ti.UI.SIZE;
}
//win.add(likeButton);
win.open();
