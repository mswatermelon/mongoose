var mongoose = require('mongoose');
var schema = require('./schema');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var User = schema.User;
var Task = schema.Task;
var url = 'mongodb://localhost/tasks';

mongoose.connect(url);

var createUser = function (name, pass) {
  if (!name) console.log('У пользователя должно быть уникальное имя');
  var params = {};

  if (name) params.name = name;
  if (pass) params.pass = pass;

  var user = new User(params);
  user.save(function(err) {
    if (err) console.log('Ошибка при сохранения');
  });
};

var editUser = function (name, newParams) {
  User.findOne({name: name}, function(err, user){
    if (err) console.log('Пользователь не найден');
    if (newParams.name) user.name = newParams.name;
    if (newParams.password) user.password = newParams.password;
    user.save(function(err) {
      if (err) console.log('Ошибка при сохранения');
    });
  })
};

var deleteUser = function (name) {
  User.remove({name: name}, function(err){
    if (err) console.log('Ошибка при удалении пользователя');
  })
};

var createTask = function (title, description, date, status) {
  if (!title) console.log('У задачи должен быть заголовок');
  var params = {};

  if (title) params.title = title;
  if (description) params.description = description;
  if (date) params.date = date;
  if (status) params.status = status;

  var task = new Task(params);

  task.save(function(err) {
    if (err) console.log('Ошибка при сохранения');
  });
};

var editTask = function (title, newParams) {
  Task.findOne({title: title}, function(err, task){
    if (err) console.log('Задача не найдена');
    if (newParams.title) task.title = newParams.title;
    if (newParams.description) task.description = newParams.description;
    if (newParams.date) task.date = newParams.date;
    if (newParams.status) task.status = newParams.status;
    task.save(function(err) {
      if (err) console.log('Ошибка при сохранения');
    });
  })
};

var deleteTask = function (title) {
  Task.remove({title: title}, function(err){
    if (err) console.log('Ошибка при удалении задачи');
  })
};

var changeTaskStatus = function (title, status) {
  Task.findOne({title: title}, function(err, task){
    if (err) console.log('Задача не найдена');

    if (status) task.open = status;

    task.save(function(err) {
      if (err) console.log('Ошибка при сохранения');
    });
  })
};

var setTaskToUser = function (name, title) {
  User.findOne({name: name}, function(err, user){
    if (err) console.log('Пользователь не найден');
    console.log(user.tasks);
    Task.findOne({title: title}, function(err, task){
      user.tasks.push(task);
      user.save(function(err) {
        if (err) console.log('Ошибка при сохранения', err);
      });
    });
  });
};

var findTask = function(someStr, callback) {
  MongoClient.connect(url, (err, db) => {
    if(err) console.log('Невозможно подключиться к базе:', err);
    else {
      let tasks = db.collection('tasks');
      tasks.aggregate([
        {$match: {$or: [
          {title: new RegExp(someStr)},
          {description: new RegExp(someStr)}
        ]}}
      ]).toArray(function(err, result) {
       if(err) console.log('При поиске произошла ошибка:', err);
       console.log(result);
       if (callback) callback(result);
     });
    }
  });
};

var getReport = function(callback) {
  MongoClient.connect(url, (err, db) => {
    if(err) console.log('Невозможно подключиться к базе:', err);
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
            name: 1,
            cnt: {$size : "$tasks"}//: { $eq: [ "$tasks.open", false ] }}}
         }
        },
        {$sort: {cnt: -1}}
      ]).toArray(function(err, result) {
       if(err) console.log('При поиске произошла ошибка:', err);
       for(var i=0;i<result.length;i++){
         console.log(result[i].name, result[i].cnt);
       }
       if (callback) callback(result);
     });
    }
  });
};

getReport();
