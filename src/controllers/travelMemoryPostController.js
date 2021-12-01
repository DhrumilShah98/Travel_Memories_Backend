/* Author Dhrumil Amish Shah */
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const AWS = require('aws-sdk');

const AWS_CONFIG = {
    "region": process.env.AWS_REGION,
    "accessKeyId": process.env.AWS_ACCESS_KEY,
    "secretAccessKey": process.env.AWS_SECRET_KEY,
    "sessionToken": process.env.AWS_SESSION_TOKEN,
};

AWS.config.update(AWS_CONFIG);

const dynamoDb = new AWS.DynamoDB({
    "region": process.env.AWS_REGION,
    "accessKeyId": process.env.AWS_ACCESS_KEY,
    "secretAccessKey": process.env.AWS_SECRET_KEY,
    "sessionToken": process.env.AWS_SESSION_TOKEN,
    "endpoint": process.env.AWS_DYNAMODB_ENDPOINT
});

const s3 = new AWS.S3({
    "region": process.env.AWS_REGION,
    "accessKeyId": process.env.AWS_ACCESS_KEY,
    "secretAccessKey": process.env.AWS_SECRET_KEY,
    "sessionToken": process.env.AWS_SESSION_TOKEN,
    "endpoint": process.env.AWS_S3_ENDPOINT
});

const getTravelMemoryPosts = async () => {
    try {
        const dynamoDBParams = { TableName: "travel_memory_post" };
        console.log(`dynamoDBParams: ${dynamoDBParams}`);
        const dynamoDBData = await dynamoDb.scan(dynamoDBParams).promise();
        console.log(`payload: ${dynamoDBData}`);
        return {
            message: "All Travel Memories",
            success: true,
            payload: dynamoDBData,
            statusCode: 200,
        };
    } catch (error) {
        console.log(error);
        return {
            message: "Internal Server Error",
            success: false,
            payload: undefined,
            statusCode: 500,
        };
    }
};

const postTravelMemoryPost = async (imageFile, body) => {
    try {
        const fileContent = fs.readFileSync(imageFile.path);
        const s3Params = { Bucket: process.env.AWS_S3_BUCKET, Key: Date.now().toString(), Body: fileContent };
        const s3Data = await s3.upload(s3Params).promise();
        const travelMemoryPost = {
            "post_id": { S: uuidv4().toString() },
            "userId": { S: body.userId },
            "postName": { S: body.postName },
            "postDescription": { S: body.postDescription },
            "postLocation": { S: body.postLocation },
            "postZipCode": { S: body.postZipCode },
            "postImageURL": { S: s3Data.Location.toString() },
            "createdAt": { S: new Date().toISOString() }
        };
        console.log(travelMemoryPost);
        const dynamoDBParams = { TableName: "travel_memory_post", Item: travelMemoryPost };
        await dynamoDb.putItem(dynamoDBParams).promise();
        return {
            message: "Travel Memory Uploaded Successfully",
            success: true,
            payload: travelMemoryPost,
            statusCode: 200,
        };
    } catch (error) {
        console.log(error);
        return {
            message: "Internal Server Error",
            success: false,
            payload: undefined,
            statusCode: 500,
        };
    }
}

module.exports = {
    getTravelMemoryPosts,
    postTravelMemoryPost,
}