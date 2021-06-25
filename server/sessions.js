const { urlencoded } = require('express')
const express= require('express')
const session= require('express-session') //sets the cookie for the specified session
const mongoose= require('mongoose')
const MongoDBSession= require('connect-mongodb-session')(session)
const bcrypt= require('bcrypt')
const app= express()

const mongoURI=''
const UserModel= require('./models/User')



mongoose.connect(mongoURI, {
    useNewUrlParser:true,
    useCreateIndex: true,
    useUnifiedTopology: true,
}).then((result)=>{
    console.log('connected to atlas')

    app.listen(3001)
}).catch(err=>console.log(err))


const store= new MongoDBSession({
    uri: mongoURI,
    collection: 'sessions',
})


app.set('view-engine', 'ejs')
app.use(express.urlencoded({extended: true})) //parse body, give us access to req.body 


// middleware to set .session to out request object
// req.session stays for consequetive requests rsponse cycles
app.use(session({
    secret: 'a key that signs the cookie',
    resave:false,//  if true it means for every request create a new session regardless whether its the same user or browser
    saveUninitialized: false,// don't save session object unless it has been modified changed
    store: store,
})) // fires for every request to the server


//function that acts as a middleware to check if req to route is authenticated
//if isAuth then perform next(), which will handle the rendering and other response logic
//else redirect back to login page  
const isAuth= (req, res, next)=>{
    if (req.session.isAuth){
        next();
    }else{
        res.redirect('/login')
    }
}


app.get('/', (req, res)=>{
    // req session .isAuth=true ----just an example of modfying session
    console.log(req.session) 
    console.log(req.session.id) // swhich is stored in the cookie id, which tells the server that this browser is using this specific session
    res.render('landing.ejs')
})
app.get('/login', (req, res)=>{
    res.render('login.ejs')
})
app.post('/login', async (req, res)=>{
    const {email, password}= req.body

    const user= await UserModel.findOne({email});
    if(!user){
        return res.redirect('/login')
    }
    const isMatch= await bcrypt.compare(password, user.password)
    if(!isMatch){

        res.redirect('/login')
    }

    req.session.isAuth=true; //save isAuth on req as indicator of authentication state
    
    res.redirect('/dashboard')


})
app.get('/register', (req, res)=>{
    res.render('register.ejs')
})
app.post('/register', async (req, res)=>{
    const {name, email,password}= req.body
    //check if user exists already, async because it involves connecting to database

    let user= await UserModel.findOne({email})
    if (user){
        return res.redirect('/register')
    }

    let hashedPwd= await bcrypt.hash(password, 12);

    user= new UserModel({
        name, 
        email, 
        password: hashedPwd//encrypt the password with brcypt
    })

    await user.save()

    res.redirect('/login')
})

app.get('/dashboard',isAuth, (req,res)=>{
    res.render('dashboard.ejs')
})

app.post('/logout', (req, res)=>{
    req.session.destroy((err)=>{
        if(err) throw error;
        res.redirect('/')
    })
})

app.listen(3000, ()=> console.log('Server running on http://localhost:3000'))

