import os

with open("sample.txt") as f:
    txt = f.read()

print("Sample-all-instructions image!")
print(f"Contents of sample.txt: {txt.strip()}")
print("Working directory is:", os.getcwd())