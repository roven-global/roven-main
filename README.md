# MERN eCommerce Full-Stack Application

This is a full-stack eCommerce application built with the MERN stack (MongoDB, Express, React, Node.js). It includes a variety of features for both customers and administrators.

## Features

- **Authentication**: User registration and login with JWT (JSON Web Tokens).
- **Shopping Cart**: Add, remove, and update items in the cart.
- **Product Management**: Admins can create, update, and delete products.
- **Category Management**: Organize products into categories and subcategories.
- **Admin Dashboard**: A comprehensive overview of sales, orders, and more.
- **Responsive Design**: The application is fully responsive and works on all devices.
- **And more...**

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn-ui
- **Backend**: Node.js, Express, MongoDB
- **Other**: Vite, Axios, Zod, and more.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or remote)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   ```

2. Install the dependencies for the server:

   ```bash
   cd server
   npm install
   ```

3. Install the dependencies for the client:
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

1. Start the server:

   ```bash
   cd server
   npm start
   ```

2. Start the client:
   ```bash
   cd ../client
   npm run dev
   ```

## Security Features

- **Rate Limiting**: Prevents brute force attacks by limiting requests per IP.
- **Input Validation & Sanitization**: All user input is validated and sanitized to prevent injection and XSS attacks.
- **JWT with Refresh Tokens**: Secure authentication with short-lived access tokens and refresh tokens. Use `/api/user/refresh-token` to obtain a new access token.
- **HTTPS/SSL**: In production, the server supports HTTPS. Provide paths to your SSL key and certificate via environment variables:

```
SSL_KEY=/path/to/ssl.key
SSL_CERT=/path/to/ssl.cert
```
