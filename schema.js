var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TaskSchema = new Schema({
  title: String,
  description: String,
  date: Date,
  open: Boolean
});

var UserSchema = new Schema({
  name : {
    type: String,
    unique: true
  },
  password: String,
  tasks: [TaskSchema]
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Task: mongoose.model('Task', TaskSchema)
}
