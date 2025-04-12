from fastapi import APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import os
import json

router = APIRouter()

class SlackMessage(BaseModel):
    message: str

@router.options("/send")
async def options_slack():
    return {"message": "OK"}

@router.post("/send")
async def send_slack_message(slack_message: SlackMessage):
    try:
        # Получаем абсолютный путь к скрипту
        script_path = os.path.join(os.path.dirname(__file__), "..", "workflows", "slack", "slack_send.py")
        
        # Запускаем скрипт с сообщением
        result = subprocess.run(
            ["python3", script_path, "-m", slack_message.message],
            capture_output=True,
            text=True
        )
        
        # Логируем результат выполнения скрипта
        print(f"Script output: {result.stdout}")
        print(f"Script error: {result.stderr}")
        
        if result.returncode != 0:
            error_message = result.stderr or "Unknown error occurred"
            raise HTTPException(
                status_code=500,
                detail=f"Error executing slack_send.py: {error_message}"
            )
            
        try:
            # Пытаемся распарсить вывод скрипта как JSON
            response_data = json.loads(result.stdout)
            return response_data
        except json.JSONDecodeError:
            # Если вывод не JSON, возвращаем его как есть
            return {"status": "success", "message": result.stdout}
        
    except Exception as e:
        print(f"Error in send_slack_message: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send Slack message: {str(e)}"
        ) 