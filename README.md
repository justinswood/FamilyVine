# FamilyVine

<p align="center">
  <img src="docs/images/familyvine-logo.png" alt="FamilyVine Logo" width="200"/>
</p>

<p align="center">
  <b>Connecting Generations, Preserving Stories</b>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Live Demo</a> •
  <a href="#installation">Installation</a> •
  <a href="#technology-stack">Technology Stack</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#roadmap">Roadmap</a> •
  <a href="#license">License</a>
</p>

---

## 🌳 About FamilyVine

FamilyVine is a full-featured family tree application designed to help families preserve their heritage, connect generations, and share memories. Built with modern web technologies, FamilyVine offers an intuitive interface for managing family relationships, photos, and stories.

## ✨ Features

- **Interactive Family Tree** - Visualize complex family relationships with an elegant, intuitive interface
- **Photo Galleries** - Create albums and organize family photos with face tagging
- **Member Profiles** - Detailed profiles for each family member with life events, stories, and media
- **Family Map** - See where family members are located around the world
- **Dark Mode** - Comfortable viewing experience in any lighting condition
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices

## 🔍 Demo

[View Live Demo](https://family.techwoods.cc) *(requires authentication)*

## 💾 Installation

### Prerequisites

- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/JWoods/FamilyVine.git
   cd FamilyVine
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and settings
   ```

4. **Initialize the database**
   ```bash
   npm run db:init
   # or
   yarn db:init
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Build for production**
   ```bash
   npm run build
   # or
   yarn build
   ```

## 🛠️ Technology Stack

- **Frontend**: React, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Authentication**: JWT
- **File Storage**: Local filesystem (with cloud options)
- **Deployment**: Docker, Cloudflare

## 📊 Project Structure

```
FamilyVine/
├── backend/           # Node.js Express API
│   ├── routes/        # API routes
│   ├── config/        # Configuration files
│   └── app.js         # Main server file
├── src/               # React frontend
│   ├── components/    # Reusable UI components
│   ├── pages/         # Page components
│   └── App.js         # Main application component
└── public/            # Static assets
    └── uploads/       # User-uploaded content
```

## 📸 Screenshots

<p align="center">
  <img src="docs/images/homepage.png" alt="FamilyVine Homepage" width="700"/>
</p>

<p align="center">
  <img src="docs/images/tree-view.png" alt="Family Tree View" width="700"/>
</p>

<p align="center">
  <img src="docs/images/photo-gallery.png" alt="Photo Gallery" width="700"/>
</p>

## 🛣️ Roadmap

- [ ] **DNA Integration** - Connect with popular DNA testing services
- [ ] **Mobile App** - Native mobile applications
- [ ] **Advanced Search** - Full-text search across all family data
- [ ] **PDF Export** - Generate beautiful family books for printing
- [ ] **Event Timeline** - Interactive timeline of family events

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/amazing-feature`)
3. Commit your Changes (`git commit -m 'Add some amazing feature'`)
4. Push to the Branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Family icons created by Freepik - Flaticon](https://www.flaticon.com/free-icons/family)
- All family photos are used with permission from their respective owners

---

<p align="center">
  Made with ❤️ by Justin Woods
</p>
