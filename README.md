# FamilyVine

**FamilyVine** is a full-stack family tree web application featuring:

- Photo uploads
- Individual profile pages for each family member
- Clean, modern UI (React + Material UI or Tailwind)
- Interactive global map using Google Maps
- Dockerized for easy deployment

## Tech Stack

- **Frontend**: React, React Router
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Deployment**: Docker & Docker Compose

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Run the App

```bash
docker-compose up --build
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000/api/members](http://localhost:5000/api/members)

### Database Access

- Host: `localhost`
- Port: `5432`
- User: `user`
- Password: `pass`
- DB Name: `familytree`
