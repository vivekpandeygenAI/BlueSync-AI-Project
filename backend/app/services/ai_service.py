"""
AI service for requirements extraction and test case generation
"""
import os
import json
from typing import List, Dict, Optional
import google.generativeai as genai
from app.core.config import settings
from app.core.exceptions import AIServiceError

# Initialize Gemini
if settings.GOOGLE_API_KEY:
    genai.configure(api_key=settings.GOOGLE_API_KEY)


class AIService:
    """AI service for healthcare document processing"""
    
    def __init__(self):
        self.model = self._get_model()
    
    def _get_model(self):
        """Get Gemini model instance"""
        if not settings.GOOGLE_API_KEY:
            return None
        try:
            return genai.GenerativeModel("gemini-2.0-flash")
        except Exception as e:
            print(f"Error creating AI model: {e}")
            return None
    
    def extract_requirements_from_text(self, text_data: str) -> List[Dict]:
        """
        Extract requirements from text data using AI
        """
        if not self.model or not settings.GOOGLE_API_KEY:
            return self._fallback_requirements()
        
        try:
            prompt = self._build_requirements_prompt(text_data)
            response = self.model.generate_content(
                prompt, 
                generation_config={"response_mime_type": "application/json"}
            )
            
            data = json.loads(response.text or "{}")
            requirements = data.get("requirements", [])
            
            return requirements if requirements else self._fallback_requirements()
            
        except Exception as e:
            print(f"AI requirements extraction failed: {e}")
            return self._fallback_requirements()
    
    def generate_test_cases(self, feature_title: str, feature_desc: str, input_data: str = "") -> List[Dict]:
        """
        Generate test cases for a healthcare system feature/requirement
        """
        if not self.model:
            raise AIServiceError("AI model not available")
        
        try:
            prompt = self._build_test_cases_prompt(feature_title, feature_desc, input_data)
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            data = json.loads(response.text or "{}")
            test_cases = data.get("test_cases", [])
            
            return self._clean_test_cases(test_cases)
            
        except json.JSONDecodeError as e:
            raise AIServiceError(f"Failed to parse AI response: {e}")
        except Exception as e:
            raise AIServiceError(f"Test case generation failed: {e}")
    
    def improve_test_case(self, original_description: str, user_input: str) -> str:
        """
        Improve test case description based on user feedback
        """
        if not self.model:
            raise AIServiceError("AI model not available")
        
        try:
            system = "You are a senior QA engineer. Improve the following test case description based on user feedback."
            user_prompt = (
                f"Original Test Description: {original_description}\n"
                f"User Input: {user_input}\n"
                "Return only the improved test case description as a string."
            )
            
            response = self.model.generate_content(
                [system, user_prompt],
                generation_config={"response_mime_type": "text/plain"}
            )
            
            return response.text.strip() if response.text else original_description
            
        except Exception as e:
            raise AIServiceError(f"Test case improvement failed: {e}")
    
    def _build_requirements_prompt(self, text_data: str) -> str:
        """Build prompt for requirements extraction"""
        return f"""
You are an expert Business Analyst and Software Quality Assurance Engineer specializing in medical software (IEC 62304, FDA, HIPAA). Your task is to analyze the provided healthcare software document and extract a comprehensive list of functional and non-functional requirements.

Instructions:
Scope & Granularity: Extract only requirements that are atomic, testable, and significant. Each requirement must be substantial enough to serve as the basis for generating 4-5 distinct test cases. Avoid trivial or overly broad statements. Focus on requirements that define specific system behaviors, constraints, or capabilities.

Requirement Format: For each requirement you identify, output it in the following structured JSON format:
{{
    "requirements": [
        {{
            "type": "Functional | Non-Functional | Regulatory",
            "title": "A concise, descriptive title for the requirement, ideally under 10 words",
            "description": "A clear, concise, and complete sentence describing the requirement, preferably starting with 'The system shall...'",
            "source": "The specific section or page number from the document where this requirement was found",
            "category": "Data Acquisition | Security | Interoperability | Usability | Analytics | Compliance | etc.",
            "priority": "High | Medium | Low"
        }}
    ]
}}

Document Text to Analyze:
{text_data}

Output (JSON Array):
"""
    
    def _build_test_cases_prompt(self, feature_title: str, feature_desc: str, input_data: str) -> str:
        """Build prompt for test case generation"""
        standards = ["FDA", "IEC 62304", "ISO 9001", "ISO 13485", "ISO 27001"]
        
        system = (
            "You are a senior QA engineer specializing in healthcare system software. "
            "Produce thorough, actionable test cases with good coverage across functional, negative, boundary, performance, security, and compliance dimensions. "
            "Each test case should include step-by-step instructions and an explicit expected result. "
            "All outputs and processing must be privacy-preserving by design, GDPR-ready, and suitable for safe pilots in healthcare environments. "
            "Do not include or infer any real patient data or personally identifiable information (PII)."
        )
        
        user_prompt = (
            "Generate a comprehensive but non-duplicative set of test cases for the healthcare feature below.\n"
            "Return STRICT JSON with this exact schema:\n"
            '{ "test_cases": [\n'
            '  {"test_id": "TC-001", "title": "...", "description": "Step by step instructions...", "input_data": "...", "expected_result": "...", "compliance": ["FDA", "IEC 62304", ...], "risk": "..." }\n'
            ']}\n\n'
            f"Feature Title: {feature_title}\n"
            f"Feature Description: {feature_desc}\n\n"
            f"Compliance options to choose from: {standards}.\n"
            "Risk levels to consider: Choose any one Low, Medium, High, Critical.\n"
            "Only include compliance items that are relevant to the test; omit others.\n"
            f"Input Data for Testing: {input_data if input_data else '[If required, generate realistic dummy data for healthcare system software, strictly non-PII and privacy-preserving]'}\n"
            "For each test case, provide:\n"
            "- Step by step instructions in the description to test the result.\n"
            "- An explicit expected_result field describing the expected outcome.\n"
            "- If input_data is provided, use it; otherwise, generate dummy input_data relevant to healthcare systems, ensuring no PII or sensitive data is present.\n"
            "All outputs must be suitable for GDPR-compliant, privacy-preserving healthcare pilots."
        )
        
        return [system, user_prompt]
    
    def _clean_test_cases(self, test_cases: List[Dict]) -> List[Dict]:
        """Clean and validate test cases"""
        cleaned = []
        allowed_compliance = {"FDA", "IEC 62304", "ISO 9001", "ISO 13485", "ISO 27001"}
        
        for t in test_cases:
            test_id = (t.get("test_id") or "").strip()
            title = (t.get("title") or "").strip()
            desc = (t.get("description") or "").strip()
            
            if test_id and title and desc:
                comp = t.get("compliance") or []
                comp_clean = [c for c in comp if isinstance(c, str) and c in allowed_compliance]
                
                cleaned.append({
                    "test_id": test_id,
                    "title": title,
                    "description": desc,
                    "input_data": t.get("input_data", ""),
                    "expected_result": t.get("expected_result", ""),
                    "compliance": comp_clean,
                    "risk": t.get("risk", "Low"),
                })
        
        return cleaned
    
    def _fallback_requirements(self) -> List[Dict]:
        """Fallback requirements when AI is not available"""
        return [{
            "title": "Healthcare System Requirement",
            "description": "General healthcare system functionality requirement extracted from the provided document.",
            "type": "Functional",
            "source": "Fallback",
            "category": "General",
            "priority": "Medium"
        }]


# Global AI service instance
ai_service = AIService()
