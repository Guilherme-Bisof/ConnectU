# ConnectU - Professional Networking & Recruitment Platform

## About the Project
ConnectU is a full-stack professional networking platform designed to bridge the gap between emerging academic talent and corporate recruiters. The application simulates a complete recruitment ecosystem, featuring real-time communication, role-based access control (RBAC), and complex relational data modeling to connect students with real-world job opportunities.

## Key Features
- **Role-Based Access Control (RBAC):** Distinct workflows and permissions for `STUDENT` and `RECRUITER` profiles.
- **Real-Time Contextual Chat:** Bidirectional communication using WebSockets, supporting both casual networking (Social) and job-specific discussions (Professional).
- **Dynamic Social Feed:** Interactive timeline allowing users to post updates, comment, and engage with professional content.
- **Job Board & Application Engine:** Dedicated recruitment module for companies to post jobs and students to apply, featuring unique constraint validations to prevent duplicate applications.
- **Cloud Media Management:** Seamless upload and delivery of static assets (avatars, banners, resumes) via Cloudinary.

## Technologies Used
- **Frontend Ecosystem:** Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript
- **Backend Core:** Node.js, Express.js, TypeScript
- **Database & ORM:** PostgreSQL, Prisma ORM (v6)
- **Real-Time Engine:** Socket.io, Socket.io-client
- **Security & Authentication:** JWT (JSON Web Tokens), Bcrypt, Helmet, Express-Rate-Limit, CORS
- **Asset Management:** Multer, Cloudinary API

## How to Run the Project

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/ConnectU.git
   ```

2. **Navigate to the frontend and backend directories to install dependencies:**
   ```bash
   cd ConnectU/frontend
   npm install

   cd ../backend
   npm install
   ```

3. **Set up the environment variables:**
   Create a `.env` file in both frontend and backend directories based on the provided `.env.example` files. Ensure you add your PostgreSQL connection string, JWT Secret, and Cloudinary credentials.

4. **Run database migrations (Backend):**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the application:**
   ```bash
   # In the backend directory
   npm run dev

   # In the frontend directory
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:3333`.

## Project Organization
The project is structured as a decoupled full-stack application. The frontend leverages Next.js App Router for optimized Server-Side Rendering (SSR) and modern routing, while the backend is an Express-based REST API that strictly separates responsibilities across controllers, services, and Prisma database schemas.

## What This Project Demonstrates
- Full-stack architectural decoupling and RESTful API integration.
- Advanced relational database modeling (1:N, N:N relationships) using Prisma ORM.
- Implementation of real-time, bidirectional communication pipelines (WebSockets).
- Implementation of modern security practices (Rate limiting, HTTP header protection, JWT session management).
- Proficiency with the latest React and Next.js rendering strategies.

## Future Improvements
- Implement automated unit and integration testing (Jest/Supertest).
- Containerize the application using Docker for easier deployment pipelines.
- Add advanced search and filtering capabilities for the job board.
