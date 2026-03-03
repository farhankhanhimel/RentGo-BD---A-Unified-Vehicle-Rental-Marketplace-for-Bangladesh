# RentGo Setup Guide

## Initial Setup Steps

Follow these steps to get your MERN stack application running:

### 1. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 2. Set Up Environment Variables

#### Backend
```bash
cd backend
cp .env.example .env
```

Edit the `.env` file and add your MongoDB connection string and other configurations.

#### Frontend
```bash
cd frontend
cp .env.example .env
```

### 3. Start MongoDB

Make sure MongoDB is installed and running on your system.

**Windows:**
```bash
net start MongoDB
```

**macOS/Linux:**
```bash
sudo systemctl start mongod
```

Or use MongoDB Atlas for a cloud database.

### 4. Run the Application

#### Start Backend Server (Terminal 1)
```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:5000`

#### Start Frontend Server (Terminal 2)
```bash
cd frontend
npm start
```

The frontend will run on `http://localhost:3000`

### 5. Verify Setup

- Open your browser and go to `http://localhost:3000`
- You should see the RentGo homepage
- The backend API is accessible at `http://localhost:5000/api`

## Project Structure Created

```
RentGo/
├── backend/
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── controllers/
│   │   └── authController.js  # Authentication logic
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication middleware
│   │   └── errorHandler.js    # Error handling middleware
│   ├── models/
│   │   └── User.js            # User model
│   ├── routes/
│   │   ├── auth.js            # Auth routes
│   │   └── users.js           # User routes
│   ├── .env.example           # Environment variables template
│   ├── package.json           # Backend dependencies
│   └── server.js              # Entry point
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── Navbar.js
│   │   │   ├── Navbar.css
│   │   │   ├── Footer.js
│   │   │   └── Footer.css
│   │   ├── pages/             # Page components
│   │   │   ├── Home.js
│   │   │   ├── Home.css
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   └── Auth.css
│   │   ├── services/          # API services
│   │   │   └── authService.js
│   │   ├── utils/             # Utility functions
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

## Next Steps

1. **Install Dependencies**: Run `npm install` in both backend and frontend folders
2. **Configure Database**: Set up your MongoDB connection
3. **Start Development**: Run both servers and start building features
4. **Add More Models**: Create models for rentals, bookings, etc.
5. **Implement Features**: Add more routes, controllers, and pages as needed

## Available Scripts

### Backend
- `npm start` - Start the server
- `npm run dev` - Start with nodemon (auto-reload)

### Frontend
- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests

## Technologies Used

- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT
- **Frontend**: React, React Router, Axios
- **Development**: Nodemon, Create React App

Happy coding! 🚀
