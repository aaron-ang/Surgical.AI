import os
import asyncio
from enum import Enum
from dotenv import load_dotenv
from openai import AsyncOpenAI
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

load_dotenv()

class Tool(str, Enum):
    scissors = "scissors"
    forceps = "forceps"
    gauze = "gauze"

class ObjectContext(BaseModel, use_enum_values=True):
    tool: Tool = Field(...)
    status: str = Field(description="in place, out of place, or missing")


class ImageContext(BaseModel):
    context: list[ObjectContext]

def create_client():
    return AsyncOpenAI(
        api_key=os.environ.get("OPENAI_API_KEY"),
    )

output_parser = JsonOutputParser(pydantic_object=ImageContext)
prompt = """You are given an image containing segmented (highlighted and labeled) surgical tools.
    The surgical site is in the center of the image and it is surrounded by a blue colored cloth.

    Use the image content and segmentation to determine the color and position of the cloth and the objects. 
    Base the decision on whether the object's segmented area is fully on the cloth area in the image.

    {output_format}

    This is very important to my career.
"""
prompt = prompt.format(output_format=output_parser.get_format_instructions())


async def get_response(client, b64_image, class_names):
    # Format the class names into a human-readable list format
    class_list = ', '.join(class_names)

    return await client.chat.completions.create(
        model="gpt-4-turbo",
        temperature=0,
        response_format={ "type": "json_object" },
        messages=[
            {
            "role": "user",
            "content": [
                {
                "type": "text",
                "text": prompt,
                },
                {
                "type": "image_url",
                "image_url": {
                    "url":  f"data:image/jpeg;base64,{b64_image}"
                },
                },
            ],
            }
        ],
    )

async def get_context(b64_image, class_names):
    client = create_client()
    response = await get_response(client, b64_image, class_names)
    return response.choices[0].message.content
    # parser = JsonOutputParser()
    # return parser.parse(response["choices"][0]["message"]["content"][0]["text"])

async def main():
    test_image = "replace"
    class_names = ['forceps', 'gauze', 'scissors']
    res = await get_context(test_image, class_names)
    print(output_parser.parse(res))
    print(res)


asyncio.run(main())