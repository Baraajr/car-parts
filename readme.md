# 🚗 Car Parts E-commerce Platform

A full-stack web application for buying and selling car parts, developed as a graduation project. It features robust backend architecture, secure authentication, media uploads, payment integration, and production-grade deployment.

---

## 🚀 Features

- **User Authentication & Authorization**

  - Role-based access control (Admin, Seller, Customer)
  - Secure JWT-based authentication with Passport.js

- **Product Management**

  - CRUD operations for car parts
  - Categories, brands, and subcategories
  - Advanced filtering, searching, and pagination

- **Media Handling**

  - Upload images directly to AWS S3 via pre-signed URLs

- **Email Communication**

  - Integrated with Mailtrap for testing transactional emails

- **Payments**

  - Stripe integration for secure payment processing

- **Caching & Performance**

  - Redis caching for frequently accessed data

- **Testing**

  - Unit and integration tests using Jest and mongo-memory-server

- **DevOps & Deployment**
  - Dockerized with multi-stage builds
  - Nginx reverse proxy with load balancing
  - CI/CD with GitHub Actions
  - Deployed on AWS EC2

---

## 🛠 Tech Stack

| Layer          | Technology                             |
| -------------- | -------------------------------------- |
| Backend        | Node.js, Express.js                    |
| Database       | MongoDB, Mongoose                      |
| Authentication | JWT, Passport.js                       |
| Payments       | Stripe                                 |
| Caching        | Redis                                  |
| File Storage   | AWS S3                                 |
| Email Testing  | Mailtrap                               |
| Testing        | Jest, Supertest                        |
| DevOps         | Docker, Nginx, GitHub Actions, AWS EC2 |

---

## 📁 Project Structure

```
node-car-parts/
├── .github/workflows/ # CI rules (test, docker build)
├── nginx/ # Load-balancing config
├── src/ # Application source code
│ ├── controllers/ # Route handlers
│ ├── middlewares/ # Custom middleware
│ ├── models/ # Mongoose schemas
│ ├── routes/ # Express routing
│ └── utils/ # Utility modules (e.g., Cache, Email)
├── tests/ # Integration and unit test suites
├── Car-Parts.postman_collection.json # Postman API collection
├── Dockerfile # Docker build config
├── docker-compose*.yml # Dev/prod orchestration files
├── .eslintrc.json # ESLint config
├── .prettierrc # Prettier formatting config
├── jest.config.js # Jest config
├── package.json # NPM dependencies and scripts
└── .gitignore / .dockerignore # Ignore rules
```

---

## 🧪 Available Scripts

```bash
# Install dependencies
npm install

# Run in development mode (with Docker)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Run locally without Docker
npm run dev

# Run tests
npm run test

# Run in production mode (Docker + Nginx)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# Or
npm run prod
```

---

## 📫 Author

**Ahmed Baraa Ali Khattab**  
📧 [ahmedbaraa009@gmail.com](mailto:ahmedbaraa009@gmail.com)  
🔗 [LinkedIn](https://www.linkedin.com/in/ahmed-baraa-b94b7b284)  
🐙 [GitHub](https://github.com/Baraajr)
