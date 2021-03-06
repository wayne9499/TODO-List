var mongoose = require('mongoose');
const express = require('express');
var bodyparser = require('body-parser')
const app = express();
const cors = require('cors');
var bodyparser = require("body-parser");
var http = require('http').createServer(app);
const ObjectID = require('mongodb').ObjectID;
const bcrypt = require('bcryptjs');

app.use(bodyparser.urlencoded( { extended: true } ));
app.use(bodyparser.json());
app.use(cors());

const dbURL = 'mongodb://localhost/todo';

mongoose.connect(dbURL, { useNewUrlParser: true });

mongoose.connection.on('connected', function(){
    console.log("Mongoose default connection is open to " + dbURL);
});

mongoose.connection.on('error', function(err){
	console.log("Mongoose default connection has occurred "+err+" error");
});

mongoose.connection.on('disconnected', function(){
	console.log("Mongoose default connection is disconnected");
});

process.on('SIGINT', function(){
	mongoose.connection.close(function(){
		console.log("Mongoose default connection is disconnected due to application termination");
		process.exit(0)
	});
});


var taskSchema = new mongoose.Schema({
  title: {
    type: String,
    minlength: 1
  },
  due: Date,
  description: String,
  status: {
    type: String,
    enum: ['running', 'expired', 'finished']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high']
  },
  labels: {
    type: [String],
    lowercase: true,
    enum: ['personal', 'work', 'shopping','others']
  },
  userID: String  //every task would have a user association
}, {
  versionKey: false
});

//this makes sure that there are no two tasks with the same title and due date
taskSchema.index({title: 1, due: 1}, { unique: true });

var Task = new mongoose.model('Task', taskSchema);

var userSchema = new mongoose.Schema({
	firstName: String,
	lastName: String,
	email: {
		type: String,
		unique: true
	},
	password: String
}, {
  versionKey: false
});

var User = new mongoose.model('User', userSchema);

app.get('/allTasks', (req, res) => {
  Task.find({
    userID: req.query.userID
  }, (error, data) => {
    if (error) {
      console.log(error);
      res.send(error);
    } else {
      console.log(data);
      res.send(data);
    }
  });
});

app.post('/newTask', (req, res) => {
  var newTask = new Task({
    title: req.body.title,
    due: req.body.due,
    description: req.body.description,
    userID: req.body.userID,
    status: req.body.status,
    priority: req.body.priority,
    labels: req.body.labels
  });


  newTask.save((error) => {
    if (error) {
      console.log(error);
      res.send('Error while adding task. Try again.');
    } else {
      console.log('Task Added!');
      res.send('Task Added!');
    }
  });
});

app.post('/editTask', (req, res) => {
  Task.replaceOne({
    _id: ObjectID(req.body._id)
  },
  req.body
  , (error) => {
    if (error) {
      console.log(error);
      res.send('Error while editing task. Try again.');
    } else {
      console.log('Task Updated!');
      res.send('Task Updated!');
    }
  });
});

app.put('/updateStatus', (req, res) => {
  console.log(ObjectID(req.body.id))
  Task.updateOne(
  { _id: ObjectID(req.body.id) },
  { status: "finished" }
  , (error) => {
    if (error) {
      console.log(error);
      res.send('Error while updating status. Try again.');
    } else {
      console.log('Status updated to finished!');
      res.send('Status updated to finished!');
    }
  });
});

app.put('/deleteTask', (req, res) => {
  Task.deleteOne({
    _id: ObjectID(req.body._id)
  }, (error) => {
    if (error) {
      console.log(error);
      res.send('Error while deleting task. Try again.');
    } else {
      console.log('Task Deleted!');
      res.send('Task Deleted!');
    }
  });
});

app.post('/searchTask',(req,res) => {

    const regex = new RegExp(escapeRegex(req.body.text), 'gi');
    Task.find({
      $or: [{title: regex},{description: regex}],
      userID: req.body.userID
     },(err, data) => {
      if(err){
        console.log(err);
      }else{
        if(Object.keys(data).length == 0){
          rdata = {sdata: data,
            status: false};
        }else{
        rdata = {sdata: data,
                  status: true};
                }
      res.send(rdata);
      }
    })
  });
  app.post('/searchTaskfil',(req,res) => {
    var rdata = {};

    const regex = new RegExp(escapeRegex(req.body.text), 'gi');
    
    Task.find({
      $or: [{title: regex},{description: regex}],
      userID: req.body.userID, 
      labels: { $in: req.body.Labarr},
      priority: { $in: req.body.Priarr}
     },(err, data) => {
      if(err){
        console.log(err);
      }else{
        if(Object.keys(data).length == 0){
          rdata = {sdata: data,
            status: false};
        }else{
        rdata = {sdata: data,
                  status: true};
                }
      res.send(rdata);
      }
    })
  });

app.post('/signUp', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    console.log(hashedPassword);

    var newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPassword
    });

    newUser.save((error) => {
      if (error) {
        console.log(error);
        res.send('Error while adding User. Try again.');
      } else {
        console.log('User Added!');
        res.send('User Added!');
      }
    });
  } catch {
    res.status(500).send('Server Error!');
  }
});

app.post('/logIn', async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email
    });
    if (!user) {
      console.log('User not found');
      res.status(500).send('User not found');
    } else {
      const match = await bcrypt.compare(req.body.password, user.password);
      if (match) {
        res.send(user);
        console.log(user);
      } else {
        res.status(500).send('User not found.');
        console.log('User not found');
      }
    }

  } catch {
    res.status(500).send('Server Error!');
  }
});

app.put('/changePassword', async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email
    });
    if (!user) {
      console.log('User not found');
      res.status(500).send('User not found');
    } else {
      const match = await bcrypt.compare(req.body.currentPassword, user.password);
      if (match) {
        const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
        console.log(user.password);
        console.log(hashedPassword);
        User.updateOne({
          email: req.body.email
        }, {
          password: hashedPassword
        }, (error) => {
          if (error) {
            res.status(500).send();
            console.log('Server Error');

          } else {
            res.send('Password Updated');
            console.log('Password Updated');
          }
        });


      } else {
        res.status(500).send('Invalid Current Password');
        console.log('Invalid Current Password');
      }
    }

  } catch {
    res.status(500).send('Server Error!');
  }
});

http.listen(3000, () => {
  console.log('listening on http://localhost:3000');
});

function escapeRegex(text){
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  }

function filterres(data,Labarr,Priarr){
   
}
