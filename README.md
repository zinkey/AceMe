AceMe是新的Ace框架。它并没有决定模块间的耦合程度，而是让开发者自己来设计决定。开发者可以设计成全消息派发模式来达到很低的耦合度，也可以采用直接的接口暴露方式来进行模块化开发。


## 介绍

AceMe去掉了原Ace框架中extension，plugin，config的概念，统一以module来代替。保留了sandbox里面的notify与on派发事件机制，但新增了require方法来获取其他模块的方法。而如果想要扩展sandbox，也可以方便得通过sandbox.ext方法来扩展。同时，AceMe支持动态创建模块并初始化。

## 使用方法

1.AceMe.register 注册模块
	
	AceMe.register("A",function(){

	});
	AceMe.register("B",function(){

	});

2.Ace.unregister 注销模块

	AceMe.unregister("A");
	AceMe.unregister("B");

3.sandbox.notify和sandbox.on 消息派发

	AceMe.register("A",function(sandbox){
	    sandbox.on("message",function(data){
	        alert(data);
	    });
	});
	AceMe.register("B",function(sandbox){
	    sandbox.notify("message","hello!");
	});

4.sandbox.require 模块依赖调用
	
	AceMe.register("A",function(sandbox){
	    var b = sandbox.require("B");
	    b.getA();
	});
	AceMe.register("B",function(sandbox){
	    var a = 1;
	    return {
	        getA:function(){
	            alert(a);
	        }
	    };
	});
	AceMe.register("C",function(sandbox){
	    //require的第二个参数为加载好后运行函数。当require不存在的模块时候，将动态去请求。
	    require("D",function(){
	        alert("ok");
	    });
	});
	
5.AceMe.init 动态创建模块初始化

	AceMe.register("A",function(sandbox){
	    alert("init");
	});
	AceMe.init ("A");

6.AceMe.sandbox.ext和AceMe.sandbox.reset 扩展sandobx和sandbox重置

	//扩展sandbox
	AceMe.sandbox.ext(function(name,sandbox){
	    return {
	        //为sandbox扩展一个获取模块名称的方法
	        getModuleName:function(){
	            alert(name);
	        },
	        //为sandbox扩展一个get方法，作用与sandbox.require相同
	        get:functon(module){
	            return sandbox.require(module);
	        }
	    }
	});
	//重置sandbox，去掉扩展的方法
	AceMe.sandbox.reset();

## AceMe运行流程
	
与原来的Ace框架一样，register后的模块，都会在dom ready后执行。同时保留的原来Ace框架中，如果模块的return中有init方法，则自动执行（但AceMe并不强制要求在return中必须有init方法，并且模块return的可以为任何类型，且可不写）。

## AceMe循环调用

考虑下面的代码：

	AceMe.register("A",function(sandbox){
	    var b = sandbox.require("B");
	    return {
	        /*  */
	    };
	});
	AceMe.register("B",function(sandbox){
	    var c = sandbox.require("C");
	    return {
	        /*  */
	    };
	});
	AceMe.register("C",function(sandbox){
	    var a = sandbox.require("A");
	    return {
	        /*  */
	    };
	});

我们可以看到有A依赖B依赖C依赖A这样的循环调用。这种情况AceMe就会抛出"Conflict of the loop:A->B->C->A"这样的异常。


© uloveit.com.cn 