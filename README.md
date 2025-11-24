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

FamilyVine is a comprehensive, self-hosted family genealogy and relationship management platform that empowers families to document their heritage, preserve memories, and visualize their family history across generations. More than just a family tree—it's a complete digital archive for your family's story.

### What FamilyVine Does

**Family Tree & Relationship Management**
- Build and visualize complex multi-generational family trees with an interactive, drag-and-drop interface powered by ReactFlow
- Define detailed relationships: parents, children, siblings, spouses, and extended family connections
- Track family lineage with automatic relationship mapping and bidirectional relationship support
- Save custom tree layouts with persistent node positioning for personalized organization

**Member Profiles & Life Documentation**
- Create rich, detailed profiles for each family member with biographical information
- Record vital statistics: birth dates, death dates, locations, occupations, and contact information
- Document life events, stories, and personal histories
- Support for pronouns, gender identity, and modern family structures
- Calculate and display ages automatically, including age at death for historical records

**Photo Management & Organization**
- Organize family photos into customizable albums with event dates and descriptions
- Advanced photo tagging system for identifying family members in pictures
- Click-to-tag interface with face box positioning (similar to Facebook's photo tagging)
- Automatic HEIC to JPEG conversion for Apple device photos
- Image optimization and thumbnail generation with Sharp
- Set tagged photos as profile pictures directly from albums
- Browse all photos where a specific person is tagged

**Timeline & Calendar Views**
- Chronological timeline displaying births, deaths, marriages, and life events
- Interactive calendar view showing upcoming birthdays and anniversaries
- Filter events by type (births, deaths, marriages) for focused viewing
- Decade-based grouping for easy navigation through family history

**Geographic Visualization**
- Interactive world map showing where family members live or were born
- Leaflet-powered mapping with OpenStreetMap integration
- Cluster markers by location with member counts
- Click on locations to see all associated family members
- Beautiful custom popups with member information and quick links

**Analytics & Insights**
- Real-time family statistics dashboard showing:
  - Total members and living members count
  - Generation tracking and estimation
  - Age distribution (children, adults, seniors)
  - Recent additions in the last 30 days
  - Marriage/relationship statistics
  - Top 5 family locations by member count
- Visual statistics with color-coded cards and charts

**Data Import & Export**
- CSV import functionality for bulk member addition
- Export family data to JSON format for backups
- Automated daily SQL dumps and photo backups
- Database restoration capabilities

**Modern Web Application Features**
- Progressive Web App (PWA) support—install on mobile devices like a native app
- Offline functionality with service worker caching
- Dark mode with auto-detection based on system preferences
- Fully responsive design optimized for mobile, tablet, and desktop
- Global search across all family members
- Breadcrumb navigation for easy orientation
- Offline indicator showing connection status
- Beautiful gradient designs with animated vine graphics

**Privacy & Security**
- Self-hosted solution—your family data stays on your server
- Simple authentication system for family access control
- CORS-protected API preventing unauthorized access
- No third-party data sharing or cloud dependencies
- Complete control over who can view and edit family information

### Perfect For

- Families wanting to document their genealogy and preserve family history
- Genealogy enthusiasts building comprehensive family trees
- Family historians archiving photos, stories, and relationships
- Multi-generational families tracking living and historical members
- Anyone seeking a private, self-hosted alternative to commercial genealogy platforms

## ✨ Key Features at a Glance

- 🌲 **Interactive Family Tree** - Drag-and-drop ReactFlow-powered tree with relationship visualization
- 📸 **Smart Photo Management** - Albums, tagging, HEIC conversion, and automatic optimization
- 👤 **Rich Member Profiles** - Detailed biographical info, life events, and vital statistics
- 🗺️ **Geographic Family Map** - Interactive Leaflet map showing member locations worldwide
- 📊 **Analytics Dashboard** - Real-time statistics on generations, ages, locations, and trends
- 📅 **Timeline & Calendar** - Chronological life events and upcoming family celebrations
- 🌙 **Dark Mode** - Auto-switching themes for comfortable viewing any time
- 📱 **Progressive Web App** - Install on mobile/desktop with offline functionality
- 🔍 **Global Search** - Instantly find any family member from anywhere in the app
- 🔒 **Self-Hosted & Private** - Your data stays on your server, no cloud dependencies
- 💾 **Automated Backups** - Daily SQL dumps and photo archives for peace of mind
- 🌐 **Fully Responsive** - Optimized for mobile, tablet, and desktop experiences

## 🔍 Demo

[View Live Demo](https://family.techwoods.cc) *(requires authentication)*

## 🎯 How It Works

### Building Your Family Tree

1. **Add Family Members** - Start by creating profiles for family members with names, dates, locations, and photos
2. **Define Relationships** - Connect members by defining parent-child, spouse, and sibling relationships
3. **Visualize the Tree** - View your family tree in an interactive diagram, drag nodes to organize
4. **Customize Layout** - Arrange the tree however you like—FamilyVine saves your preferred layout

### Organizing Photos & Memories

1. **Create Albums** - Organize photos by event, year, or theme (weddings, reunions, holidays)
2. **Upload Photos** - Drag and drop photos including HEIC files from iPhones (auto-converted)
3. **Tag Family Members** - Click on faces in photos and tag them to specific family members
4. **Browse Tagged Photos** - Visit any member's profile to see all photos they're tagged in
5. **Set Profile Pictures** - Choose tagged photos as profile pictures with one click

### Tracking Family History

1. **Timeline View** - See all births, deaths, and marriages in chronological order
2. **Calendar View** - Get notified of upcoming birthdays and anniversaries
3. **Map Exploration** - Discover where your family members live or originated from
4. **Analytics Dashboard** - View statistics about your family tree's size and composition

### Real-World Use Cases

**📖 Family Historian Documentation**
> "My grandmother is 92 and has amazing stories. I use FamilyVine to document her memories, scan old family photos, and tag everyone she remembers. The timeline feature helps me organize events chronologically, and I can export everything for safekeeping."

**🎉 Family Reunion Planning**
> "We have a large extended family spread across three continents. FamilyVine's map view helps us see where everyone lives, making it easier to plan regional gatherings. The calendar reminds us of birthdays so we never miss sending cards."

**🔍 Genealogy Research**
> "As I research my ancestry, FamilyVine helps me organize what I find. I can add historical family members with birth/death dates and locations, track multiple generations, and see patterns in where the family migrated over time."

**👨‍👩‍👧‍👦 Modern Blended Families**
> "Our blended family has complex relationships with step-siblings and half-siblings. FamilyVine handles this perfectly—we can define all the relationships accurately and everyone can see how they're connected."

**📸 Digital Family Archive**
> "We digitized 50 years of family photos and organized them into albums by decade. Using the tagging feature, we identified over 200 relatives across 4 generations. Now anyone in the family can explore our history from their phone."

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
