const workWithDB = require('./utility');
const express = require("express");
const bodyParser = require('body-parser');
const app = express();
const rtAPI = express.Router();
const rpcAPI = express.Router();

class User {
  constructor (id, name, score){
    this.id = id;
    this.name = name;
    this.score = score;
  }
  toString(){
    return {
      id: this.id,
      name: this.name,
      score: this.score
    };
  }
}

class Users extends Array {
  constructor(...users){
    super(...users);
  }
  findByParam(param, val){
    let fItem, fIndex;

    this.forEach(function(item, index){
      if (item[param] == val) {
        fItem = item;
        fIndex = index;
      }
    });

    if(arguments.length == 3) return fIndex;
    return fItem;
  }
}

let users = new Users();
users.push(new User(1, 'User1', 15));
users.push(new User(2, 'User2', 40));
users.push(new User(3, 'User3', 23));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended": true}));

let setLimit = (arr, offset, limit) => {
  return arr.slice(
    offset,
    offset + limit
  );
};

let setFields = (arr, fields) => {
  let newArr = new Users();

  arr.forEach((item) => {
    let newItem = {};

    for (let param of fields){
      newItem[param] = item[param];
    }

    newArr.push(newItem);
  });

  return newArr;
};

rtAPI.get("/users", function(req, res) {
  let callback = function(err, users){
    if (err) res.send(401, "Users not found");
    let newUsers = users;

    if('limit' in req.query && 'offset' in req.query){
      newUsers = setLimit(newUsers, parseInt(req.query.offset), parseInt(req.query.limit));
    }
    if('fields' in req.query){
      let fields = req.query.fields.split(',');
      newUsers = setFields(newUsers, fields);
    }

    res.json(newUsers);
  };
  workWithDB.getUsers(callback);
});

rtAPI.post("/users", function(req, res) {
  let name = req.body.name,
      pass = req.body.pass;

  if (!name) res.send(401, "User must have unique name");

  let callback = function(err, user){
    if (err) res.send(500, "User not created");
      res.json({name: user.name});
  }

  workWithDB.createUser(name, pass, callback);
});

rtAPI.put("/users/:name", function(req, res) {
  let name = req.body.name,
      pass = req.body.pass,
      params = {
        name: name,
        pass: pass
      };

  let callback = function(err, user){
    if (err) res.send(500, "User not modified");
    res.json({name: user.name});
  }

  workWithDB.editUser(name, params, callback);
});

rtAPI.delete("/users/:name", function(req, res) {
  let name = req.params.name;

  let callback = function(err){
    if (err) res.send(401, "User not found");
    res.send(200, "User deleted");
  }

  workWithDB.deleteUser(name, callback);
});

rtAPI.put("/users/:name/:title", function(req, res) {
  let name = req.params.name,
      title = req.params.title;

  let callback = function(err){
    if (err) res.send(500, err);
    else res.send(200, "Save task for user");
  }

  workWithDB.setTaskToUser(name, title, callback);
});

rtAPI.get("/tasks", function(req, res) {
  let callback = function(err, tasks){
    if (err) res.send(401, "Tasks not found");
    let newTasks = tasks;

    if('limit' in req.query && 'offset' in req.query){
      newTasks = setLimit(newTasks, parseInt(req.query.offset), parseInt(req.query.limit));
    }
    if('fields' in req.query){
      let fields = req.query.fields.split(',');
      newTasks = setFields(newTasks, fields);
    }

    res.json(newTasks);
  };

  workWithDB.getTasks(callback);
});

rtAPI.get("/tasks/:string", function(req, res) {
  let string = req.params.string;

  let callback = function(err, task){
    if (err) res.send(401, "Task not found");

    res.json(task);
  };

  workWithDB.findTask(string, callback);
});

rtAPI.post("/tasks", function(req, res) {
  let title = req.body.title,
      description = req.body.description,
      date = req.body.date,
      open = req.body.open;

  if (!title) res.send(401, "Task must have unique title");

  let callback = function(err, task){
    if (err) res.send(500, "Task not created");
    res.json({title: task.title});
  }

  workWithDB.createTask(title, description, date, open, callback);
});

rtAPI.put("/tasks/:title", function(req, res) {
  let title = req.body.title;

  if (!title) res.send(401, "Task must have unique title");

  let callback = function(err, task){
    if (err) res.send(500, "Task not modified");
    res.json({title: task.title});
  }
  if (!('description' in req.body) || !('date' in req.body))
    workWithDB.changeTaskStatus(title, req.body.open, callback);
  else workWithDB.editTask(title, req.body, callback);
});

rtAPI.delete("/tasks/:title", function(req, res) {
  let title = req.params.title;

  let callback = function(err){
    if (err) res.send(401, "Task not found");
    res.send(200, "Task deleted");
  }

  workWithDB.deleteTask(title, callback);
});

rtAPI.get("/report", function(req, res) {
  let callback = function(err, result){
    if (err) res.send(500, "Error");
    res.json(result);
  };
  workWithDB.getReport(callback);
});

app.use("/api/rt", rtAPI);
app.listen(1337);
