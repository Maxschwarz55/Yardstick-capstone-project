// Load the SDK
var AWS = require('aws-sdk');
const bucket = 'yardstik-bucket' // the bucket name without s3://
const photo_source = 'patrick_1.jpeg' // path and the name of file
//const photo_source = 'adam_jones.jpeg' // path and the name of file
const photo_target = 'patrick_2.jpeg'

var credentials = new AWS.SharedIniFileCredentials({ profile: 'default' });
AWS.config.credentials = credentials;
AWS.config.update({ region: 'us-east-2' });

const client = new AWS.Rekognition();
const params = {
    SourceImage: {
        S3Object: {
            Bucket: bucket,
            Name: photo_source
        },
    },
    TargetImage: {
        S3Object: {
            Bucket: bucket,
            Name: photo_target
        },
    },
    SimilarityThreshold: 0 
}
client.compareFaces(params, function (err, response) {
    if (err) {
        console.log(err, err.stack); // an error occurred
    } else {
        response.FaceMatches.forEach(data => {
            let position = data.Face.BoundingBox
            let similarity = data.Similarity
            console.log(`The face at: ${position.Left}, ${position.Top} matches with ${similarity} % confidence`)
        }) // for response.faceDetails
    } // if
});
