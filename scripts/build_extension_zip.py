import os
import zipfile

def build_zip():
    ext_dir = os.path.join(os.path.dirname(__file__), "..", "extension")
    out_dir = os.path.join(os.path.dirname(__file__), "..", "public")
    out_file = os.path.join(out_dir, "voicescribe-extension.zip")

    os.makedirs(out_dir, exist_ok=True)

    with zipfile.ZipFile(out_file, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(ext_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, ext_dir)
                zf.write(full_path, rel_path)
                print(f"Added {rel_path} to zip")

    print(f"\nSuccessfully created: {out_file} ({os.path.getsize(out_file)} bytes)")

if __name__ == "__main__":
    build_zip()
