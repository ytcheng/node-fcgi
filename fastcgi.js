var FCGI_VERSION_1 = 1;
var FCGI_KEEP_CONN = 1;
var FCGI_RESPONDER = 1;


var FCGI_BEGIN_REQUEST = 1;
var FCGI_PARAMS = 4;
var FCGI_STDIN = 5;

var fastcgi = (function () {    
    function Singleton() {
		var CurrRequrestId = 0;//当前请求id
		this.addHeader = function (type,requestId,content){
			var contentLenth = content.length;
			var paddingLength = 8 - content.length%8;
			var length = contentLenth + paddingLength + 8;
			var buf = new Buffer(length);
			var index = 0;
			buf.writeInt8(FCGI_VERSION_1,index++);
			buf.writeInt8(type,index++);
			buf.writeInt16BE(requestId,index++ ++);
			buf.writeInt16BE(contentLenth,index++ ++);
			buf.writeInt16BE(paddingLength,index++ ++);
			content.copy(buf,index);
			index+=contentLenth;
			buf.fill(0,index,length-index);
			return buf;
		}
		this.beginRequest(requestId,flag){
			if(flag==null) flag = 0;
			var buf = new Buffer(8);
			var index = 0;
			buf.writeInt16BE(FCGI_RESPONDER,index++ ++);
			buf.writeInt8(falg,index++);
			buf.fill(0,index,5);
			return this.addHeader(FCGI_BEGIN_REQUEST,requestId,buf);
		}
		this.fcgiParams = function(requestId,name,value){
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
			if(nameLength<=127) buf.writeInt8(nameLength);
			else{
				var nameLength_e = nameLength & 2147483647;
				buf.writeInt32BE(nameLength_e,index);
				index+=4;
			}
			if(valueLength<=127) buf.writeInt8(valueLength);
			else{
				valueLength_e = valueLength & 2147483647;
				buf.writeInt32BE(valueLength_e,index);
				index+=4;
			}
			buf.write(name,index,nameLength);
			index+=nameLength;
			buf.write(value,index,valueLength);
			return this.addHeader(FCGI_PARAMS,requestId,buf);
		}
		this.fcgiStdin = function(requestId,data){			
			var length = data.length;
			var index = 0;
			while(true){
				var copyLength = (length-index>65535)?65535:(length-index);
				var buf = new Buffer(copyLength);
				data.copy(buf,0,index);				
				index += copyLength;
				this.addHeader(FCGI_STDIN,requestId,buf);
				if(index>=length) break;
			}
		}
    }
	return new Singleton();           
})();