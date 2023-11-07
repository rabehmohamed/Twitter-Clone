const multer = require('multer');

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new appError('Not an image! Please upload only images.', 400), false);
  }
};

exports.uploadSingleImg = () => {
    const upload = multer({
      storage: multerStorage,
      fileFilter: multerFilter,
    });
  
    return upload.single('image');
  };

exports.uploadMultiImgs = () => {
    const upload = multer({
      storage: multerStorage,
      fileFilter: multerFilter,
    });

    return upload.fields([
      {name : 'images' , maxCount : 4},
    ]);
}
