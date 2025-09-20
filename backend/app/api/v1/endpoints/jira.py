"""
JIRA integration endpoints
"""
from typing import Dict
from fastapi import APIRouter, HTTPException, Path
from app.models.schemas import JiraPushResponse, ComplianceMetrics
from app.services.jira_service import jira_service
from app.services.database_service import database_service

router = APIRouter()


@router.post("/push/{file_id}", response_model=JiraPushResponse)
def push_test_cases_to_jira(file_id: str = Path(..., description="File ID")):
    """
    Push test cases for a file to JIRA
    """
    try:
        # Get test cases from database
        test_cases_data = database_service.get_test_cases_by_file(file_id)
        
        if not test_cases_data["requirements"]:
            raise HTTPException(status_code=404, detail="No test cases found for given file_id")
        
        # Prepare records for JIRA
        records = []
        for req in test_cases_data["requirements"]:
            for tc in req["test_cases"]:
                records.append({
                    "requirement_id": req["req_title_id"],
                    "req_title": req["req_title"],
                    "req_description": req["requirement_description"],
                    "tc_id": tc["tc_id"],
                    "tc_title": tc["tc_title"],
                    "tc_description": f"Steps:\n{tc['tc_description']}\nExpected Result:\n{tc['expected_result']}\nInput Data:\n{tc['input_data']}",
                    "compliance_tags": tc["compliance_tags"],
                })
        
        # Push to JIRA
        jira_map = jira_service.push_traceability_parallel(records)
        database_service.update_file_status(file_id, "Test Cases Pushed to Jira")
        
        return JiraPushResponse(
            message=f"Pushed {len(records)} test cases for file {file_id} to Jira",
            requirements_pushed=len(jira_map),
            jira_map=jira_map
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Jira push failed: {e}")


@router.get("/compliance-metrics/{file_id}", response_model=ComplianceMetrics)
def get_compliance_metrics(file_id: str = Path(..., description="File ID")):
    """
    Get compliance and risk metrics for a file
    """
    try:
        metrics = database_service.get_compliance_metrics(file_id)
        return ComplianceMetrics(**metrics)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch compliance metrics: {e}")
