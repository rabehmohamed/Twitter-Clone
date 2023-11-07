const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');

exports.createOne = Model => 
    catchAsync(async (req, res, next) => {
        const doc = await Model.create(req.bdy);
        res.status(201).json({
            status:'success',
            data : doc
        });  
    });

exports.getAll = Model => 
    catchAsync (async (req, res, next) => {
        const docs = await Model.find();
        res.status(200).json({
            status : 'success',
            results : docs.length,
            data : {docs}
            });
    });

exports.getOne = (Model , popOptions) => 
    catchAsync (async (req,res, next)=>{
        let obj = Model.findById(req.params.id);

        if(popOptions) obj = obj.populate(popOptions);

        const doc = await obj;
        if(!doc){
            return next(new appError('No document found with with ID' , 404));
        }

        res.status(200).json({
         status : 'success',
         data : doc
        });
        
    })

    exports.updateOne = Model => 
    catchAsync (async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id , req.body , {
            new : true,
            runValidators : true
        });

        if(!doc){
            return next(new appError('No document found with with ID' , 404));
        }

        res.status(200).json({
            status : 'success',
            data : doc
        });
    })

exports.deleteOne = Model => 
    catchAsync (async(req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if(!doc){
        return next(new appError('No document found with with ID' , 404));
    }

    res.status(200).json({
        status : 'success',
        message : 'deleted'
    }); 
});
