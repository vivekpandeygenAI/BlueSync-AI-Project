"""
File upload and management endpoints
"""
import uuid
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.models.schemas import MultiUploadResponse, FileInfo
from app.services.document_service import document_service
from app.services.database_service import database_service

router = APIRouter()


@router.post("/upload", response_model=MultiUploadResponse)
async def upload_files(
    requirement_files: List[UploadFile] = File([]),
    input_files: List[UploadFile] = File([])
):
    """
    Upload requirement and input files for processing
    """
    try:
        filenames = []
        file_id = str(uuid.uuid4())
        requirement_content = ""
        input_content = ""
        count_req = 0
        count_input = 0
        
        # Check for duplicate filenames
        all_files = requirement_files + input_files
        existing_files = database_service.get_files()
        existing_names = {f["filename"] for f in existing_files}
        
        for file in all_files:
            if file.filename in existing_names:
                raise HTTPException(
                    status_code=400, 
                    detail=f"File '{file.filename}' has already been uploaded"
                )
        
        # Process requirement files
        if requirement_files:
            req_contents = []
            req_names = []
            for file in requirement_files:
                content = await file.read()
                extracted_text = document_service.extract_text_from_bytes(file.filename, content)
                req_contents.append(extracted_text)
                req_names.append(file.filename)
            
            count_req = len(req_contents)
            requirement_content = "\n\n".join(req_contents)
            all_req_names = ",".join(req_names)
            filenames.append(all_req_names)
        
        # Process input files
        if input_files:
            input_contents = []
            input_names = []
            for file in input_files:
                content = await file.read()
                extracted_text = document_service.extract_text_from_bytes(file.filename, content)
                input_contents.append(extracted_text)
                input_names.append(file.filename)
            
            count_input = len(input_contents)
            input_content = "\n\n".join(input_contents)
            all_input_names = ",".join(input_names)
            filenames.append(all_input_names)
        
        # Clean filenames and save to database
        all_file_name = ",".join(filenames)
        all_file_name = all_file_name.replace(".pdf", "").replace(".docx", "").replace(".xml", "").replace(".html", "").replace(".htm", "").replace(".md", "").replace(".txt", "")
        
        database_service.save_file(file_id, all_file_name, requirement_content, input_content)
        
        message = f"Success! {count_req} requirement documents and {count_input} input files were processed."
        
        return MultiUploadResponse(
            file_ids=[file_id], 
            filenames=filenames, 
            message=message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload/extract failed: {e}")


@router.get("/", response_model=List[FileInfo])
def get_files():
    """Get all uploaded files"""
    try:
        return database_service.get_files()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch files: {e}")
