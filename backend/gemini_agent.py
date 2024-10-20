import os
import base64
import json
import google.generativeai as genai
from dotenv import load_dotenv
from PIL import Image
from io import BytesIO
from langchain_core.output_parsers import JsonOutputParser
load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=api_key)

def create_model():
    model = genai.GenerativeModel(
        "gemini-1.5-flash",
        generation_config=genai.GenerationConfig(temperature=0)
    )
    return model

async def predict_object_context(model, image, class_names):
    # Decode the base64 image string
    image_data = base64.b64decode(image)
    
    # Convert the binary data to an image using PIL
    image_context = Image.open(BytesIO(image_data))
    
    # Format the class names into a human-readable list format
    class_list = ', '.join(class_names)

    # Define the prompt with the image and class names
    prompt = f"""
    You are given an image and a list of class names, each representing a segmented object in the image. 
    Your task is to check whether each object is placed on a blue cloth in the image. 
    The list of class names is: {class_list}.
    
    For each class name, return a JSON object where the key is the class name and the value is a boolean (True or False) 
    indicating if the object is on the blue cloth. Here is the format of the expected output:

    {{
    "class_1": true/false,
    "class_2": true/false,
    "class_3": true/false,
    ...
    }}

    Use the image content and segmentation to determine the color and position of the cloth and the objects. 
    Base the decision on whether the object's segmented area is fully on the blue cloth area in the image.
    """

    # Generate the content using the model
    result = ""
    async for chunk in await model.generate_content_async([image_context, "\n\n", prompt], stream=True):
        result += chunk.text
    return result

async def get_context(image, class_names):
    model = create_model()
    result = await predict_object_context(model, image, class_names)
    parser = JsonOutputParser()
    result = parser.parse(result)
    return json.dumps(result)


