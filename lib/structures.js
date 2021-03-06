﻿/**
*  主要实现SimpleMap和CircleList两个工具类
*/
(function(exports) {
	var SimpleMap = exports.SimpleMap = function() {
			this.map = {};
			this.mapSize = 0;
		};
	
	// 增加数据。已存在，则覆盖，返回旧值。否则返回新值
	SimpleMap.prototype.put = function(key, value) {
		var oldValue = this.map[key];
		this.map[key] = value;
		if(!oldValue) {
			this.mapSize++;
		}
		return(oldValue || value);
	};
	
	// 查询数据。有则返回数据，否则为空。
	SimpleMap.prototype.get = function(key) {
		return this.map[key];
	};
	
	// 删除数据，有则返回该值，否则为空
	SimpleMap.prototype.remove = function(key) {
		var v = this.map[key];
		if(v) {
			delete this.map[key];
			this.mapSize--;
		};
		return v;
	};
	// 查询 map 数据个数
	SimpleMap.prototype.size = function() {
		return this.mapSize;
	};
	
	// 清空map
	SimpleMap.prototype.clear = function() {
		this.map = {};
		this.mapSize = 0;
	};
	
	// 查询所有key，返回 [keys]
	SimpleMap.prototype.keySet = function() {
		var theKeySet = [];
		for(var i in this.map) {
			theKeySet.push(i);
		}
		return theKeySet;
	};
	
	// 查询所有values，返回 [values]
	SimpleMap.prototype.values = function() {
		var theValue = [];
		for(var i in this.map) {
			theValue.push(this.map[i]);
		}
		return theValue;
	};
	
	// 克隆参数中的map
	SimpleMap.prototype.clone = function(clonemap){
		this.map = clonemap.map;
		this.mapSize = clonemap.mapSize;
	}

	var CircleList = exports.CircleList = function(maxSize) {
			this.maxSize = (maxSize || 10);
			this.list = [];
			this.index = null;
		};

	CircleList.prototype.clear = function() {
		this.list = [];
		this.index = null;
	};

	CircleList.prototype.add = function(value) {
		if(null == this.index) {
			this.index = 0;
		}

		this.list[this.index++] = value;

		if(this.index == this.maxSize) {
			this.index = 0;
		}
	};

	CircleList.prototype.values = function() {
		var theValue = [];
		if(null != this.index) {
			if(this.list.length == this.maxSize) {
				for(var i = this.index; i < this.maxSize; i++) {
					theValue.push(this.list[i]);
				}
			}

			for(var i = 0; i < this.index; i++) {
				theValue.push(this.list[i]);
			}
		}
		return theValue;
	};
})((function() {
	if(typeof exports === 'undefined') {
		window.tools = {};
		return window.tools;
	} else {
		return exports;
	}
})());