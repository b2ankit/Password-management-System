var express = require('express');
var router = express.Router();

var userModule = require('../modules/user');

var passcatModel = require('../modules/password_category');

var passModel = require('../modules/add_password');

var bcrypt = require('bcryptjs');

var jwt = require('jsonwebtoken');

const { check, validationResult } = require('express-validator');


var getPassCat = passcatModel.find({});
var getAllPass = passModel.find({});


if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}




/* Middleware*/ 
function checkEmail(req,res,next){
var email = req.body.email;
var checkemail = userModule.findOne({email:email});
checkemail.exec((err,data)=>{
  if(err) throw err;
  if(data){
   return res.render('signup', { title: 'Password Management System',msg:'Email Alredy used' });
  }
  next();
});
}


function checkusername(req,res,next){
  var username = req.body.uname;
  var checkusername = userModule.findOne({username:username});
  checkusername.exec((err,data)=>{
    if(err) throw err;
    if(data){
     return res.render('signup', { title: 'Password Management System',msg:'userName Alredy Exsist' });
    }
    next();
  })
  }
  

function checkLoginUser(req,res,next){
  var usertkn = localStorage.getItem('userToken');
  try {
    jwt.verify(usertkn, 'LoginToken');
  } catch(err) {
    res.redirect('/');
  }
  next();
}


/* GET home page. */
router.get('/', function(req, res, next) {
  var loginUser = localStorage.getItem('loginUser');
  if(loginUser){
    res.redirect('./dashboard');
  }
  else{
  res.render('index', { title: 'Password Management System',msg:'' });
  }
});

router.post('/', function(req, res, next) {
  var username=req.body.uname;
  var password=req.body.password;
  var checkUser = userModule.findOne({username:username});
  checkUser.exec((err,data)=>{
    if(err) throw err;
    var getUserId=data.id;
    var getpassword = data.password;
    if(bcrypt.compareSync(password,getpassword)){
      var token = jwt.sign({userID:getUserId},'LoginToken');
      localStorage.setItem('userToken',token);
      localStorage.setItem('loginUser',username);
      res.redirect('/dashboard');
    }else{
      res.render('index', { title: 'Password Management System',msg:'invalid username/password' });
    }


  })
  
});

router.get('/dashboard', checkLoginUser, function(req, res, next) {
  var user = localStorage.getItem('loginUser');
  res.render('dashboard', { title: 'Dashboard',loginUser:user });
});


router.get('/signup',  function(req, res, next) {
  var loginUser = localStorage.getItem('loginUser');
  if(loginUser){
    res.redirect('./dashboard');
  }
  else{
  res.render('signup', { title: 'Password Management System',msg:'' });
  }
});
router.post('/signup',checkEmail,checkusername, function(req, res, next) {

  var username = req.body.uname;
  var email = req.body.email;
  var password = req.body.password;
  var confirmpassword = req.body.confirmpassword;

  if(password!=confirmpassword){
    res.render('signup', { title: 'Password Management System',msg:'Pasword Mismatch' });
  }
else{
  password=bcrypt.hashSync(req.body.password,10); 
  var userDetails = new userModule({
    username:username,
    email:email,
    password:password
  });

  userDetails.save((err,doc)=>{
    if(err) throw err;
    res.render('signup', { title: 'Password Management System',msg:'User Register Successfully' });
  })
}
});

router.get('/passwordCategory', checkLoginUser, function(req, res, next) {
  var user = localStorage.getItem('loginUser');
  getPassCat.exec(function(err,data){
    if(err) throw err
    res.render('password_category', { title: 'Password Category List',loginUser:user,records:data });
  })

});
router.get('/passwordCategory/delete/:id', checkLoginUser, function(req, res, next) {
  var user = localStorage.getItem('loginUser');
  var passcat_id=req.params.id;
  var passdelete = passcatModel.findByIdAndDelete(passcat_id);
  passdelete.exec(function(err){
    if(err) throw err;
    res.redirect('/passwordCategory');
  })
});

router.get('/passwordCategory/edit/:id', checkLoginUser, function(req, res, next) {
  var user = localStorage.getItem('loginUser');
  var passcat_id=req.params.id;
  var getpassCategory = passcatModel.findById(passcat_id);
  getpassCategory.exec(function(err,data){
    if(err) throw err;
    
    res.render('edit_pass_category', { title: 'Password Category List',errors:'',success:'',loginUser:user,records:data,id:passcat_id});
  })
});


router.post('/passwordCategory/edit/', checkLoginUser, function(req, res, next) {
  var user = localStorage.getItem('loginUser');
  var passcat_id=req.body.id;
  var passwordCategory=req.body.passwordCategory;
  var update_passCat = passcatModel.findByIdAndUpdate(passcat_id,{password_category:passwordCategory});
  update_passCat.exec(function(err,data){
    if(err) throw err;
    
    res.redirect('/passwordCategory');
  })
});




router.get('/add-new-category', checkLoginUser, function(req, res, next) {
  var user = localStorage.getItem('loginUser');
  res.render('addNewCategory', { title: 'Add Password Category',loginUser:user,errors:'',success:'' });
});
router.post('/add-new-category', checkLoginUser,[ check('passwordCategory','Enter Password Category Name').isLength({ min: 1 })] ,function(req, res, next) {
  var user = localStorage.getItem('loginUser');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render('addNewCategory', { title: 'Add Password Category',loginUser:user,errors:errors.mapped().passwordCategory.msg ,success:'' });
  }
  else{
    var passCatName = req.body.passwordCategory;

    var passcatDetails = new passcatModel({password_category:passCatName});
    passcatDetails.save(function(err,doc){
      if(err) throw err;
      res.render('addNewCategory', { title: 'Add Password Category',loginUser:user,errors:'',success:'Password category inserted Sucessfully' });
    })
  
  }
});


router.get('/add-new-password', checkLoginUser, function(req, res, next) {
  var user = localStorage.getItem('loginUser');
  getPassCat.exec(function(err,data){
    if(err) throw err;
    res.render('add-new-password', { title: 'Add new Password',loginUser:user,records:data ,success:''});
  })
 
});

router.post('/add-new-password', checkLoginUser, function(req, res, next) {
  var user = localStorage.getItem('loginUser');

  var pass_cat = req.body.pass_cat;
  var project_name = req.body.project_name;
  var pass_detail = req.body.pass_details;

  var password_details =  new passModel({
    password_category:pass_cat,
    project_name:project_name,
    password_detail:pass_detail
  });
  password_details.save(function(err,doc){
    getPassCat.exec(function(err,data){
      if(err) throw err;
      res.render('add-new-password', { title: 'Add new Password',loginUser:user,records:data,success:'password details successfully inserted' });
  });
  });
 
});

router.get('/view-all-password', checkLoginUser, function(req, res, next) {
  var user = localStorage.getItem('loginUser');
  getAllPass.exec(function(err,data){
    if(err) throw err;
    res.render('view-all-password', { title: 'All Password List',loginUser:user,records:data });
  })
  
});
router.get('/password-details', checkLoginUser, function(req, res, next) {
 res.redirect('/dashboard')
  
});

router.get('/password-details/edit/:id', checkLoginUser, function(req, res, next) {
  var user = localStorage.getItem('loginUser');
  var id= req.params.id;
  var getPassDetails = passModel.findById({_id:id});
  getPassDetails.exec(function(err,data){
    if(err) throw err;
    getPassCat.exec(function(err,data1){
      res.render('edit_password_details',{title:'Password Management System',loginUser:user,records:data1,record:data,success:''})
    })
   

  });
   
 });


 router.post('/password-details/edit/:id', checkLoginUser, function(req, res, next) {
  var user = localStorage.getItem('loginUser');
  var id= req.params.id;
  var passcat = req.body.pass_cat;
  var project_name = req.body.project_name;
  var pass_details = req.body.pass_details;

  passModel.findByIdAndUpdate(id,{password_category:passcat,project_name:project_name,password_detail:pass_details}).exec(function(err){
    if(err) throw err
    res.redirect('/view-all-password');
  })

  var getPassDetails = passModel.findById({_id:id});
  getPassDetails.exec(function(err,data){
    if(err) throw err;
    getPassCat.exec(function(err,data1){
      res.render('edit_password_details',{title:'Password Management System',loginUser:user,records:data1,record:data,success:''})
    })
   

  });
   
 });


router.get('/password-details/delete/:id', checkLoginUser, function(req, res, next) {
  var id = req.params.id
  var user = localStorage.getItem('loginUser');
  var DeletePasswordDetails = passModel.findByIdAndDelete({'_id':id});
  DeletePasswordDetails.exec(function(err,doc){
    if(err) throw err;
    res.redirect('/view-all-password');
  
  })
   
 });


router.get('/logout', function(req, res, next) {
  localStorage.removeItem('userToken');
  localStorage.removeItem('loginUser');
  res.redirect('/');
});
module.exports = router;
