var net = require('net');

var FCGI_VERSION_1 = 1;
var FCGI_KEEP_CONN = 1;
var FCGI_RESPONDER = 1;


var FCGI_BEGIN_REQUEST = 1;
var FCGI_PARAMS = 4;
var FCGI_STDIN = 5;

module.exports = (function () {    
    function fastcgi() {
		var currRequrestId = 1;//当前请求id
		var requestMap = {};
		this.createClient =  function(host,port,timeout){
			if(timeout==null) timeout = 60;
			return new client(host,port,timeout);
		}

		var client = function(host,port,timeout){
			var self = this;
			console.log(port+":"+host+":"+timeout);
			this._client = net.connect(port,host);
			this._client.setTimeout(timeout*1000);
			this._client.on('timeout',function(){
				self._client.destroy();
			});
			this._client.on("data",self.responseHandle);
			this._client.on("end",function(){
				console.log("end");
			});
			this._client.on('error',function(err){
				console.log('error:'+err);
			});
		}
		client.prototype.send = function (type,requestId,content){
			//if(type==FCGI_BEGIN_REQUEST) console.log(content);
			var contentLenth = content.length;
			if(content.length%8!=0) var paddingLength = 8 - content.length%8;
			else var paddingLength = 0;
			var length = contentLenth + paddingLength + 8;//总长度
			var buf = new Buffer(length);
			var offset = 0;
			buf.writeInt8(FCGI_VERSION_1,offset++);
			buf.writeInt8(type,offset++);
			buf.writeInt16BE(requestId,offset);
			offset+=2;
			buf.writeInt16BE(contentLenth,offset);
			offset+=2;
			buf.writeInt16BE(paddingLength,offset);
			offset+=2;
			console.log("offset="+offset);
			buf.fill(0,offset);//reserved
			content.copy(buf,offset);
			offset+=contentLenth;
			if(offset<length) buf.fill(0,offset,length);
			console.log(buf);
			this._client.write(buf);
		}
		client.prototype.beginRequest = function(requestId,flag){
			if(flag==null) flag = 0;
			var buf = new Buffer(8);
			var offset = 0;
			buf.writeInt16BE(FCGI_RESPONDER,offset);
			offset+=2;
			buf.writeInt8(flag,offset++);
			buf.fill(0,offset,8);
			this.send(FCGI_BEGIN_REQUEST,requestId,buf);
		}
		client.prototype.fcgiParams = function(requestId,name,value){
			console.log("fcgiParams name="+name+"|value="+value);
			var nameLength = name.length;
			var valueLength = value.length;
			var length = 0;
			if(nameLength<=127) length+=1;
			else length+=4;
			if(valueLength<=127) length+=1;
			else length+=4;
			length += nameLength;
			length += valueLength;
			var buf = new Buffer(length);
			var offset = 0;
			if(nameLength<=127) buf.writeInt8(nameLength,offset);
			else{
				var nameLength_e = nameLength & 2147483647;
				buf.writeInt32BE(nameLength_e,offset);
				offset+=4;
			}
			if(valueLength<=127) buf.writeInt8(valueLength,offset);
			else{
				valueLength_e = valueLength & 2147483647;
				buf.writeInt32BE(valueLength_e,offset);
				offset+=4;
			}
			buf.write(name,offset,nameLength);
			offset+=nameLength;
			buf.write(value,offset,valueLength);
			this.send(FCGI_PARAMS,requestId,buf);
		}
		client.prototype.endfcgiParams = function(requestId){
			var buf = new Buffer(0);
			//buf.fill(0,0,2);
			console.log('endfcgiParams');
			console.log(buf);
			this.send(FCGI_PARAMS,requestId,buf);
		}
		client.prototype.fcgiStdin = function(requestId,data){			
			var length = data.length;
			var offset = 0;
			while(true){
				var copyLength = (length-offset>65535)?65535:(length-offset);
				var buf = new Buffer(copyLength);
				data.copy(buf,0,offset);				
				offset += copyLength;
				this.send(FCGI_STDIN,requestId,buf);
				if(offset>=length) break;
			}
		}
		client.prototype.request = function(fcgiparams,stdin){
			var requestId = this.getRequestId();
			this.beginRequest(requestId);
			for(var name in fcgiparams){
				this.fcgiParams(requestId,name,fcgiparams[name]);
			}
			this.endfcgiParams(requestId);
		}
		client.prototype.getRequestId = function(){
			var requestId;
			while(true){
				requestId = currRequrestId++;
				if(currRequrestId>65535) currRequrestId=0;
				if(!requestMap[requestId]) break;
			}
			return requestId;
		}
		client.prototype.responseHandle = function(data){
			console.log("data");
			console.log(data);
		}
			
    }
	return new fastcgi();           
})();