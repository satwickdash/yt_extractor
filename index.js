var app = require('app');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');

app.on('ready', function() {
	var mainWindow = new BrowserWindow({
		frame: false,
		width: 800,
		height: 600,
		resizable: false
	})

	mainWindow.loadUrl('file://' + __dirname + '/yt_ex.html');
})

ipc.on('close-window', function(){
	app.quit();
});
