# Automating Test Case Generation

A professional FastAPI backend for AI-powered healthcare document processing and test case generation.

## Features

- **Document Processing**: Parse PDF, Word, XML, HTML, and Markdown files
- **AI-Powered Requirements Extraction**: Extract healthcare requirements using Google's Gemini AI
- **Test Case Generation**: Generate comprehensive test cases with compliance tracking
- **JIRA Integration**: Push requirements and test cases to JIRA
- **BigQuery Integration**: Store and manage data in Google Cloud BigQuery
- **Professional Architecture**: Clean separation of concerns with services, models, and API layers

## Architecture Backend
```
backend/
├── app/
│ ├── api/v1/endpoints/ # API endpoint handlers
│ ├── core/ # Core configuration and utilities
│ ├── models/ # Pydantic models and schemas
│ ├── services/ # Business logic services
│ └── main.py # FastAPI application entry point
│
├── docker-compose.yml # Docker Compose setup
├── Dockerfile # Docker image build configuration
├── main.py # Optional root entry point
├── requirements.txt # Python dependencies
├── key.json # Service account / key file
└── .env # Environment variables
```

## Setup Backend Using Docker
```bash
cd backend
```
```bash
docker-compose up --build
```
## Setup Frontend 
```bash
cd frontend
```
```bash
npm install
```
```bash
npm start
```
```
frontend/
├── src/
│   ├── App.js - Main React component
│   ├── App.tsx - TypeScript React component
│   ├── App.css - Styling
│   └── index.js - React entry point
├── public/
│   └── index.html - HTML template
└── package.json - Dependencies and scripts
```
   
## API Documentation

- `POST /api/v1/files/upload` - Upload documents
- `POST /api/v1/requirements/{file_id}/extract` - Extract requirements
- `POST /api/v1/test-cases/generate/file/{file_id}` - Generate test cases
- `POST /api/v1/jira/push/{file_id}` - Push to JIRA

## Configuration

Key environment variables:
- `GCP_PROJECT_ID` - Google Cloud project ID
- `GOOGLE_API_KEY` - Gemini API key
- `JIRA_BASE` - JIRA instance URL
- `JIRA_API_TOKEN` - JIRA API token

## Development

The codebase follows modern Python practices:
- Type hints throughout
- Pydantic models for validation
- Dependency injection
- Error handling with custom exceptions
- Async/await where appropriate
- Professional logging and monitoring ready
