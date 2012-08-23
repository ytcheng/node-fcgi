/*var net = require('net');
var client = net.connect(1025,'127.0.0.1');
client.on('error',function(){
	console.log('error');
});
client.on('end',function(){
	console.log('end');
});
client.on('data',function(data){
	console.log('data');
	console.log(data);
});
client.write("sdfsdfdf");
*/
var fcgi = require("./fastcgi");
var client = fcgi.createClient('127.0.0.1',1025);
client.request({
	GATEWAY_INTERFACE:'CGI/1.1',
	SERVER_SOFTWARE:'nws',
	REQUEST_METHOD:'GET',
	CONTENT_TYPE:'html/text',
	CONTENT_LENGTH:'0',
	SCRIPT_FILENAME:'/data/web/test.uuzu.com/test.php',
	SCRIPT_NAME:'test.php',
	REQUEST_URI:'/test.php',
	DOCUMENT_URI:'/test.php',
	DOCUMENT_ROOT:'/data/web/test.uuzu.com/',
	SERVER_PROTOCOL:'http 1.0',
	REMOTE_ADDR:'127.0.0.1',
	REMOTE_PORT:'89568',
	SERVER_ADDR:'127.0.0.1',
	SERVER_PORT:'80',
	SERVER_NAME:'test.uuzu.com',
	REDIRECT_STATUS:'200'
});