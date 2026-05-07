import urllib.request
import os

urls = {
    "cb513+profile_split1.npy": "https://zenodo.org/records/7764556/files/cb513+profile_split1.npy.gz?download=1"
}

os.makedirs("dataset", exist_ok=True)

for filename, url in urls.items():
    output_path = os.path.join("dataset", filename)
    if not os.path.exists(output_path):
        print(f"Downloading {filename}...")
        urllib.request.urlretrieve(url, output_path)
        print(f"Finished {filename}")
    else:
        print(f"File {filename} already exists.")
