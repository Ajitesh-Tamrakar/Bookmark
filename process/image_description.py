import os
import ollama
from process.helper_function import update_raw_text_key


def analyze_image(image_path):
    # Verify the file actually exists before sending it to the model
    if not os.path.exists(image_path):
        print(f"Error: The file at '{image_path}' was not found.")
        return

    print("Analyzing image... Please wait...")

    try:
        # Call the local Ollama instance
        response = ollama.chat(
            model='gemma4:e2b',
            messages=[
                {
                    'role': 'user',
                    'content': 'Analyze this image completely. Identify the main subject, any background elements, and describe what is happening.',
                    # Pass the path to the image in the 'images' list
                    'images': [image_path]
                }
            ]
        )

        # Print the model's text response
        # print("\n--- Model Description ---")
        return(response['message']['content'])
        # print("-------------------------")

    except Exception as e:
        print(f"An error occurred: {e}")
        print("Make sure Ollama is running (`ollama serve`) and the model is pulled (`ollama pull gemma4:e2b`).")


def extract_image(bookmark):
    try:
        # TODO: Add VLM summary from captured image bytes when image processing is in scope.
        update_raw_text_key(bookmark, "image", None)
        return {'status': 'success', 'error': ''}
    except Exception as e:
        return {'status': 'failed', 'error': str(e)}


IMAGE_LEAVES = {
    'pinterest': extract_image,
    'twitter': extract_image,
    'linkedin': extract_image,
}


