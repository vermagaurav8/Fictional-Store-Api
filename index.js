require('dotenv').config();
const express = require('express');
const {MongoClient, ObjectId} = require('mongodb'); 
const jwt = require('jsonwebtoken');
const bcrypt =  require('bcrypt');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET;
const jwtExpire = process.env.JWT_EXPIRES_IN;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//connecting mongoDB 
const dbUri =  process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
let database;
async function dbConnect() {
    try {
        const client = new MongoClient(dbUri);
        await client.connect();
        database = client.db(dbName);
        //console.log(database);
        console.log("connected to DB");
    } catch (error) {
        console.log(error);
    }
}
dbConnect();

// Validate JWT
const validate = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        return res.status(401).json({ message: 'Unauthorized'});
    }

    try{
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
    } catch(error) {
        return res.status(403).json({ message: 'Inavalid Token' });
    }
};


//      ROUTES
app.post('/users/register', async (req, res) => {
    try{
        const { username, password } =  req.body;
        const userCollection = database.collection('users');
        console.log(database);
        // Handling duplicate username
        const existingUser = await userCollection.findOne({ username });
        if(existingUser) 
            return res.status(409).json({ message: 'username is already taken'});
        
        // Hashing Password & Creating new User
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = {
            username,
            password: passwordHash
        }

        const result = await userCollection.insertOne(newUser);
        if(result.insertedCount === 0)
            return res.status(500).json({ message: 'Error Registering user'});

        res.json({message: 'user registered successfully'});

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
})




app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});