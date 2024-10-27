// 处理对象和数组类型的深拷贝
function deepClone(obj) {

    if (obj === null) return null;

    let clone = Object.assign({}, obj);

    Object.keys(clone).forEach((key) => {
        clone[key] = typeof obj[key] === "object" ?
            deepClone(obj[key]) : obj[key];
    })

    if (Array.isArray(obj)) {
        clone.length = obj.length;
        return Array.from(clone)
    }

    return clone;
}

let info = {
    a:1,
    b:()=>{},
    c:{
        a:1
    }
}
let info1 = deepClone(info);
info1.c.a = 3
console.log('----info',info.b ===info1.b);
