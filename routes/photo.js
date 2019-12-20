		var express = require('express');
		var router = express.Router();
		var mongo = require('mongo');
		var MongoClient = require('mongodb').MongoClient;
		var url = 'mongodb://localhost/data';
		var session  = require('express-session');
		var bodyParser = require('body-parser');
		var multer = require('multer');
		var upload = multer(); 
		var axios = require('axios');
		var path = require('path');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true })); 
router.use(upload.array());
//router.use(cookieParser());
router.use(session({secret: "Bamboo Album"}));

router.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});

	router.post('/upload',function(req,res,next){
	var photoUrl = req.body.url;
	var user = req.session.user.toString();
	axios({
	  method: 'post',
	  url: uriBase,
	  headers: {
	        "Content-Type" : "application/json",
	        "Ocp-Apim-Subscription-Key" : subscriptionKey
	    },
	  params : {
	        "visualFeatures": "Description",
	            "details": "",
	            "language": "en"
	        },
	    data : {"url" : photoUrl}   
	})
	.then(function(response) {
	MongoClient.connect(connectionString,function(err,client){
		if (err) res.send("error");
		var dbo = client.db("userImage");
		req.body["tags"] = response.data.description.tags;
		dbo.collection(user).insertOne(req.body,function(err,response){
		if (err) throw res.send("error");
		else res.send("success");
		client.close();			
	});
	});
	}).catch((error) => {
res.send("error");
}); 
	});

function checkAllTags(image, tags){
	for (var i=0; i < tags.length; i++){
		if(!image["tags"].includes(tags[i]))
			return false;
	}
	return true;
}

function photoFilter(images,tags) {
	var ans = [];
	for (var i = 0; i<images.length; i++)
		if(checkAllTags(images[i], tags))
			ans.push(images[i].url);
	return ans;
}

function getUrls(images) {
	var ans = [];
	for (var i = 0; i<images.length; i++)
			ans.push(images[i].url);
	return ans;
}

	router.post('/filter',function(req,res,next){
		var user = req.session.user.toString();
		MongoClient.connect(connectionString,function(err,client){
		if (err) throw err;
		var dbo = client.db("userImage");
		dbo.collection(user).find({}).toArray(function(err,result){
		if (err) throw err;
		var urls = photoFilter(result,req.body.tags);
		var filterPhoto = { "urls" : urls }; 
		res.send(filterPhoto);
		});
	});
	});

	router.post('/all',function(req,res,next){
		var user = req.session.user.toString();
		console.log(user);
		MongoClient.connect(connectionString,function(err,client){
		if (err) throw err;
		var dbo = client.db("userImage");
		dbo.collection(user).find({}).toArray(function(err,result){
		if (err) throw err;
		var urls = getUrls(result);
		var filterPhoto = { "urls" : urls }; 
		res.send(filterPhoto);
		});
	});
	});
	

router.post('/delete',function(req,res,next){
	    var user = req.session.user.toString();
		MongoClient.connect(connectionString,function(err,client){
		if (err) throw err;
		var dbo = client.db("userImage");
		var myquery = { url : req.body.url };
		dbo.collection(user).deleteOne(myquery,function(err,result){
		if (err) throw err;
		var urls = getUrls(result);
		res.send("1 document deleted");
		client.close();
		});
	});
	});

router.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  if (req.session.user == null) res.send("Please login first!");
});



/*
	router.post('/test',function(req,res,next){
	MongoClient.connect(connectionString,function(err,client){
		if (err) res.send("error");
		console.log(err);
		console.log(client);
		var dbo = client.db("test");
		dbo.collection("please").insertOne("123",function(err,response){
		if (err) throw res.send("error");
		else res.send("success");
		client.close();			
	});
	});
});

*/
	module.exports = router;
