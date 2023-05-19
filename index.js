require('dotenv').config();
const express = require('express');
const {MongoClient, ObjectId} = require('mongodb'); 
const {validationResult} = require('express-validator')
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

/*   SECTION:1     CONNECTING TO DB     */
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

/*   SECTION:2    REGISTER & LOGIN USING JWT     */
//  register route
app.post('/users/register', async (req, res) => {
    try{
        const { username, password } =  req.body;
        const userCollection = database.collection('users');

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

// Login Route
app.post('/users/login', async (req, res) => {
    try {
        const {username, password} = req.body;
        const userCollection = database.collection('users');

        const user = await userCollection.findOne({ username });
        if(!user)
            return res.status(401).json({ message: 'Invalid username or password' });
        
        const comparePassword = await bcrypt.compare(password, user.password);
        if (!comparePassword) 
            return res.status(401).json({ message: 'Invalid username or password -2' });

        const token = jwt.sign({ id: user._id}, jwtSecret, { expiresIn: jwtExpire});
        res.json({ message: token});
    }catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in' }); 
    }
})


/*   SECTION:3    SEARCHING, UPDATING, DELETING PRODUCTS FUNCTIONALITY       */
// Adding a product
app.post('/products', async (req, res) => {
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, category, price } = req.body;
        const productsCollection = database.collection('products');

        // duplicate product handling
        const existingProduct = await productsCollection.findOne({ name });
        if(existingProduct)
            return res.status(409).json({ message: 'Product already exists'});
        
        const product = {
            name, 
            description,
            category,
            price: parseFloat(price)
        }

        const result = await productsCollection.insertOne(product);
        if(result.insertedCount === 0)
            return res.status(500).json({ message: 'Error creating product'});
        
        res.json({message: 'product created successfully'});
    } catch(error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error creating product' });
    }
})

// Getting All products with pagenation
app.get('/products/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 10; 
        const skip = (page - 1) * limit;

        const productsCollection = database.collection('products');

        const totalProducts = await productsCollection.countDocuments();

        const products = await productsCollection
            .find()
            .skip(skip)
            .limit(limit)
            .toArray();

        res.json({ products, totalProducts });
    } catch (error) {
        console.error('Error reading products:', error);
        res.status(500).json({ message: 'Error reading products' });
    }
});

// Updating a product
app.put('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category, price } = req.body;
        const productsCollection = database.collection('products');

        // Already existing product handling
        const existingProduct = await productsCollection.findOne({ _id: new ObjectId(id) });
        if (!existingProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        //  Same name conflict handling
        const duplicateProduct = await productsCollection.findOne({ name, _id: { $ne: new ObjectId(id) } });
        if (duplicateProduct) {
            return res.status(409).json({ message: 'Product name already exists' });
        }

        const updatedProduct = {
            name,
            description,
            category,
            price: parseFloat(price)
        };

        const result = await productsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedProduct }
        );

        if (result.modifiedCount === 0) {
            return res.status(500).json({ message: 'Error updating product -1' });
        }

        res.json({ message: 'Product updated successfully', id });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product' });
    }
}
);

// Deleting a product
app.delete('/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const productsCollection = database.collection('products');

        const result = await productsCollection.deleteOne({ _id: new ObjectId(productId) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully', productId });
    } catch (error) {
        console.error('Error deleteing product:', error);
        res.status(500).json({ message: 'Error deleting product' });
    }
});

// Searching products by name, description, and category
app.get('/products/search', async (req, res) => {
    try {
        const searchQuery = req.query.q || ''; // Get the search query from the query parameter
        const productsCollection = database.collection('products');

        // Create a search query using case-insensitive regex
        const query = {
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { category: { $regex: searchQuery, $options: 'i' } }
            ]
        };

        const products = await productsCollection.find(query).toArray();

        res.json({ products });
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ message: 'Error searching products' });
    }
});



/* SECTION 4:    ADDING ITEMS IN CART AND PLACING ORDER FUNCTIONALITY       */
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

// Adding products to the shopping cart
// Only loggedIn user can do this.
app.post('/cart', validate, async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.body.productId;
        const quantity = req.body.quantity || 1; 

        const usersCollection = database.collection('users');
        // Finding User & Updating cart
        const result = await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $addToSet: { cart: { productId: new ObjectId(productId), quantity: quantity } } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Product added to cart successfully' });
    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).json({ message: 'Error adding product to cart' });
    }
});

// Remove a product from a cart
// User must be logged in for this
app.delete('/cart/:productId', validate, async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.productId;
        const usersCollection = database.collection('users');

        // Check if the user exists
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove the product from the user's cart
        const updatedUser = await usersCollection.findOneAndUpdate(
            { _id: new ObjectId(userId) },
            { $pull: { cart: { productId: new ObjectId(productId) } } },
            { returnOriginal: false }
        );

        if (!updatedUser.value) {
            return res.status(500).json({ message: 'Error removing product from cart' });
        }

        res.json({ message: 'Product removed from cart successfully' });
    } catch (error) {
        console.error('Error removing product from cart:', error);
        res.status(500).json({ message: 'Error removing product from cart' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});