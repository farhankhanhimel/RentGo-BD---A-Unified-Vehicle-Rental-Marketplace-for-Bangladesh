# RentGo BD - A Unified Vehicle Rental Marketplace for Bangladesh

RentGo BD is a web-based vehicle rental marketplace designed to connect customers with multiple vehicle rental providers across Bangladesh through a single digital platform. The system allows rental companies to register, list vehicles, set pricing, and offer services with or without drivers. Customers can search, compare prices, view vehicle details, and book according to their preferences, location, and budget.

The platform promotes transparent pricing, competitive offers, and convenient online booking — addressing the current challenges in Bangladesh where vehicle rentals are largely unstructured, negotiated offline, and lack trust mechanisms.

RentGo BD will support multiple vehicle types such as cars, motorcycles, microbuses, vans, pickup trucks, and buses. The platform will generate revenue through a small commission fee on each booking. Additional features such as verified vendors, ratings, digital payments, route-based pricing, and customer support will enhance trust and usability.

This system aims to modernize the vehicle rental industry in Bangladesh while providing an efficient, scalable, and user-friendly solution suitable for real-world deployment.


SRS document : https://docs.google.com/document/d/1diZjvaK-00Dn27c1NUJ5p8Z6UUAiJcfLZTqMYzwTujM/edit?tab=t.0


Tasnim Farhan Khan - 21301281
Shariar Alam Tasfi - 22241096
Israk Mostafiz Rizbi - 22299268
Homyra Ananna - 23101532


## Tech Stack

- **MongoDB**: Database
- **Express.js**: Backend framework
- **React**: Frontend library
- **Node.js**: Runtime environment

## Project Structure

```
RentGo/
├── backend/          # Express server & API
│   ├── config/       # Configuration files
│   ├── controllers/  # Route controllers
│   ├── models/       # Database models
│   ├── routes/       # API routes
│   ├── middleware/   # Custom middleware
│   └── server.js     # Entry point
├── frontend/         # React application
│   ├── public/       # Static files
│   └── src/          # React components & logic
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd RentGo
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Set up environment variables
```bash
cd ../backend
cp .env.example .env
# Edit .env with your configuration
```

### Running the Application

1. Start MongoDB service

2. Run backend server
```bash
cd backend
npm run dev
```

3. Run frontend development server
```bash
cd frontend
npm start
```

The frontend will run on `http://localhost:3000` and backend on `http://localhost:5000`

## License

ISC
