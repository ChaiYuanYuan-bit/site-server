const {Guid} = require('js-guid');

module.exports = {
    create: ()=>{
        return Guid.newGuid().toString();
    },
    isValid:(value)=>{
        return Guid.isValid(value);
    },
    equals:(value)=>{
        return Guid.parse(value).equals(value);
    }
} 