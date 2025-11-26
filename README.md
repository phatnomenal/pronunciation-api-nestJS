# Pronunciation Trainer API - NestJS

A cloud-based pronunciation analysis API built with NestJS, using OpenAI's Whisper and TTS services with Firebase Firestore for metadata storage.

## Features

- 🎤 Audio transcription using OpenAI Whisper API
- 📊 Pronunciation scoring and analysis
- 🗣️ IPA (International Phonetic Alphabet) transcription
- 🔊 Text-to-speech using OpenAI TTS
- 🔥 Firebase Firestore for metadata storage
- 📈 Statistics and analytics
- 🚀 Fast and scalable NestJS architecture
- 📚 Auto-generated Swagger documentation

## Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Firebase project with Firestore enabled
- Firebase service account credentials JSON file

## Installation
```bash
# Install dependencies
npm install

# Create .env file (see .env.example)
cp .env.example .env

# Add your Firebase credentials file
# Place firebase-credentials.json in the root directory
```

## Configuration

Edit `.env` file with your credentials:
```env
PORT=8000
NODE_ENV=development

OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=whisper-1
OPENAI_TTS_MODEL=tts-1
OPENAI_TTS_VOICE=alloy

FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json

CORS_ORIGINS=http://localhost:3000,http://localhost:5173

MAX_FILE_SIZE_MB=25
```

## Running the Application
```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **API Base**: http://localhost:8000/api

## API Endpoints

### Health & Info
- `GET /api` - API root
- `GET /api/health` - Health check

### Pronunciation Analysis
- `POST /api/transcribe` - Transcribe audio file
- `POST /api/analyze` - Full pronunciation analysis
- `POST /api/grade` - Grade pronunciation without audio
- `POST /api/ipa` - Get IPA transcription

### Text-to-Speech
- `POST /api/tts` - Generate pronunciation audio
- `POST /api/tts/slow` - Generate slow pronunciation

### Data Management
- `GET /api/recordings` - List all recordings
- `GET /api/recordings/search` - Search recordings
- `GET /api/recordings/score-range` - Filter by score
- `GET /api/recordings/:id` - Get specific recording
- `PUT /api/recordings/:id` - Update recording
- `DELETE /api/recordings/:id` - Delete recording

### Statistics
- `GET /api/statistics` - Overall statistics
- `GET /api/statistics/user/:userId` - User statistics

### Utility
- `GET /api/phrases` - Get practice phrases
- `GET /api/voices` - Get available TTS voices

## Project Structure
````
src/
├── main.ts                      # Application entry point
├── app.module.ts                # Root module
├── common/                      # Common utilities
│   ├── filters/                 # Exception filters
│   └── interceptors/            # Request interceptors
├── config/                      # Configuration
├── modules/                     # Feature modules
│   ├── openai/                  # OpenAI service
│   ├── firebase/                # Firebase service
│   ├── phonetics/               # Phonetics analysis
│   ├── scoring/                 # Scoring logic
│   └── pronunciation/           # Main pronunciation module
│       ├── dto/                 # Data transfer objects
│       ├── pronunciation.controller.ts
│       ├── pronunciation.service.ts
│       └── pronunciation.module.ts
└── types/                       # TypeScript interfaces
````

#Testing
bash# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

Deployment
Docker
bash# Build image
docker build -t pronunciation-api .

# Run container
docker run -p 8000:8000 --env-file .env pronunciation-api
````

### Environment Variables for Production

Make sure to set all required environment variables in your production environment.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
````

### 26. Create `temp` directory
````bash
mkdir temp
````

### 27. Install all dependencies
````bash
npm install
````

### 28. Run the application
````bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
````

## Summary

Your NestJS API is now complete with:

✅ **NestJS Framework** - Modern, scalable architecture
✅ **OpenAI Integration** - Whisper & TTS APIs
✅ **Firebase Firestore** - Metadata storage
✅ **Swagger Documentation** - Auto-generated API docs
✅ **TypeScript** - Type-safe code
✅ **Modular Design** - Clean, maintainable structure
✅ **Error Handling** - Global exception filters
✅ **Logging** - Request logging interceptor
✅ **Validation** - DTOs with class-validator
✅ **File Upload** - Multer integration
✅ **CORS Support** - Configurable origins

Visit `http://localhost:8000/docs` to see the beautiful Swagger documentation! 🚀