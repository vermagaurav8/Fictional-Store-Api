# Fictional Store

Fictional-Store is a comprehensive API designed to facilitate user authentication, registration, product management (including CRUD operations), cart management, and order placement for an online store.
<br><br>

# Prerequisites

To run the API successfully, please make sure your machine meets the following prerequisites:

1. Node.js: Ensure that you have Node.js installed on your machine, preferably version 16 or higher.

2. MongoDB: Install MongoDB Community Edition or create an account on MongoDB Atlas for cloud-based MongoDB hosting.

By having Node.js and MongoDB set up correctly, you'll be ready to run the API smoothly.

<br>

# Getting Started

Here are the steps to set up and run the API on your local machine:

1. <b>Clone the Repository:</b> 
   Clone the project repository to your local machine using the following command:
   ```
   git clone git@github.com:vermagaurav8/HouseMonk-Assignment.git
   ```

2. <b>Install Dependencies:</b>
   Navigate to the project directory and install the required dependencies by running the following commands:
   ```
   cd HouseMonk-Assignment
   npm install
   ```

3. <b>Configure Environment Variables:</b>
   Create a file named `.env` in the project root directory and configure the necessary environment variables. Modify the following variables to match your setup:
   ```
   PORT=3000
   MONGODB_URI=connection-string
   DB_NAME=database-name
   JWT_SECRET=secret-key
   JWT_EXPIRES_IN="20h"
   ```
   Replace `connection-string`, `database-name`, and `secret-key` with the appropriate values. The `JWT_EXPIRES_IN` variable represents the expiration time of the JWT token in minutes.

4. <b>Start MongoDB:</b>
   Make sure MongoDB is running on your local machine. If you're using MongoDB Atlas or a remote database, provide the appropriate MongoDB connection URI in the `.env` file.

5. <b>Run the API:</b>
   Start the API server by running the following command:
   ```
   npm start
   ```

   The API will start running on `http://localhost:3000`.

<br>

# Testing Api
Here is a summary of the API endpoints available in the Fictional-Store:

- `POST /users/register`: Register a new user by providing a username and password in the request body.
- `POST /users/login`: Log in a user by providing a username and password in the request body to obtain a token for authentication.
- `POST /products`: Create a new product by providing the name, description, category, and price in the request body.
- `GET /products`: Retrieve all products. Supports pagination with options for page number and limit.
- `PUT /products/:id`: Update a product by its ID. Provide the updated name, description, category, or price in the request body and the product ID as a parameter in the URL.
- `GET /products/search`: Search for products by name, description, or category. Provide the search query as a parameter in the query string.
- `DELETE /products/:id`: Delete a product by its ID. The ID of the product is provided as a parameter in the URL.
- `POST /cart`: Add products to the shopping cart by providing the product ID and quantity in the request body. Requires authorization using the Bearer token in the request header.
- `DELETE /cart/:id`: Remove a product from the shopping cart by its ID. Requires authorization using the Bearer token in the request header. The product ID is provided as a parameter in the URL.
- `POST /orders`: Place an order for the products in the shopping cart. Empties the shopping cart after placing the order. Requires authorization in the request header.
- `GET /orders`: Retrieve all orders. Supports pagination with options for page number and limit.

You can use tools like Postman to test these API endpoints by sending requests to the corresponding URLs with the required request body, parameters, and headers.