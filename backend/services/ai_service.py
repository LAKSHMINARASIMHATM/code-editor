"""
AI Service for Flux IDE
Integrates Hugging Face Inference Client (Stable & Official)
"""

import os
from huggingface_hub import InferenceClient
from typing import Dict, List, Optional

class AIService:
    def __init__(self):
        """Initialize the AI service with Hugging Face Inference Client"""
        # Get API key from environment
        self.api_key = os.getenv('HF_API_KEY')
        
        # Initialize the client
        # It handles the modern router.huggingface.co automatically
        self.client = InferenceClient(api_key=self.api_key)
        
        # Use Meta's Llama 3.1 8B Instruct
        self.model_name = 'meta-llama/Llama-3.1-8B-Instruct'
        
        # System prompt for coding assistant
        self.system_prompt = """You are an expert coding assistant integrated into an IDE. 
Your role is to help developers with coding tasks.
Format code blocks with markdown.
"""
    
    async def query(self, user_query: str, code: str = "", file_context: str = "", conversation_history: List[Dict] = None) -> str:
        """Query the AI model using official Inference Client"""
        try:
            # Build messages array
            messages = [{"role": "system", "content": self.system_prompt}]
            
            # Add conversation history
            if conversation_history:
                for msg in conversation_history[-3:]:
                    role = msg.get('role', 'user')
                    content = msg.get('content', '')
                    if role in ['user', 'assistant']:
                        messages.append({"role": role, "content": content})
            
            # Build final context message
            context_msg = ""
            if file_context:
                context_msg += f"File: {file_context}\n"
            if code:
                context_msg += f"Code:\n```\n{code}\n```\n"
            
            messages.append({"role": "user", "content": f"{context_msg}Query: {user_query}"})

            # Call the client
            # huggingface_hub v1.x client.chat_completion is synchronous
            # We can run it in a thread if it blocks too long, but usually it's fast
            response = self.client.chat_completion(
                messages=messages,
                model=self.model_name,
                max_tokens=1024,
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            error_msg = str(e)
            if "403" in error_msg:
                return "❌ Hugging Face API Error: Your token does not have 'Inference Providers' permission. Please go to https://huggingface.co/settings/tokens and ensure your token has 'Inference' scopes enabled."
            return f"❌ Hugging Face Error: {error_msg}"
    
    async def explain_code(self, code: str, language: str = "") -> str:
        return await self.query(f"Explain this {language} code:", code=code)
    
    async def find_bugs(self, code: str, language: str = "") -> str:
        return await self.query(f"Find potential bugs in this {language} code:", code=code)
    
    async def suggest_improvements(self, code: str, language: str = "") -> str:
        return await self.query(f"Suggest improvements for this {language} code:", code=code)
    
    async def refactor(self, code: str, language: str = "") -> str:
        return await self.query(f"Refactor this {language} code:", code=code)
