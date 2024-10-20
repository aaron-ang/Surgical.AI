import os
import base64
import json
import asyncio
from enum import Enum
from PIL import Image
from io import BytesIO
from dotenv import load_dotenv
import google.generativeai as genai
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=api_key)


class Tool(str, Enum):
    scissors = "scissors"
    forceps = "forceps"
    gauze = "gauze"


class ObjectContext(BaseModel, use_enum_values=True):
    tool: Tool = Field(...)
    status: str = Field(description="in place or out of place")


class ImageContext(BaseModel):
    context: list[ObjectContext] = Field(...)


output_parser = JsonOutputParser(pydantic_object=ImageContext)


def create_model():
    model = genai.GenerativeModel(
        "gemini-1.5-flash", generation_config=genai.GenerationConfig(temperature=0)
    )
    return model


async def predict_object_context(model: genai.GenerativeModel, image_b64: str):
    # Decode the base64 image string
    image_data = base64.b64decode(image_b64)

    # Convert the binary data to an image using PIL
    image_context = Image.open(BytesIO(image_data))

    # Define the prompt with the image and class names
    prompt = """
    You are given an image containing segmented (highlighted and labeled) surgical tools.
    The surgical site is in the center of the image and it is surrounded by a colored cloth.
    If the tool is placed fully within the cloth, then it is in place.
    Else, if the tool is partially on the cloth or in the surgical site, then it is out of place.

    {output_format}

    This is very important to my career.
    """

    prompt = prompt.format(output_format=output_parser.get_format_instructions())

    # Generate the content using the model
    result = ""
    async for chunk in await model.generate_content_async(
        [image_context, "\n\n", prompt],
        generation_config={"temperature": 0},
        stream=True,
        request_options={"timeout": 60},
    ):
        result += chunk.text
    return result


async def get_context(image_b64: str):
    model = create_model()
    result = await predict_object_context(model, image_b64)
    result = output_parser.parse(result)
    context = result["context"]
    return {tool["tool"]: tool["status"] for tool in context}


if __name__ == "__main__":
    with open("message.txt", "r") as f:
        img_b64 = f.read()
    result = asyncio.run(get_context(img_b64))
    print(result)
