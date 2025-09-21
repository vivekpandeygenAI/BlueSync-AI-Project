# Healthcare AI Backend

A professional FastAPI backend for AI-powered healthcare document processing and test case generation.

## Features

- **Document Processing**: Parse PDF, Word, XML, HTML, and Markdown files
- **AI-Powered Requirements Extraction**: Extract healthcare requirements using Google's Gemini AI
- **Test Case Generation**: Generate comprehensive test cases with compliance tracking
- **JIRA Integration**: Push requirements and test cases to JIRA
- **BigQuery Integration**: Store and manage data in Google Cloud BigQuery
- **Professional Architecture**: Clean separation of concerns with services, models, and API layers

## Architecture Backend

<img width="596" height="150" alt="image" src="https://github.com/user-attachments/assets/38c8b66e-5ad5-473f-9e40-d7cbaee1a16c" />

## Setup

1. **Clone and install dependencies**:
   
   pip install -r requirements.txt
  

2. **Run the application**:
   
   uvicorn main:app --reload
  

4. **Using Docker**:
   
   docker-compose up --build
  

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
