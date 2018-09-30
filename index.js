const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();

//Must be used before Router Declaration
function modifyReqObj(req, res, next){
    req.body = {};
    req.files = [];
    next();
}

app.use(modifyReqObj)
app.use(function(req, res, next){
    
    res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': ['Content-Type'],
    });
    
    if(req.method === 'OPTIONS'){
        res.set('Access-Control-Allow-Methods', "GET, POST, PUT, DELETE, PATCH");
        return res.status(200).json({});
    }
    next();
    
});

const router = express.Router();

//Middleware
app.use('/api', router);

//Router
router.post('/encoding', fileParser, function(req, res){
    console.log(req.files)
    res.status(200).send(req.files);

});


const port = 3000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`))

function fileParser(req, res, next){

    //Check that Content-Type for multipart/form-data
    if(req.get('content-type') === 'multipart/form-data')
        handleData();

    function isFile(binaryData){
        return binaryData.search(/filename=/) !== -1;
    }

    function handleData(){
        let data = "";

        // Populate our data string with chunk values
        req.on('data', (chunk) => {
            data += chunk;
        });

        req.on('end', (err) => {

            if(err)
                throw new Error("ERROR: " + err);

            //Caputre form Boundary
            let boundary = data.match(/^.+$/m);
            //Split up all files 
            let binaryFiles = data.split(boundary);
            for(var i = 0; i < binaryFiles.length; i++){
    
                if(isFile(binaryFiles[i])){
    
                    let file = binaryFiles[i].match(/^(?!Content).+$/gm);
                    //console.log(file)
    
                    let mimeType = binaryFiles[i].match(/^content-type:.+/mi)[0];
                    //console.log(mimeType)
    
                    let fileExtension = mimeType.split('/')[1];
                    //console.log(fileExtension)
    
                    let contentDisposition = binaryFiles[i].match(/^content-disposition:.+/igm)[0];
                    //console.log(contentDisposition)
    
                    let inputData = contentDisposition.match(/(["']\w.+?['"])/mig)
                    let formInputName = inputData[0].replace(/["]/mig, "");
                    let fileName = inputData[1].replace(/["]/mig, "");
    
                    //Removes file extension off of the end of file name
                    let nameParts = fileName.split(".");
                    nameParts.pop();
                    fileName = nameParts.join(".");

                    req.files.push({
                        mimeType,
                        fileExtension,
                        fileName,
                        location: `tmp/${fileName}.${fileExtension}`
                    });

                    fs.writeFile(`tmp/${fileName}.${fileExtension}`, file, 'base64', (err) => {
                        if(err)
                            throw new Error(err);
                    });
                }
            }

            next();
        });

    }

    next();

}