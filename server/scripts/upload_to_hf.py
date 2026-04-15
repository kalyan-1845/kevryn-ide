import os
import sys

def install_hub():
    print("Installing Hugging Face Hub library...")
    os.system(f"{sys.executable} -m pip install huggingface_hub")

try:
    from huggingface_hub import HfApi, login
except ImportError:
    install_hub()
    from huggingface_hub import HfApi, login

def upload_brain():
    print("--- Kevryn Neural Cloud Upload ---")
    
    # Configuration
    repo_id = input("Enter your Hugging Face Repo ID (e.g., your-username/kevryn-neural-core): ")
    token = input("Enter your Hugging Face WRITE Token: ")
    
    model_dir = r"c:\Users\RAVIRAJ JAVVADI\dev-cloud-ide\server\models\kevryn_neural_core"
    files_to_upload = ["adapter_model.safetensors", "adapter_config.json"]
    
    try:
        # Login
        login(token=token)
        api = HfApi()
        
        # Upload
        for file_name in files_to_upload:
            file_path = os.path.join(model_dir, file_name)
            if os.path.exists(file_path):
                print(f"Uploading {file_name}...")
                api.upload_file(
                    path_or_fileobj=file_path,
                    path_in_repo=file_name,
                    repo_id=repo_id,
                    repo_type="model"
                )
            else:
                print(f"Error: {file_name} not found in {model_dir}")
        
        print("\nSUCCESS! Your brain is now in the cloud. 🧠🛰️")
        print(f"Endpoint: https://huggingface.co/{repo_id}")
        
    except Exception as e:
        print(f"\nUpload Failed: {e}")

if __name__ == "__main__":
    upload_brain()
