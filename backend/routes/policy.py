from fastapi import APIRouter, UploadFile, File, HTTPException
from utils.llm import chat_with_solar
from utils.parse import parse_pdf
import os
import tempfile

policy_router = APIRouter()

@policy_router.post("/upload-policy", tags=["Policy"])
async def upload_company_policy(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported for policy.")

    # Create a temporary file to store the uploaded PDF
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name

    try:
        # Parse the PDF to extract text
        policy_text = parse_pdf(temp_file_path)
        
        # Save the extracted text to a file for reference
        policy_path = "data/company_policy.txt"
        with open(policy_path, "w", encoding="utf-8") as f:
            f.write(policy_text)

        # LLM Prompt
        prompt = (
            "Based on the internal policy document below, create a list of specific, testable conditions "
            "that a contract must meet to be compliant. Format your response ONLY as a bullet-point list "
            "starting each line with '- '. Do not include any other text or explanations.\n\n"
            f"{policy_text}"
        )

        # Get the checklist from the LLM
        checklist_text = chat_with_solar(prompt)
        
        # Process the checklist to ensure it's a proper list
        # Split by newlines and filter out empty lines
        checklist_items = [item.strip() for item in checklist_text.split('\n') if item.strip()]
        
        # Remove bullet points or numbering if present
        checklist_items = [item.lstrip('•-*0123456789. ') for item in checklist_items]
        
        # Save the checklist to a file
        checklist_path = "data/policy_checklist.txt"
        with open(checklist_path, "w", encoding="utf-8") as f:
            for item in checklist_items:
                f.write(f"- {item}\n")
        
        return {
            "status": "success",
            "checklist": checklist_items,
            "message": f"Checklist saved to {checklist_path}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process policy: {str(e)}")
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
