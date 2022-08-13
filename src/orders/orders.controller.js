// const { Console } = require("console");
// const e = require("cors");
const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
//LIST
function list(req, res){
    res.json({data: orders});
}

//CREATE
function reqBodyHas(propertyName){
    return function(req, res, next){
        const {data ={} } = req.body;
        if(data[propertyName]){
            // console.log("reqBodyHas:::propertyName::::", propertyName);
            return next();
        }
        next({ status: 400, 
            message : `Order must include a ${propertyName}`
        });
    };
}

function validateDishQuantity(propertyName){
    return function(req, res, next){
        const {data:{dishes}={}} = req.body;
        // console.log("validateDishQuantity:::::dishes:::", dishes);
        // const noOfDish = dishes.length;
        for (const i in dishes){
            if (!dishes[i][propertyName] || !Number.isInteger(dishes[i][propertyName]) || dishes[i][propertyName] < 1)
                {
                    // console.log(" HERE in IF loop", dishes[i][propertyName], ' :: i :: ', i);
              return next({
                status: 400, 
                message: `Dish ${i} must have a quantity that is an integer greater than 0`
                })
                 }
        }
        next();
    };
}

function dishesPropHasItems(){
    return function(req, res, next){
        const{data:{dishes}={}}= req.body;
        if(Array.isArray(dishes) && dishes.length){
            return next();
        }
        next({
            status:400,
            message:`Order must include at least one dish`
        })
    }
}

function create(req, res){
    const {data:{deliverTo, mobileNumber, status, dishes}={}}= req.body;
    const newOrder = {
        id : nextId(),
        deliverTo,
        mobileNumber,
        status ,
        dishes,        
    }
orders.push(newOrder);
res.status(201).json({data:newOrder});
}

function orderIdExists(req, res, next){
    const {orderId} = req.params;
    // console.log("dishIdExists:::::", dishIdExists);
    const foundOrderId = orders.find((order)=>order.id === orderId);
    // console.log("dishIdExists:::foundDishId:::", foundDishId);
    if(foundOrderId){
        res.locals.order = foundOrderId;
        return next();
    }
    next({
        status: 404 , 
        message: `Order does not exist: ${orderId}`
    })

}

function read(req, res){
    res.json({data: res.locals.order});
}

function validateIdReqBodyNReqParam(req, res, next){
    const {data : requestBody} = req.body;
    if(Object.keys(requestBody).includes("id") && requestBody.id){
        if(requestBody.id === req.params.orderId){
            return next();
        }
        next({
            status:400,
            message:`Order id does not match route id. Order: ${requestBody.id}, Route: ${req.params.orderId}.}`
        })

    }
    return next();
}

function validateOrderStatus (req, res, next){
    const orderStatus = ['pending', 'preparing', 'out-for-delivery', 'delivered']
    const {data : {status}={}} = req.body;
    if (status && orderStatus.includes(status) && status !== "delivered"){
        return next();
    }
    // else if (status === "delivered"){
    //     return next({
    //         status: 404, 
    //         message: "A delivered order cannot be changed"
    //     })
    // }
    next({
        status: 400, 
        message: status==="delivered" ? "A delivered order cannot be changed" :"Order must have a status of pending, preparing, out-for-delivery, delivered"
    })
}

function update(req, res){
    const existingOrder = res.locals.order;
    const {data : requestData} = req.body;


    existingOrder.deliverTo = requestData.deliverTo;
    existingOrder.mobileNumber = requestData.mobileNumber;
    existingOrder.status = requestData.status;
    existingOrder.dishes = requestData.dishes;

    res.json({data: existingOrder});
}



function orderStatusOfDeleteReq (req, res, next){
    // const {data : {status}={}} = req.body;
    const OrderToDelete = res.locals.order;
    console.log("orderStatusofDeleteReq:::::", OrderToDelete.status)
    if (OrderToDelete.status &&  OrderToDelete.status === "pending"){
        
        return next();
    }
    next({
        status: 400, 
        message: "An order cannot be deleted unless it is pending"
    })
}

function remove(req, res){
    // console.log("usesController:::req.params::::",req.params);
    const {orderId} = req.params;
    // console.log("usescont::useId::::", usesId);
    const orderIndex = orders.findIndex((order)=> order.id ===orderId);
    // console.log("usesCont::::useIndex", useIndex)
    const deletedOrder = orders.splice(orderIndex, 1); 
    res.sendStatus(204);
  }

module.exports = {
    list,
    create:[
        reqBodyHas("deliverTo"),
        reqBodyHas("mobileNumber"),
        reqBodyHas("dishes"),
        dishesPropHasItems(),
        validateDishQuantity("quantity"),
        create,
    ],
    read:[
        orderIdExists, read
    ],
    update:[
        orderIdExists,
        reqBodyHas("deliverTo"),
        reqBodyHas("mobileNumber"),
        reqBodyHas("dishes"),
        dishesPropHasItems(),
        validateDishQuantity("quantity"),
        validateIdReqBodyNReqParam,
        validateOrderStatus,
        update
    ], 
    remove:[
        orderIdExists, orderStatusOfDeleteReq,  remove
    ]
}
