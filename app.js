const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require('mongoose')
const _ = require('lodash')


const app = express()

app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static("public"))

//-----------DB settings with mongoose--------------------
mongoose.connect('mongodb://localhost:27017/todolistDB', {useNewUrlParser: true})
const itemsSchema = {
  name: String
}
const Item = mongoose.model('Item', itemsSchema)

//-----data(documents) examples--------
const item1 = new Item({
  name : 'Welcome to youe todolist!'
})
const item2 = new Item({
  name : 'Hit the + button to add a new item.'
})
const item3 = new Item({
  name : '<-- Hit this to delete an item.'
})

const defaultItems = [item1, item2, item3]

//-----category list schema--------
const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model('List', listSchema)

//------------------------------------


app.get("/", function(req, res) {
  // find()はリストを返す!!
  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0){
      // insert the default items data into DB
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err)
        } else {
          console.log('Successfully saved data!')
        }
        res.redirect('/')
      })
    } else {
    res.render("list", {listTitle: 'Today', newListItems: foundItems})
    }
  })
})

app.post("/", function(req, res){
  const category = req.body.list
  const itemName = req.body.newItem
  const item = new Item({name: itemName})

  if(req.body.list === 'Today'){
    item.save(function(err){
      if(err){
        console.log(err)
      }
    })
    res.redirect('/')
  } else {
    List.findOne({name: category}, function(error, foundList){
      foundList.items.push(item)
      foundList.save(function(err){
        if(err){
          throw err
        } else {
          res.redirect(`/${category}`)
        }
      })
    })
  }
})

app.post('/delete', function(req, res){
  const checkedItemId = req.body.checkbox
  const category = req.body.list

  if(category === 'Today'){
    Item.deleteOne({_id: checkedItemId}, function(err){
      if(err){
        console.log(err)
      } else {
        console.log('Successfully deleted')
        res.redirect('/')
      }
    })
  } else {
    List.findOneAndUpdate(
      {name: category}, //何のlistから？
      // $pullオペレーターを使って、arrayの名前は何か、消したいドキュメント(obj)はどれか？
      {$pull: {items:{_id:checkedItemId}}},
      // findOneAndUpdateはコールバックに更新したオブジェクト(ここだとlistコレクションから探したlist obj)を返す
      // update()はエラーしかコールバックに渡さない
      function(err, foundList){
        if(!err){
          res.redirect(`/${category}`)
        }
      }
    )
  }
})


app.get('/:name', function(req, res){
  const category = _.capitalize(req.params.name)
  console.log(category);

  // findOne()はオブジェクト（１つ）を返す!!
  // find()はリストを返す!!
  List.findOne({name:category},function(err, foundList){
    if(!foundList){
      const list = new List({name:category, items:defaultItems})
      list.save(function(err) {
        if (err){
          throw err;
        } else {
          res.redirect(`/${category}`)
        }
      })
    } else {
      // show an existing list
      res.render('list', {listTitle: category, newListItems: foundList.items})
    }
  })
})



app.get("/about", function(req, res){
  res.render("about")
})




app.listen(3000, function() {
  console.log("Server started on port 3000")
})
