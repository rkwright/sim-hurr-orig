'use strict';

var FOO = {
    revision: '1.0',
    EPSILON: 0.0001
};

var foo = function() {
    this.member = Math.PI;
};

foo.prototype = {
    method1: function() {
        console.log("Method 1, member = " + this.member);
    },

    method2: function() {
        console.log("Method 2");
    }
};

function testFoo() {
    var f = new foo();

    f.method1();
    f.method2();
    console.log("f.member = " + f.member);
}

testFoo();

class foo6 {
    constructor() {
        this.x = 42;
        this.y = 3.14;
    }

    f() {}
    g() {}
}

let o = new foo6();