# Flux IDE

## Overview

Flux IDE is a production-grade real-time collaborative code editor with a "Control Room" aesthetic. It combines IDE utility with HUD/Cockpit design elements, featuring Monaco Editor integration, multi-language syntax highlighting, real-time collaboration via Socket.IO, and debugging simulation capabilities.

The application follows a client-server architecture with a React frontend and FastAPI backend, connected through WebSocket for real-time collaboration features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with Create React App (via CRACO for customization)
- **Routing**: React Router DOM v7 for client-side navigation
- **Code Editor**: Monaco Editor (@monaco-editor/react) - same editor that powers VS Code
- **Terminal Emulation**: xterm.js for integrated terminal functionality
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS v4 with custom design tokens matching the "Flux Dark" theme
- **Real-time Communication**: Socket.IO client for collaborative editing

### Backend Architecture
- **Framework**: FastAPI with async support
- **Real-time**: Socket.IO async server for WebSocket connections
- **Architecture Pattern**: Event-driven for collaboration features
- **State Management**: In-memory storage for active users and session data (no persistent database currently configured)

### Key Design Decisions

1. **Monaco Editor for Code Editing**
   - Problem: Need a professional-grade code editor with syntax highlighting for 10+ languages
   - Solution: Monaco Editor provides VS Code-level editing capabilities
   - Benefits: Robust language support, built-in IntelliSense, proven reliability

2. **Socket.IO for Real-time Collaboration**
   - Problem: Multiple users need to edit code simultaneously with minimal latency
   - Solution: Socket.IO handles bi-directional WebSocket communication with automatic fallback to polling
   - Benefits: Reliable connections, automatic reconnection, broad browser support

3. **Operational Transformation for Conflict Resolution**
   - Problem: Concurrent edits from multiple users can conflict
   - Solution: Custom OT implementation in `/frontend/src/utils/operationalTransform.js`
   - Benefits: Maintains document consistency across all connected clients

4. **Design System Following "Swiss Brutalist" Typography**
   - Fonts: Chivo (headings), IBM Plex Sans (body/UI), JetBrains Mono (code)
   - Color Palette: Signal Orange (#F97316) as primary accent, dark backgrounds (#050505)
   - Defined in `design_guidelines.json` and implemented via Tailwind config

## External Dependencies

### Frontend Services
- **Monaco Editor**: Code editing engine (bundled, no external API)
- **Socket.IO**: WebSocket connections to backend at port 8000

### Backend Services
- **Socket.IO Server**: Runs on FastAPI ASGI server
- **No Database Currently**: Uses in-memory storage; may add PostgreSQL later for persistence

### Third-Party Integrations (from requirements.txt)
- **Google Generative AI**: AI capabilities via google-genai and google-generativeai packages
- **AWS (boto3)**: Potential cloud storage/services integration
- **Hugging Face Hub**: ML model access capabilities

### API Structure
- Base path: `/api` prefix for REST endpoints
- WebSocket path: `/socket.io` for real-time collaboration
- Events: `join_session`, cursor updates, document changes, user presence