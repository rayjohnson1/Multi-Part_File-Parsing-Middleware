const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();

//Must be used before Router Declaration
function modifyReqObj(req, res, next){
    req.body = {};
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
router.post('/encoding', function (req, res, next){
    let data = "";
    req.on('data', (chunk) => {
        
        data += chunk;
    });

    req.on('end', (err) => {

        let boundary = data.match(/^.+$/m);
        data = data.split(boundary);
        console.log(data.length)
        req.body.files = [];
        for(var i = 0; i < data.length; i++){
            
            let isFile = false;
            if(data[i].search(/filename=/) !== -1)
                isFile = true;

            if(isFile){

                let file = data[i].match(/^(?!Content).+$/gm)
                //console.log(file)

                let mimeType = data[i].match(/^content-type:.+/mi)[0];
                //console.log(mimeType)

                let fileExtension = mimeType.split('/')[1]
                //console.log(fileExtension)

                let contentDisposition = data[i].match(/^content-disposition:.+/igm)[0];
                //console.log(contentDisposition)

                let inputData = contentDisposition.match(/(["']\w.+?['"])/mig)
                let formInputName = inputData[0].replace(/["]/mig, "");
                let fileName = inputData[1].replace(/["]/mig, "");;
                
                req.body.files.push({
                    mimeType,
                    fileExtension,
                    fileName,
                    location: `tmp/${fileName}${i}.${fileExtension}`
                })
                fs.writeFile(`tmp/${fileName}${i}.${fileExtension}`, file, 'base64', () => {
                    //console.log(`uploaded file ${i}`)
                });
                

            }//else
                //console.log('This wasnt a file so we skipped')

        }
        next();
    });

    

}, function(req, res){
    console.log(req.body)
});


const port = 3000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
