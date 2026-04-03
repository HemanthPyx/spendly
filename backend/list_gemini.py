import google.generativeai as genai
from decouple import config

genai.configure(api_key=config('GEMINI_API_KEY'))
try:
    with open('models.txt', 'w') as f:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                f.write(m.name + '\n')
except Exception as e:
    with open('models.txt', 'w') as f:
        f.write(f"Error: {e}")
