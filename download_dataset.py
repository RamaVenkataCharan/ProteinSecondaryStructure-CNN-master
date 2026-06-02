import urllib.request
import os
import gzip
import shutil

urls = {
    "cb513+profile_split1.npy": "https://zenodo.org/records/7764556/files/cb513+profile_split1.npy.gz?download=1",
    "cullpdb+profile_6133.npy": "https://zenodo.org/records/7764556/files/cullpdb+profile_6133.npy.gz?download=1",
    "cullpdb+profile_6133_filtered.npy": "https://zenodo.org/records/7764556/files/cullpdb+profile_6133_filtered.npy.gz?download=1",
}

os.makedirs("dataset", exist_ok=True)

for filename, url in urls.items():
    output_path = os.path.join("dataset", filename)

    if os.path.exists(output_path):
        print(f"File {filename} already exists, skipping.")
        continue

    tmp_path = output_path + ".tmp"
    print(f"Downloading {filename}...")
    urllib.request.urlretrieve(url, tmp_path)

    # Check if the file is gzipped or raw npy
    with open(tmp_path, 'rb') as f:
        magic = f.read(2)

    if magic == b'\x1f\x8b':
        # It's a gzip file, decompress
        print(f"Decompressing {filename}...")
        with gzip.open(tmp_path, 'rb') as f_in:
            with open(output_path, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
        os.remove(tmp_path)
    else:
        # Already a raw .npy file
        os.rename(tmp_path, output_path)

    print(f"Finished {filename}")

print("\nAll datasets ready!")
