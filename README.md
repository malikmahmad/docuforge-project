# 📝 DocuForge

> **Professional Documentation Generator** - Create comprehensive technical documentation instantly, without AI API keys.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-green)](https://nodejs.org/)

## 🌟 Features

- **🚀 No API Keys Required** - Template-based generation works instantly
- **📋 Multiple Document Types** - Technical specs, API references, user manuals, PRDs, SOPs, and custom docs
- **🎨 Professional Formatting** - Structured markdown with tables, diagrams, and proper sections
- **⚡ Instant Generation** - No waiting, no rate limits, no costs
- **📊 Rich Content** - Requirements tables, architecture diagrams, API endpoints, security measures
- **💾 Export Options** - Download as Markdown, PDF, or DOCX
- **🎯 Customizable** - Add custom headings and requirements
- **📱 Responsive Design** - Works on desktop, tablet, and mobile

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   API Server     │────▶│   Templates     │
│   (React/Vite)  │     │   (Express)      │     │   (Generator)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (recommended: 24+)
- **pnpm** 9+ (package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/malikmahmad/docuforge-project.git
   cd docuforge-project
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development servers**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   - Frontend: http://localhost:21722
   - API Server: http://localhost:8080

## 📖 Usage

### Generate Documentation

1. **Enter Project Details**
   - Project title
   - Description
   - Document type (Technical Spec, API Reference, etc.)
   - Project scale (Academic, Startup, Enterprise)

2. **Customize (Optional)**
   - Add custom headings
   - Specify advanced requirements
   - Include API details

3. **Generate**
   - Click "Generate Documentation"
   - View the formatted output instantly

4. **Export**
   - Download as Markdown (.md)
   - Export to PDF
   - Save as Word document (.docx)

### Document Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Technical Specification** | Complete implementation-ready specs | Software development projects |
| **API Reference** | Production-grade API documentation | REST APIs, GraphQL, SDKs |
| **User Manual** | End-user guides and tutorials | Product documentation |
| **Product Requirements** | PRD for planning and delivery | Product management |
| **Standard Operating Procedure** | Step-by-step operational guides | Process documentation |
| **Custom** | Flexible documentation format | Any custom needs |

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Shadcn/ui** - Component library
- **React Markdown** - Markdown rendering
- **Wouter** - Routing

### Backend
- **Node.js 24** - Runtime
- **Express 5** - Web framework
- **TypeScript** - Type safety
- **Pino** - Logging
- **esbuild** - Bundler

### Development
- **pnpm** - Package manager
- **ESLint** - Linting
- **Prettier** - Code formatting

## 📁 Project Structure

```
docuforge-project/
├── artifacts/
│   ├── api-server/          # Backend API
│   │   ├── src/
│   │   │   ├── routes/      # API routes
│   │   │   └── lib/         # Utilities
│   │   └── package.json
│   └── docuforge/           # Frontend app
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── pages/       # Page components
│       │   └── services/    # API services
│       └── package.json
├── lib/                     # Shared libraries
│   ├── api-client-react/    # API client
│   ├── api-zod/             # Validation schemas
│   └── db/                  # Database schemas
├── package.json             # Root package
└── pnpm-workspace.yaml      # Workspace config
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root (optional):

```env
# API Server Port (default: 8080)
PORT=8080

# Frontend Port (default: 21722)
VITE_PORT=21722
```

### Build for Production

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @workspace/docuforge build
pnpm --filter @workspace/api-server build
```

## 📊 Generated Documentation Includes

- ✅ Executive Summary
- ✅ Product Overview
- ✅ Functional Requirements (with tables)
- ✅ System Architecture (with diagrams)
- ✅ API Design (with endpoint tables)
- ✅ Security Measures
- ✅ Testing Strategy
- ✅ Risk Assessment
- ✅ And more...

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Malik Mahmad**
- GitHub: [@malikmahmad](https://github.com/malikmahmad)
- Repository: [docuforge-project](https://github.com/malikmahmad/docuforge-project)

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by the need for quick, professional documentation
- No AI dependencies - fast, reliable, and free

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/malikmahmad/docuforge-project/issues) page
2. Create a new issue with detailed information
3. Star ⭐ the repository if you find it useful!

## 🗺️ Roadmap

- [ ] Add more document templates
- [ ] Implement document versioning
- [ ] Add collaborative editing
- [ ] Support for more export formats
- [ ] Custom template builder
- [ ] Dark mode improvements
- [ ] Multi-language support

---

**Made with 🩶 by Malik Muhammad Ahmad**

*Generate professional documentation in seconds, not hours.*
