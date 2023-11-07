const S3 = require('aws-sdk/clients/s3');
const dotenv = require('dotenv');
dotenv.config({path : './config.env'});

const bucketName = process.env.S3_BUCKET_NAME;
const region = process.env.S3_BUCKET_REGION;
const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;

const s3 = new S3({
    region ,
    accessKeyId,
    secretAccessKey
});

//UPLOAD FILE
exports.uploadFile = (file) => {
  
    const uploadParams = {
      Bucket: bucketName,
      Body: file.buffer,
      Key: file.originalname,
    }
  
    return s3.upload(uploadParams).promise()
  }

//DOWNLOAD FILE 
exports.getFile = (fileKey) => {
    const downloadParams = {
      Key: fileKey,
      Bucket: bucketName
    }
  
    return s3.getObject(downloadParams).createReadStream()
  }

exports.deleteFile = (fileKey) => {
  const deleteParams = {
    Bucket : bucketName,
    Key: fileKey,
  }
  return s3.deleteObject(deleteParams).promise();
}