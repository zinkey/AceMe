/**
 * @name:AceMe,Ace Module&&Event
 * @author:yaya
 * @overview:模块管理，消息派发
 * @version 2.0.1
 */
(function(){
    if (window.AceMe) {
        return;
    }
    var ready = (function(){
        var readyBound = false, readyList = [], DOMContentLoaded;
        if (document.addEventListener) {
            DOMContentLoaded = function(){
                document.removeEventListener('DOMContentLoaded', DOMContentLoaded, false);
                ready();
            }
        }
        else 
            if (document.attachEvent) {
                DOMContentLoaded = function(){
                    if (document.readyState === 'complete') {
                        document.detachEvent('onreadystatechange', DOMContentLoaded);
                        ready();
                    }
                }
            }
        function ready(){
            if (!ready.isReady) {
                ready.isReady = true;
                for (var i = 0, j = readyList.length; i < j; i++) {
                    readyList[i]();
                }
            }
        }
        function doScrollCheck(){
            try {
                document.documentElement.doScroll("left");
            } 
            catch (e) {
                setTimeout(doScrollCheck, 1);
                return;
            }
            ready();
        }
        function bindReady(){
            if (readyBound) {
                return;
            }
            readyBound = true;
            if (document.readyState === 'complete') {
                ready.isReady = true;
            }
            else {
                if (document.addEventListener) {
                    document.addEventListener('DOMContentLoaded', DOMContentLoaded, false);
                    window.addEventListener('load', ready, false)
                }
                else 
                    if (document.attachEvent) {
                        document.attachEvent('onreadystatechange', DOMContentLoaded);
                        window.attachEvent('onload', ready);
                        var toplevel = false;
                        try {
                            toplevel = window.frameElement == null;
                        } 
                        catch (e) {
                        }
                        if (document.documentElement.doScroll && toplevel) {
                            doScrollCheck();
                        }
                    }
            }
        }
        bindReady();
        return function(callback){
            ready.isReady ? callback() : readyList.push(callback)
        }
    })();
    ready.isReady = false;
    
    var Message = {}; //存放消息派发
    var TempMessage = {}; //存放临时消息派发（notify的时候还没有on的情况）
    var Modules = {}; //存放模块信息
    var array; //模块循环引用列表
    var circle; //模块循环引用映射
    var sandbox; //沙箱
    var ext; //扩展方法
	var TempLoad = {}; //存放动态加载模块信息
	var config = {
		base:""
	};
	var ref = document.getElementsByTagName('script')[0];
	/*
		config = {
			base:(String) 模块位置
		}
	*/

    window.AceMe = {
        /**
         * 注册一个模块
         * @param {String} name
         * @param {Function} fn
         */
        register: function(name, fn){
            if (Modules[name]) {
                throw new Error("\"" + name + "\" module is existed");
                return;
            }
            Modules[name] = {
                module: null, //初始化后的模块对象
                initial: false, //是否初始化
                fn: fn //初始化方法
            };
        },
        /**
         * 注销一个模块
         * @param {String} name
         */
        unregister: function(name){
            if (Modules[name]) {
                delete Modules[name].module;
                delete Modules[name].initial;
                delete Modules[name].fn;
                delete Modules[name];
            }
        },
        /**
         * 动态创建模块时，初始化模块（默认情况是页面ready时init所有模块）
         * @param {String} name
         */
        init: function(){
			var arg = arguments;
			for (var i=0;i<arg.length;i++)
			{
				var name = arg[i];
				if (Modules[name]) {
					var module = init(name);
					module && typeof module.init == "function"&&module.init();
				}
				else{
					loadModule(name,(function(name){
						return function(){
							var module = init(name);
							module && typeof module.init == "function"&&module.init();
						}
					})(name));	
				}
			}
        },
        sandbox: {
            /**
             * 自定义扩展sandbox
             * @param {Function} fn
             */
            ext: function(fn){
                ext = fn;
            },
            /**
             * 重置sandbox，去掉扩展
             */
            reset: function(){
                ext = null;
            }
        },
		setConfig: function(_config){
			config = _config
		}
    };
    
    sandbox = {
    
        /**
         * 发送消息
         * @param {Object} info
         */
        notifyCreator: function(info){
            return function(message, data, sync){
                var i;
                if (Message[message]) {
                    i = Message[message].length;
                    if (sync){
                    	while (i--) {
                    		Message[message][i].call(info, data);
                    	}
                    }
                    else{
                    	while (i--) {
	                        setTimeout((function(i){
	                            return function(){
	                                Message[message][i].call(info, data);
	                            }
	                        })(i), 0);
                    	}
                    }
                }
                //将notify存起来
                if (!TempMessage[message]) {
                    TempMessage[message] = [];
                }
                TempMessage[message].push({
                    data: data,
                    info: info
                });
            }
        },
        
        
        /**
         * 接受消息
         * @param {Object} info
         */
        on: function(message, fn){
            //将存起来的notify执行
            if (TempMessage[message]) {
                for (var i = 0; i < TempMessage[message].length; i++) {
                    fn.call(TempMessage[message][i].info, TempMessage[message][i].data);
                }
            }
            if (!Message[message]) {
                Message[message] = [];
            }
            Message[message].push(fn);
        }
    };
    
	/**
     * 动态加载模块
     * @param {String} name
     * @param {Function} callback
     */
	function loadModule(name,callback){
		if (TempLoad[name])
		{
			TempLoad[name].push(callback);
			return;
		}
		TempLoad[name] = [callback];
		var script = document.createElement("script");
		script.onload = script.onreadystatechange = function () {
			if (!script.readyState|| script.readyState == "loaded"|| script.readyState == "complete") {
				for (var i=0;i<TempLoad[name].length;i++)
				{
					TempLoad[name][i]();
				}
				ref.parentNode.removeChild(script);
                Modules[name] && typeof Modules[name].init == "function"&&Modules[name].init();
			}
		};
		script.setAttribute('type', 'text/javascript');
		var url;
		if (/^http:\/\/|https:\/\//i.test(name))
		{
			url = name;
		}
		else{
			url = config.base+name.toLowerCase()+".js";
		}
		script.setAttribute("src",url);
		ref.parentNode.insertBefore(script, ref);
	}
	

	/**
     * 依赖模块
     * @param {String} name
     * @param {String} cname
     */
	function require(name,cname){
		var obj = init(name, cname);
		var result = {};
		for (var i in obj) {
			if (typeof obj[i] == 'function') {
				result[i] = (function(i){
					return function(){
						return obj[i].apply({
							caller:cname
						}, arguments);
					}
				})(i);
			}
			else {
				result[i] = obj[i];
			}
		}	
		return result;
	}



    /**
     * 初始化模块
     * @param {String} name
     * @param {String} cname
     */
    function init(name, cname){
        if (!Modules[name]) {
            throw new Error("\"" + name + "\" module is required in \"" + cname + "\" module");
            return;
        }
        if (Modules[name].initial) {
            return Modules[name].module;
        }
        if (!cname) {
            array = [];
            circle = {};
        }
        array.push(name);
        
        //依赖循环
        if (circle[name]) {
            var str = array.join("->"), num = str.indexOf(name);
            throw new Error("Conflict of the loop:" + str.substr(num, str.length - num));
            return;
        }
        circle[name] = true;
        
        //this信息
        var info = {
            /**
             * 触发模块名称
             * sandbox.on sandbox.require 可调用this.caller来获取触发模块的名称
             */
            caller: name
        };
        
        var s = {
            notify: sandbox.notifyCreator(info),
            on: sandbox.on,
            require: function(n,callback){
				if (Modules[n])
				{
					var result = require(n,name);
					callback&&callback(result);
					return result;
				}
				else{
					loadModule(n,function(){
						result = require(n,name)
						callback&&callback(result);
					});
				}
            }
        };
        
        //sandbox扩展
        if (typeof ext == 'function') {
            var map = ext(name, s);
            for (var i in map) {
                if (i != 'notify' && i != 'on' && i != 'require') {
                    s[i] = (function(){
                        return map[i];
                    })();
                }
            }
        }
        
        Modules[name].module = Modules[name].fn(s);
        
        //回退一个值
        array.pop();
        //设置模块已经初始化		
        Modules[name].initial = true;
        return Modules[name].module;
    }
    ready(function(){
        var errornum = 0;
        for (var name in Modules) {
            setTimeout((function(name){
                return function(){
                    var module = init(name);
                    //如果有init方法，则执行（非必要方法）
                    if (module && typeof module.init == 'function') {
                        module.init();
                    }
                }
            })(name), 0);
        }
    });
})();