const express=require('express');
const ejs=require('ejs');
const mysql=require('mysql2');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const app=express();

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'key',
  resave: false,
}));

app.set('views', './views');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const con = mysql.createConnection({
  host: "localhost",
  user: "root", // Replace "root" with your username
  password: "DBMS2022" // Replace "DBMS2022" with your password
});

con.connect((err) => {
  if (err){
    console.log(err);
  } 
  console.log("Connected!");
});


con.connect(function(err) {
    if (err){
        console.log(err);
    } 
    con.query("CREATE DATABASE mydb;", (err, result) => {
        if (err){
            console.log(err);
        } 
        console.log("Database created");
    });
    con.query("USE mydb;", (err, result)=>{
      if(err){
        console.log(err);
      }
      console.log("Using mydb");
    })
    con.query("CREATE TABLE users (ID varchar(255) NOT NULL, password varchar(255) NOT NULL, PRIMARY KEY(ID));", (err, result)=>{
      if(err){
        console.log(err);
      }
      console.log("user table created");
    })
    con.query("CREATE TABLE details (name varchar(255) NOT NULL, age int NOT NULL, gender varchar(255) NOT NULL, num int NOT NULL, ID varchar(255) NOT NULL, FOREIGN KEY (ID) REFERENCES users (ID));", (err, result)=>{
      if(err){
        console.log(err);
      }
      console.log("details table created");
    })
    con.query("CREATE TABLE traits (ori varchar(255) NOT NULL, edu varchar(255) NOT NULL, city varchar(255) NOT NULL, ID varchar(255) NOT NULL, FOREIGN KEY (ID) REFERENCES users (ID));", (err, result)=>{
      if(err){
        console.log(err);
      }
      console.log("traits table created");
    })
  });

app.get('/register', (req, res)=>{
    res.render('register');
})

app.post('/register', (req, res)=>{
  const { ID, password, name, age, num, edu, gender}=req.body;
  const ori=req.body.ori.toLowerCase();
  const city=req.body.city.toLowerCase();

  con.query("INSERT INTO users VALUES ('"+ID+"','"+password+"')", (err, result)=>{
    if(err){
      console.log(err);
    }
    else{
      console.log("Successfully added user!");
    }
  })

  con.query("INSERT INTO details VALUES ('"+name+"','"+age+"', '"+gender+"', '"+num+"', '"+ID+"')", (err, result)=>{
    if(err){
      console.log(err);
    }
    else{
      console.log("Successfully added into details!");
    }
  })

  con.query("INSERT INTO traits VALUES ('"+ori+"','"+edu+"', '"+city+"', '"+ID+"')", (err, result)=>{
    if(err){
      console.log(err);
    }
    else{
      console.log("Successfully added into traits!");
    }
  })

  req.session.user_id=ID;
  global.sessionTemp=ID;

  res.redirect('/find');
})

app.get('/login', (req, res)=>{
  res.render('login');
})

app.post('/login', (req, res)=>{
  const { ID, password }=req.body;
  var sqlq=`SELECT * FROM users WHERE ID = '${ID}'`;
  con.query(sqlq, (err, result)=>{
    console.log(result);
    if(err){
      return console.log(err);
    }
    if(!result){
      res.redirect('/login');
    }
    else{
      if(password===result[0].password){
        req.session.user_id=result[0].ID;
        global.sessionTemp=result[0].ID;
        console.log('Successfully logged in');
        res.redirect('/find');
      }
      else{
        res.redirect('/login');
      }
    }
  })
})

app.get('/find', (req, res)=>{
  if(!req.session.user_id){
    res.redirect('/login');
  }
  res.render('find');
})


app.post('/find', (req, res)=>{


    const traits={};
    var ori;
    if(req.body.ori){
      ori=req.body.ori.toLowerCase();
      traits.ori=ori;
    }
    var gender;
    if(req.body.gender){
      gender=req.body.gender;
      traits.gender=gender;
    }
    var edu;
    if(req.body.edu){
      edu=req.body.edu;
      traits.edu=edu;
    }
    var city;
    if(req.body.city){
      city=req.body.city;
      traits.city=city;
    }
    var age;
    if(req.body.age){
      age=req.body.age;
      traits.age=age;
    }
    console.log(traits);
    var sqlq;
    if(!traits.city && !traits.edu && !traits.ori && !traits.gender && !traits.age){
      sqlq='SELECT users.ID, password, name, age, gender, num, ori, edu, city FROM users INNER JOIN details INNER JOIN traits ON details.ID=users.ID && traits.ID=users.ID;';
    }else{
      var temp=``;
      for (const key in traits) {
        if(key=='age'){
          temp+=`${key}<'${traits[key]}' && `;
        }
        else{
          temp+=`${key}='${traits[key]}' && `;
        }                
      }
      temp=temp.slice(0,-3);
      sqlq=`SELECT users.ID, password, name, age, gender, num, ori, edu, city FROM users INNER JOIN details INNER JOIN traits ON details.ID=users.ID && traits.ID=users.ID where `+temp+`;`;
    }
    console.log(sqlq);
    con.query(sqlq, (err, result, fields)=>{
      if(err){
        console.log(err);
      }
      else{
        console.log(result);
        res.render('list', {result}); 
      }
    })
    
})

app.get('/logout', (req, res)=>{
  req.session.destroy()
  global.sessionTemp=null;
  res.redirect('/');
})

app.get('/profile', (req, res)=>{
  if(!req.session.user_id){
    res.redirect('/login');
  }
  else{
    const ID=req.session.user_id;
    var sqlq=`SELECT details.ID, name, age, gender, num, ori, edu, city FROM details INNER JOIN traits ON details.ID='${ID}' && traits.ID='${ID}';`;
    var age, name, gender, num, ori, edu, city;
    con.query(sqlq, (err, result)=>{
        if(err){
          console.log(err);
        }
        else{
          console.log(result);
        age=result[0].age;
        name=result[0].name;
        gender=result[0].gender;
        num=result[0].num;
        ori=result[0].ori;
        edu=result[0].edu;
        city=result[0].city;
        res.render('profile', {ID, age, name, gender, num, ori, edu, city});
        }
    })
  }
  
})

app.get('/', (req, res)=>{
    res.render('home');
})


app.listen(3000, ()=>{
    console.log('Listening on port 3000');
})