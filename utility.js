var mongoose = require('mongoose');
var schema = require('./schema');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var User = schema.User;
var Task = schema.Task;
var url = 'mongodb://localhost/tasks';

mongoose.connect(url);

exports.getUsers = function (callback){
  User.find({}, {'_id': 0, 'name': 1, 'tasks': 1, 'tasks.title': 1}, callback);
};

exports.createUser = function (name, pass, callback) {
  var params = {};

  if (name) params.name = name;
  if (pass) params.password = pass;

  var user = new User(params);
  user.save(function(err) {
    callback(err, user);
  });
};

exports.editUser = function (name, newParams, callback) {
  User.findOne({name: name}, function(err, user){
    if (err) callback(err);

    if (newParams.name) user.name = newParams.name;
    if (newParams.pass) user.password = newParams.pass;

    user.save(function(err) {
      callback(err, user);
    });
  });
};

exports.deleteUser = function (name, callback) {
  User.remove({name: name}, callback);
};

exports.getTasks = function (callback){
  Task.find(
    {},
    {'_id': 0, 'title': 1, 'description': 1, 'date': 1, 'open': 1},
    callback
  );
};

exports.createTask = function (title, description, date, open, callback) {
  var params = {};

  if (title) params.title = title;
  if (description) params.description = description;
  if (date) params.date = date;
  params.open = open;

  var task = new Task(params);

  task.save(callback);
};

exports.editTask = function (title, newParams, callback) {
  Task.findOne({title: title}, function(err, task){
    if (err) callback(err);
    if (newParams.title) task.title = newParams.title;
    if (newParams.description) task.description = newParams.description;
    if (newParams.date) task.date = newParams.date;
    if (newParams.open) task.open = newParams.open;

    task.save(function(err) {
      callback(err, task);
    });
  })
};

exports.deleteTask = function (title, callback) {
  Task.remove({title: title}, callback);
};

exports.changeTaskStatus = function (title, open, callback) {
  Task.findOne({title: title}, function(err, task){
    if (err) callback(err);

    task.open = open;

    task.save(function(err) {
      callback(err, task);
    });
  })
};

exports.setTaskToUser = function (name, title, callback) {
  User.findOne({name: name}, function(err, user){
    if (err) callback(err);
    if (user){
      Task.findOne({title: title}, function(err, task){

          user.tasks.push(task);
          user.save(function(err) {
            if (err) callback(err);
            callback(err, user);
          });
      });
    }
    else callback('User not found');
  });
};

exports.findTask = function(someStr, callback) {
  MongoClient.connect(url, (err, db) => {
    if(err) callback(err);
    else {
      let tasks = db.collection('tasks');
      tasks.aggregate([
        {$match: {$or: [
          {title: new RegExp(someStr)},
          {description: new RegExp(someStr)}
        ]}},
        {$project : {_id:0, title:1, description:1, date:1, open:1}}
      ]).toArray(function(err, result) {
       if(err) callback(err);
       callback(err, result);
     });
    }
  });
};

exports.getReport = function(callback) {
  MongoClient.connect(url, (err, db) => {
    if(err) callback(err);
    else {
      let users = db.collection('users');
      users.aggregate([
        {$match: {"tasks.open": false}},
        {
         $project: {
            name: 1,
            tasks: {
              $filter:{
                input: "$tasks",
                as: "task",
                cond: { $eq: [ "$$task.open", false ] }
              }
            }
         }
        },
        {
         $project: {
            _id: 0,
            name: 1,
            cnt: {$size : "$tasks"}
         }
        },
        {$sort: {cnt: -1}}
      ]).toArray(function(err, result) {
       if(err) callback(err);
       else callback(err, result);
     });
    }
  });
};
