const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const QRCode = require("qrcode");
const path = require("path");


const port = process.env.PORT || 5000

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.get("/",function(req,res) {
    res.render("index");
});

app.post("/scan", (req,res) =>{
    const url = req.body.url;

if(url.length === 0)res.send("Empty Data!");

QRCode.toDataURL(url,(err,src) =>{
    if(err) res.send("Error occured");
    res.render("scan", {src,url});
});
   

});



app.get("/sucess", function(req,res){
    app.use(express.static(path.join(__dirname, 'public')))
    res.render("sucess");
});
app.listen(port, (error) => {     
    if(!error)
        console.log("Server is Successfully Running,and App is listening on port "+ port);
    else
        console.log("Error occurred, server can't start", error);
    }
);
