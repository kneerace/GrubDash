const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");
// console.log("nextId:::::", nextId);

// TODO: Implement the /dishes handlers needed to make the tests pass

// list
function list(req, res){
    res.json({data: dishes});

    // console.log("list::::", dishes)
}

// read
function dishIdExists(req, res, next){
    const {dishId} = req.params;
    // console.log("dishIdExists:::::", dishIdExists);
    const foundDishId = dishes.find((dish)=>dish.id === dishId);
    // console.log("dishIdExists:::foundDishId:::", foundDishId);
    if(foundDishId){
        res.locals.dish = foundDishId;
        return next();
    }
    next({
        status: 404 , 
        message: `Dish does not exist: ${dishId}`
    })
}

function read(req, res){
    res.json({data: res.locals.dish});
}

// create
function bodyDataHas(propertyName){
    return function(req, res, next){
        const {data ={} } = req.body;
        if(data[propertyName]){
            return next();
        }
        next({ status: 400, 
            message : `Dish must include a ${propertyName}`
        });
    };
}

function valueIsGreaterThanZero(propertyName){
    return function(req, res, next){
        const {data={} }= req.body;
        if(Number(data[propertyName]) > 0){
            return next();
        }
        next({ status: 400, 
            message : `Dish must have a price that is an integer greater than 0}`
        });
    }
}
function valueIsAnInteger(propertyName){
    return function(req, res, next){
        const {data={} }= req.body;
        if(data[propertyName] && Number.isInteger(data[propertyName])){
            return next();
        }
        next({ status: 400, 
            message : `Dish must have a price that is an integer greater than 0`
        });
    }
}

function create(req, res){
    const {data:{name, description, price, image_url}={}}= req.body;
    const newDish = {
        id : nextId(),
        name,
        description,
        price ,
        image_url,        
    }
dishes.push(newDish);
res.status(201).json({data:newDish});
}

//update
function validateIdReqBodyNReqParam(req, res, next){
    const {data : requestBody} = req.body;
    if(Object.keys(requestBody).includes("id") && requestBody.id){
        if(requestBody.id === req.params.dishId){
            return next();
        }
        next({
            status:400,
            message:`Dish id does not match route id. Dish: ${requestBody.id}, Route: ${req.params.dishId}`
        })

    }
    return next();
}

function update(req, res){
    const existingDish = res.locals.dish;
    // console.log('Update::::existingDish',existingDish, ' req.body:::', req.body);
    const {data : requestData} = req.body;

    // console.log("Update::requestData:::", requestData);
    existingDish.name = requestData.name;
    existingDish.description = requestData.description;
    existingDish.image_url = requestData.image_url;
    existingDish.price = requestData.price;

    res.json({data: existingDish});
}

module.exports = {list, 
    // read, 
    create :[
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        valueIsAnInteger("price"),
        valueIsGreaterThanZero("price"),
        create,
    ],
    read:[
        dishIdExists,
        read
    ] ,
    // update,
    update:[
        dishIdExists,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        valueIsAnInteger("price"),
        valueIsGreaterThanZero("price"), 
        validateIdReqBodyNReqParam,
        update
    ]
}
